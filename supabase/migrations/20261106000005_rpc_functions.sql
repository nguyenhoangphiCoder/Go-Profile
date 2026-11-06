-- Migration 05: Secure Business RPC Functions & Public DTO

-- ==============================================================================
-- 1. get_public_page(p_slug text) -> JSON DTO
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_public_page(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_page_id uuid;
  v_is_current boolean;
  v_canonical_slug text;
  v_page_status text;
  v_published_rev_id uuid;
  v_revision record;
  v_blocks jsonb;
  v_result jsonb;
BEGIN
  -- 1. Tra cứu slug
  SELECT page_id, is_current INTO v_page_id, v_is_current
  FROM public.page_slugs
  WHERE slug = lower(trim(p_slug));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'reason', 'SLUG_NOT_FOUND');
  END IF;

  -- 2. Nếu là alias cũ, tìm canonical slug để client 308 redirect
  IF NOT v_is_current THEN
    SELECT slug INTO v_canonical_slug
    FROM public.page_slugs
    WHERE page_id = v_page_id AND is_current = true;

    RETURN jsonb_build_object(
      'found', true,
      'is_alias', true,
      'canonical_slug', v_canonical_slug
    );
  END IF;

  -- 3. Kiểm tra trạng thái xuất bản của trang
  SELECT status, published_revision_id INTO v_page_status, v_published_rev_id
  FROM public.pages
  WHERE id = v_page_id AND archived_at IS NULL;

  IF v_page_status IS DISTINCT FROM 'published' OR v_published_rev_id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'reason', 'PAGE_UNPUBLISHED');
  END IF;

  -- 4. Đọc revision sealed
  SELECT id, title, description, theme, seo INTO v_revision
  FROM public.page_revisions
  WHERE id = v_published_rev_id AND state = 'sealed';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'reason', 'REVISION_NOT_SEALED');
  END IF;

  -- 5. Lấy danh sách khối và placement hợp lệ
  WITH block_items AS (
    SELECT
      b.id AS block_id,
      b.type,
      b.position,
      b.payload,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'page_link_id', pl.page_link_id,
            'position', pl.position,
            'label', COALESCE(pl.resolved_label, l.default_label),
            'kind', l.kind,
            'target_url', l.target_url,
            'media_url', ma.object_path
          ) ORDER BY pl.position ASC
        ) FILTER (WHERE pl.id IS NOT NULL),
        '[]'::jsonb
      ) AS links
    FROM public.page_blocks b
    LEFT JOIN public.revision_link_placements pl
      ON pl.block_id = b.id AND pl.revision_id = v_published_rev_id
    LEFT JOIN public.page_links plk
      ON plk.id = pl.page_link_id AND plk.archived_at IS NULL
    LEFT JOIN public.links l
      ON l.id = plk.link_id AND l.is_active = true AND l.archived_at IS NULL
    LEFT JOIN public.media_assets ma
      ON ma.id = COALESCE(pl.resolved_media_id, l.default_media_id)
         AND ma.status = 'ready' AND ma.visibility = 'public'
    WHERE b.revision_id = v_published_rev_id AND b.is_visible = true
    GROUP BY b.id, b.type, b.position, b.payload
    ORDER BY b.position ASC
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(bi)), '[]'::jsonb) INTO v_blocks
  FROM block_items bi;

  -- 6. Xây dựng DTO công khai
  v_result := jsonb_build_object(
    'found', true,
    'is_alias', false,
    'slug', lower(trim(p_slug)),
    'title', v_revision.title,
    'description', v_revision.description,
    'theme', v_revision.theme,
    'seo', v_revision.seo,
    'blocks', v_blocks
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_page(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_page(text) TO anon, authenticated, service_role;

-- ==============================================================================
-- 2. resolve_public_link(p_page_link_id uuid)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.resolve_public_link(p_page_link_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_page_id uuid;
  v_link_id uuid;
  v_revision_id uuid;
  v_target_url text;
  v_kind text;
  v_page_status text;
BEGIN
  -- Lấy thông tin page_link và link đích
  SELECT
    plk.page_id,
    plk.link_id,
    p.status,
    p.published_revision_id,
    l.target_url,
    l.kind
  INTO
    v_page_id,
    v_link_id,
    v_page_status,
    v_revision_id,
    v_target_url,
    v_kind
  FROM public.page_links plk
  JOIN public.pages p ON p.id = plk.page_id
  JOIN public.links l ON l.id = plk.link_id
  WHERE plk.id = p_page_link_id
    AND plk.archived_at IS NULL
    AND p.archived_at IS NULL
    AND l.archived_at IS NULL
    AND l.is_active = true;

  IF NOT FOUND OR v_page_status IS DISTINCT FROM 'published' OR v_revision_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'LINK_NOT_FOUND_OR_INACTIVE');
  END IF;

  -- Kiểm tra vị trí link có nằm trong revision đang sealed và được hiển thị không
  IF NOT EXISTS (
    SELECT 1
    FROM public.revision_link_placements rlp
    JOIN public.page_blocks pb ON pb.id = rlp.block_id
    WHERE rlp.revision_id = v_revision_id
      AND rlp.page_link_id = p_page_link_id
      AND pb.is_visible = true
  ) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'LINK_NOT_IN_PUBLISHED_REVISION');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'page_id', v_page_id,
    'link_id', v_link_id,
    'revision_id', v_revision_id,
    'target_url', v_target_url,
    'kind', v_kind
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_public_link(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_public_link(uuid) TO service_role;

-- ==============================================================================
-- 3. record_click(p_event_id, p_page_link_id, p_expected_revision_id)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.record_click(
  p_event_id uuid,
  p_page_link_id uuid,
  p_expected_revision_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_page_id uuid;
  v_link_id uuid;
  v_existing_event record;
BEGIN
  -- Kiểm tra trùng lặp idempotent theo p_event_id
  SELECT id, page_link_id, revision_id INTO v_existing_event
  FROM public.click_events
  WHERE id = p_event_id;

  IF FOUND THEN
    IF v_existing_event.page_link_id = p_page_link_id AND v_existing_event.revision_id = p_expected_revision_id THEN
      RETURN jsonb_build_object('success', true, 'idempotent', true);
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'IDEMPOTENT_EVENT_CONFLICT');
    END IF;
  END IF;

  -- Xác minh quan hệ page_links
  SELECT page_id, link_id INTO v_page_id, v_link_id
  FROM public.page_links
  WHERE id = p_page_link_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PAGE_LINK_NOT_FOUND');
  END IF;

  -- Ghi nhận sự kiện click
  INSERT INTO public.click_events (
    id,
    page_id,
    link_id,
    page_link_id,
    revision_id,
    occurred_at
  ) VALUES (
    p_event_id,
    v_page_id,
    v_link_id,
    p_page_link_id,
    p_expected_revision_id,
    now()
  );

  RETURN jsonb_build_object('success', true, 'idempotent', false);
END;
$$;

REVOKE ALL ON FUNCTION public.record_click(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_click(uuid, uuid, uuid) TO service_role;

-- ==============================================================================
-- 4. create_page(p_internal_name, p_slug, p_title)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_page(
  p_internal_name text,
  p_slug text,
  p_title text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_norm_slug text := lower(trim(p_slug));
  v_page_id uuid;
  v_revision_id uuid;
  v_block_id uuid;
BEGIN
  IF NOT private.is_active_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên đang hoạt động mới có quyền tạo trang';
  END IF;

  -- Kiểm tra reserved slugs
  IF EXISTS (SELECT 1 FROM public.reserved_slugs WHERE slug = v_norm_slug) THEN
    RAISE EXCEPTION 'Đường dẫn "%" là slug hệ thống được bảo lưu, không thể sử dụng', v_norm_slug;
  END IF;

  -- 1. Tạo Page
  INSERT INTO public.pages (internal_name, status, created_by)
  VALUES (trim(p_internal_name), 'unpublished', auth.uid())
  RETURNING id INTO v_page_id;

  -- 2. Tạo Slug chính
  INSERT INTO public.page_slugs (slug, page_id, is_current)
  VALUES (v_norm_slug, v_page_id, true);

  -- 3. Tạo Draft revision đầu tiên
  INSERT INTO public.page_revisions (
    page_id,
    revision_no,
    state,
    title,
    theme,
    created_by
  ) VALUES (
    v_page_id,
    1,
    'draft',
    trim(p_title),
    jsonb_build_object('preset', 'go-original'),
    auth.uid()
  )
  RETURNING id INTO v_revision_id;

  -- 4. Tạo khối header mặc định cho trang
  INSERT INTO public.page_blocks (
    page_id,
    revision_id,
    type,
    position,
    payload
  ) VALUES (
    v_page_id,
    v_revision_id,
    'header',
    0,
    jsonb_build_object('title', trim(p_title), 'bio', '')
  )
  RETURNING id INTO v_block_id;

  RETURN jsonb_build_object(
    'success', true,
    'page_id', v_page_id,
    'revision_id', v_revision_id,
    'slug', v_norm_slug
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_page(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_page(text, text, text) TO authenticated, service_role;

-- ==============================================================================
-- 5. publish_page(p_page_id, p_draft_id, p_expected_page_version, p_expected_draft_version)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.publish_page(
  p_page_id uuid,
  p_draft_id uuid,
  p_expected_page_version bigint,
  p_expected_draft_version bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_page record;
  v_draft record;
BEGIN
  IF NOT private.is_active_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên đang hoạt động mới có quyền xuất bản trang';
  END IF;

  -- Khóa dòng trang
  SELECT id, lock_version, status INTO v_page
  FROM public.pages
  WHERE id = p_page_id AND archived_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trang không tồn tại hoặc đã bị lưu trữ';
  END IF;

  IF v_page.lock_version <> p_expected_page_version THEN
    RAISE EXCEPTION 'Xung đột dữ liệu trang (expected version: %, actual: %)', p_expected_page_version, v_page.lock_version;
  END IF;

  -- Khóa dòng draft revision
  SELECT id, lock_version, state, page_id INTO v_draft
  FROM public.page_revisions
  WHERE id = p_draft_id AND page_id = p_page_id
  FOR UPDATE;

  IF NOT FOUND OR v_draft.state IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Bản nháp không hợp lệ hoặc đã được niêm phong trước đó';
  END IF;

  IF v_draft.lock_version <> p_expected_draft_version THEN
    RAISE EXCEPTION 'Xung đột dữ liệu bản nháp (expected version: %, actual: %)', p_expected_draft_version, v_draft.lock_version;
  END IF;

  -- Resolve nhãn và ảnh cho các link placement trong draft
  UPDATE public.revision_link_placements pl
  SET
    resolved_label = COALESCE(pl.label_override, l.default_label),
    resolved_media_id = COALESCE(pl.media_override_id, l.default_media_id),
    updated_at = now()
  FROM public.page_links plk
  JOIN public.links l ON l.id = plk.link_id
  WHERE pl.page_link_id = plk.id
    AND pl.revision_id = p_draft_id;

  -- Đồng bộ lại bảng revision_media_assets
  DELETE FROM public.revision_media_assets WHERE revision_id = p_draft_id;

  INSERT INTO public.revision_media_assets (revision_id, media_asset_id)
  SELECT DISTINCT p_draft_id, resolved_media_id
  FROM public.revision_link_placements
  WHERE revision_id = p_draft_id AND resolved_media_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- Niêm phong draft revision
  UPDATE public.page_revisions
  SET
    state = 'sealed',
    sealed_at = now(),
    updated_at = now()
  WHERE id = p_draft_id;

  -- Cập nhật con trỏ published_revision_id trên pages
  UPDATE public.pages
  SET
    published_revision_id = p_draft_id,
    status = 'published',
    lock_version = lock_version + 1,
    updated_at = now()
  WHERE id = p_page_id;

  RETURN jsonb_build_object(
    'success', true,
    'page_id', p_page_id,
    'published_revision_id', p_draft_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_page(uuid, uuid, bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_page(uuid, uuid, bigint, bigint) TO authenticated, service_role;

-- ==============================================================================
-- 6. unpublish_page(p_page_id, p_expected_page_version)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.unpublish_page(
  p_page_id uuid,
  p_expected_page_version bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_page record;
BEGIN
  IF NOT private.is_active_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên đang hoạt động mới có quyền ẩn trang';
  END IF;

  SELECT id, lock_version INTO v_page
  FROM public.pages
  WHERE id = p_page_id AND archived_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trang không tồn tại hoặc đã bị lưu trữ';
  END IF;

  IF v_page.lock_version <> p_expected_page_version THEN
    RAISE EXCEPTION 'Xung đột phiên bản trang';
  END IF;

  UPDATE public.pages
  SET
    status = 'unpublished',
    lock_version = lock_version + 1,
    updated_at = now()
  WHERE id = p_page_id;

  RETURN jsonb_build_object('success', true, 'page_id', p_page_id, 'status', 'unpublished');
END;
$$;

REVOKE ALL ON FUNCTION public.unpublish_page(uuid, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unpublish_page(uuid, bigint) TO authenticated, service_role;

-- ==============================================================================
-- 7. rename_page_slug(p_page_id, p_new_slug, p_expected_page_version)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.rename_page_slug(
  p_page_id uuid,
  p_new_slug text,
  p_expected_page_version bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_norm_slug text := lower(trim(p_new_slug));
  v_existing_page_id uuid;
BEGIN
  IF NOT private.is_active_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên đang hoạt động mới có quyền đổi đường dẫn';
  END IF;

  IF EXISTS (SELECT 1 FROM public.reserved_slugs WHERE slug = v_norm_slug) THEN
    RAISE EXCEPTION 'Slug "%" nằm trong danh sách từ khóa hệ thống', v_norm_slug;
  END IF;

  -- Kiểm tra trùng slug với trang khác
  SELECT page_id INTO v_existing_page_id
  FROM public.page_slugs
  WHERE slug = v_norm_slug;

  IF FOUND AND v_existing_page_id <> p_page_id THEN
    RAISE EXCEPTION 'Slug "%" đã được sử dụng bởi trang khác', v_norm_slug;
  END IF;

  -- Chuyển slug hiện tại của trang thành alias (is_current = false)
  UPDATE public.page_slugs
  SET is_current = false
  WHERE page_id = p_page_id AND is_current = true;

  -- Đặt slug mới làm slug hiện tại
  INSERT INTO public.page_slugs (slug, page_id, is_current)
  VALUES (v_norm_slug, p_page_id, true)
  ON CONFLICT (slug) DO UPDATE
  SET is_current = true;

  -- Tăng version trang
  UPDATE public.pages
  SET
    lock_version = lock_version + 1,
    updated_at = now()
  WHERE id = p_page_id;

  RETURN jsonb_build_object('success', true, 'new_slug', v_norm_slug);
END;
$$;

REVOKE ALL ON FUNCTION public.rename_page_slug(uuid, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rename_page_slug(uuid, text, bigint) TO authenticated, service_role;

-- ==============================================================================
-- 8. get_click_report(from, to, page_id, link_id, timezone)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_click_report(
  p_from timestamptz,
  p_to timestamptz,
  p_page_id uuid DEFAULT NULL,
  p_link_id uuid DEFAULT NULL,
  p_timezone text DEFAULT 'Asia/Ho_Chi_Minh'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total_clicks bigint;
  v_clicks_by_date jsonb;
  v_clicks_by_page jsonb;
  v_clicks_by_link jsonb;
BEGIN
  IF NOT private.is_active_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên đang hoạt động mới có quyền xem báo cáo thống kê';
  END IF;

  -- Tổng số click trong khoảng thời gian [from, to)
  SELECT count(*) INTO v_total_clicks
  FROM public.click_events c
  WHERE c.occurred_at >= p_from
    AND c.occurred_at < p_to
    AND (p_page_id IS NULL OR c.page_id = p_page_id)
    AND (p_link_id IS NULL OR c.link_id = p_link_id);

  -- Thống kê theo ngày theo múi giờ p_timezone
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', day_str,
        'clicks', click_count
      ) ORDER BY day_str ASC
    ),
    '[]'::jsonb
  ) INTO v_clicks_by_date
  FROM (
    SELECT
      to_char(c.occurred_at AT TIME ZONE p_timezone, 'YYYY-MM-DD') AS day_str,
      count(*) AS click_count
    FROM public.click_events c
    WHERE c.occurred_at >= p_from
      AND c.occurred_at < p_to
      AND (p_page_id IS NULL OR c.page_id = p_page_id)
      AND (p_link_id IS NULL OR c.link_id = p_link_id)
    GROUP BY day_str
  ) d;

  -- Thống kê theo trang
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'page_id', p.id,
        'internal_name', p.internal_name,
        'slug', ps.slug,
        'clicks', count(c.id)
      ) ORDER BY count(c.id) DESC
    ),
    '[]'::jsonb
  ) INTO v_clicks_by_page
  FROM public.pages p
  LEFT JOIN public.page_slugs ps ON ps.page_id = p.id AND ps.is_current = true
  LEFT JOIN public.click_events c
    ON c.page_id = p.id
    AND c.occurred_at >= p_from
    AND c.occurred_at < p_to
    AND (p_link_id IS NULL OR c.link_id = p_link_id)
  WHERE (p_page_id IS NULL OR p.id = p_page_id)
  GROUP BY p.id, p.internal_name, ps.slug;

  -- Thống kê theo link
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'link_id', l.id,
        'label', l.default_label,
        'target_url', l.target_url,
        'kind', l.kind,
        'clicks', count(c.id)
      ) ORDER BY count(c.id) DESC
    ),
    '[]'::jsonb
  ) INTO v_clicks_by_link
  FROM public.links l
  LEFT JOIN public.click_events c
    ON c.link_id = l.id
    AND c.occurred_at >= p_from
    AND c.occurred_at < p_to
    AND (p_page_id IS NULL OR c.page_id = p_page_id)
  WHERE (p_link_id IS NULL OR l.id = p_link_id)
  GROUP BY l.id, l.default_label, l.target_url, l.kind;

  RETURN jsonb_build_object(
    'total_clicks', v_total_clicks,
    'timezone', p_timezone,
    'from', p_from,
    'to', p_to,
    'by_date', v_clicks_by_date,
    'by_page', v_clicks_by_page,
    'by_link', v_clicks_by_link
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_click_report(timestamptz, timestamptz, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_click_report(timestamptz, timestamptz, uuid, uuid, text) TO authenticated, service_role;

