-- Migration: Hoàn thiện workspace (giai đoạn 5)
--
-- 1. Workspace đã lưu trữ: trang công khai trả "không tìm thấy" và link /r/{id} không chuyển hướng.
--    Hai hàm dưới đây lấy NGUYÊN VĂN định nghĩa đang chạy trên production (pg_get_functiondef,
--    17/11/2026 — khác bản trong migration 20261106000005), chỉ thêm điều kiện workspace.
--    CREATE OR REPLACE giữ nguyên quyền EXECUTE hiện có.
-- 2. Bỏ DEFAULT workspace Gờ Cafe của cột workspace_id: ứng dụng (từ giai đoạn 5b) luôn truyền
--    workspace tường minh; bản ghi thiếu workspace sẽ bị từ chối thay vì lặng lẽ vào Gờ Cafe.
-- Chạy lại nhiều lần an toàn.

-- 1a. get_public_page
CREATE OR REPLACE FUNCTION public.get_public_page(p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  SELECT status, published_revision_id INTO v_page_status, v_published_rev_id
  FROM public.pages
  WHERE id = v_page_id
    AND archived_at IS NULL
    -- Workspace đã lưu trữ: trang công khai không hiển thị nữa
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

-- 1b. resolve_public_link
CREATE OR REPLACE FUNCTION public.resolve_public_link(p_page_link_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_page_id uuid;
  v_link_id uuid;
  v_revision_id uuid;
  v_target_url text;
  v_kind text;
  v_page_status text;
BEGIN
  SELECT plk.page_id, plk.link_id, p.status, p.published_revision_id, l.target_url, l.kind
  INTO v_page_id, v_link_id, v_page_status, v_revision_id, v_target_url, v_kind
  FROM public.page_links plk
  JOIN public.pages p ON p.id = plk.page_id
  -- Workspace đã lưu trữ: link không chuyển hướng / ghi nhận click nữa
  JOIN public.workspaces w ON w.id = p.workspace_id AND w.archived_at IS NULL
  JOIN public.links l ON l.id = plk.link_id
  WHERE plk.id = p_page_link_id
    AND plk.archived_at IS NULL
    AND p.archived_at IS NULL
    AND l.archived_at IS NULL
    AND l.is_active = true;

  IF NOT FOUND OR v_page_status IS DISTINCT FROM 'published' OR v_revision_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'LINK_NOT_FOUND_OR_INACTIVE');
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
$function$;

-- 2. Bỏ DEFAULT workspace_id
ALTER TABLE public.pages ALTER COLUMN workspace_id DROP DEFAULT;
ALTER TABLE public.links ALTER COLUMN workspace_id DROP DEFAULT;
ALTER TABLE public.media_assets ALTER COLUMN workspace_id DROP DEFAULT;
ALTER TABLE public.theme_presets ALTER COLUMN workspace_id DROP DEFAULT;
