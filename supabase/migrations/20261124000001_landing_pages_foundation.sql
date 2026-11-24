-- Migration: Nền tảng tách biệt Profile vs Landing Page (Phase 1 — Platform CMS)
--
-- 1. Thêm cột public.pages.page_kind ('profile' | 'landing'), mặc định 'profile' (0-downtime, tương thích ngược 100%).
-- 2. Mở rộng CHECK constraint trên public.page_blocks.type bổ sung 9 loại khối Section Landing Page.
-- 3. Cập nhật RPC public.create_page(...) nhận thêm p_page_kind DEFAULT 'profile'.
-- 4. Cập nhật RPC public.get_public_page(p_slug) trả thêm page_kind và workspace_id.
--
-- Chạy lại nhiều lần an toàn (idempotent).

-- ============================================================================
-- 1. PHÂN LOẠI TRANG TRÊN public.pages
-- ============================================================================

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS page_kind text NOT NULL DEFAULT 'profile';

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.pages'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%page_kind%'
  LOOP
    EXECUTE format('ALTER TABLE public.pages DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.pages
  ADD CONSTRAINT pages_page_kind_check CHECK (page_kind IN ('profile', 'landing'));

CREATE INDEX IF NOT EXISTS idx_pages_workspace_kind_active
  ON public.pages (workspace_id, page_kind)
  WHERE archived_at IS NULL;

-- ============================================================================
-- 2. MỞ RỘNG 9 LOẠI KHỐI SECTION LANDING PAGE TRÊN public.page_blocks
-- ============================================================================

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.page_blocks'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%type%link_list%'
  LOOP
    EXECUTE format('ALTER TABLE public.page_blocks DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.page_blocks
  ADD CONSTRAINT page_blocks_type_check CHECK (
    type IN (
      -- Khối nền tảng & Profile (14 khối hiện có)
      'header', 'image', 'heading', 'text', 'link_list', 'social_icons', 'spacer', 'divider',
      'button', 'gallery', 'menu_card', 'accordion', 'video_embed', 'map',
      -- 9 khối Section Landing Page (Platform CMS)
      'hero_section', 'toc_bar', 'stats_strip', 'split_content',
      'info_cards', 'pricing_table', 'product_grid', 'store_locator', 'lead_form'
    )
  );

-- ============================================================================
-- 3. CẬP NHẬT RPC public.create_page HỖ TRỢ p_page_kind
-- ============================================================================

-- Xóa bản 4 tham số cũ trước khi tạo bản 5 tham số (có DEFAULT) để tránh ambiguous overload trong PostgREST
DROP FUNCTION IF EXISTS public.create_page(uuid, text, text, text);

CREATE OR REPLACE FUNCTION public.create_page(
  p_workspace_id uuid,
  p_internal_name text,
  p_slug text,
  p_title text,
  p_page_kind text DEFAULT 'profile'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_norm_slug text := lower(trim(p_slug));
  v_page_kind text := lower(trim(coalesce(p_page_kind, 'profile')));
  v_workspace record;
  v_page_count integer;
  v_page_id uuid;
  v_revision_id uuid;
  v_default_preset text;
BEGIN
  IF v_page_kind NOT IN ('profile', 'landing') THEN
    RAISE EXCEPTION 'Loại trang không hợp lệ: % (chỉ chấp nhận profile hoặc landing)', p_page_kind;
  END IF;

  IF NOT private.can_edit_workspace(p_workspace_id) THEN
    RAISE EXCEPTION 'Bạn không có quyền tạo trang trong workspace này';
  END IF;

  SELECT id, max_pages INTO v_workspace
  FROM public.workspaces
  WHERE id = p_workspace_id AND archived_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace không tồn tại hoặc đã bị lưu trữ';
  END IF;

  SELECT count(*) INTO v_page_count
  FROM public.pages
  WHERE workspace_id = p_workspace_id AND archived_at IS NULL;

  IF v_page_count >= v_workspace.max_pages THEN
    RAISE EXCEPTION 'Workspace đã đạt giới hạn % trang', v_workspace.max_pages;
  END IF;

  IF EXISTS (SELECT 1 FROM public.reserved_slugs WHERE slug = v_norm_slug) THEN
    RAISE EXCEPTION 'Đường dẫn "%" là slug hệ thống được bảo lưu, không thể sử dụng', v_norm_slug;
  END IF;

  INSERT INTO public.pages (workspace_id, page_kind, internal_name, status, created_by)
  VALUES (p_workspace_id, v_page_kind, trim(p_internal_name), 'unpublished', auth.uid())
  RETURNING id INTO v_page_id;

  INSERT INTO public.page_slugs (slug, page_id, is_current)
  VALUES (v_norm_slug, v_page_id, true);

  v_default_preset := CASE
    WHEN v_page_kind = 'landing' THEN 'go-minimal-luxury'
    ELSE 'go-original'
  END;

  INSERT INTO public.page_revisions (page_id, revision_no, state, title, theme, created_by)
  VALUES (
    v_page_id,
    1,
    'draft',
    trim(p_title),
    jsonb_build_object('preset', v_default_preset),
    auth.uid()
  )
  RETURNING id INTO v_revision_id;

  IF v_page_kind = 'landing' THEN
    INSERT INTO public.page_blocks (page_id, revision_id, type, position, payload)
    VALUES (
      v_page_id,
      v_revision_id,
      'hero_section',
      0,
      jsonb_build_object('layout', 'split', 'title', trim(p_title), 'subtitle', '')
    );
  ELSE
    INSERT INTO public.page_blocks (page_id, revision_id, type, position, payload)
    VALUES (
      v_page_id,
      v_revision_id,
      'header',
      0,
      jsonb_build_object('title', trim(p_title), 'bio', '')
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'page_id', v_page_id,
    'revision_id', v_revision_id,
    'slug', v_norm_slug,
    'page_kind', v_page_kind
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_page(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_page(uuid, text, text, text, text) TO authenticated, service_role;

-- Bản cũ (3 tham số) giữ nguyên tương thích ngược
CREATE OR REPLACE FUNCTION public.create_page(
  p_internal_name text,
  p_slug text,
  p_title text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.create_page(
    '00000000-0000-4000-8000-000000000001'::uuid, p_internal_name, p_slug, p_title, 'profile'
  );
$$;

REVOKE ALL ON FUNCTION public.create_page(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_page(text, text, text) TO authenticated, service_role;

-- ============================================================================
-- 4. CẬP NHẬT RPC public.get_public_page TRẢ THÊM page_kind & workspace_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_page(p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_page_id uuid;
  v_workspace_id uuid;
  v_page_kind text;
  v_is_current boolean;
  v_canonical_slug text;
  v_page_status text;
  v_published_rev_id uuid;
  v_revision record;
  v_blocks jsonb;
  v_result jsonb;
BEGIN
  SELECT page_id, is_current INTO v_page_id, v_is_current
  FROM public.page_slugs
  WHERE slug = lower(trim(p_slug));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'reason', 'SLUG_NOT_FOUND');
  END IF;

  IF NOT v_is_current THEN
    SELECT slug INTO v_canonical_slug
    FROM public.page_slugs
    WHERE page_id = v_page_id AND is_current = true;

    RETURN jsonb_build_object('found', true, 'is_alias', true, 'canonical_slug', v_canonical_slug);
  END IF;

  SELECT workspace_id, page_kind, status, published_revision_id
  INTO v_workspace_id, v_page_kind, v_page_status, v_published_rev_id
  FROM public.pages
  WHERE id = v_page_id
    AND archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = public.pages.workspace_id AND w.archived_at IS NULL
    );

  IF v_page_status IS DISTINCT FROM 'published' OR v_published_rev_id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'reason', 'PAGE_UNPUBLISHED');
  END IF;

  SELECT id, title, description, theme, seo INTO v_revision
  FROM public.page_revisions
  WHERE id = v_published_rev_id AND state = 'sealed';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'reason', 'REVISION_NOT_SEALED');
  END IF;

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
    LEFT JOIN public.revision_link_placements pl ON pl.block_id = b.id AND pl.revision_id = v_published_rev_id
    LEFT JOIN public.page_links plk ON plk.id = pl.page_link_id AND plk.archived_at IS NULL
    LEFT JOIN public.links l ON l.id = plk.link_id AND l.is_active = true AND l.archived_at IS NULL
    LEFT JOIN public.media_assets ma ON ma.id = COALESCE(pl.resolved_media_id, l.default_media_id) AND ma.status = 'ready' AND ma.visibility = 'public'
    WHERE b.revision_id = v_published_rev_id AND b.is_visible = true
    GROUP BY b.id, b.type, b.position, b.payload
    ORDER BY b.position ASC
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(bi)), '[]'::jsonb) INTO v_blocks FROM block_items bi;

  v_result := jsonb_build_object(
    'found', true,
    'is_alias', false,
    'workspace_id', v_workspace_id,
    'page_kind', v_page_kind,
    'slug', lower(trim(p_slug)),
    'title', v_revision.title,
    'description', v_revision.description,
    'theme', v_revision.theme,
    'seo', v_revision.seo,
    'blocks', v_blocks
  );

  RETURN v_result;
END;
$function$;
