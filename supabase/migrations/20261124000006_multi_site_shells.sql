-- Migration: Nhiều bộ Menu / Site Shell trong cùng 1 Workspace (Multi-Site Shells)
--
-- 1. Tạo bảng public.site_shells (mỗi workspace có thể tạo nhiều bộ Menu/Header/Footer/Floating Contact riêng).
--    Mỗi workspace có đúng 1 bộ mặc định (is_default = true) thông qua unique partial index.
-- 2. Tự động di chuyển dữ liệu hiện có từ workspace_site_settings sang site_shells (0-downtime).
-- 3. Thêm cột site_nav_items.shell_id -> site_shells(id) và backfill dữ liệu cũ; cập nhật trigger 2 cấp cùng shell.
-- 4. Thêm cột pages.site_shell_id -> site_shells(id) (NULL = tự dùng bộ mặc định của workspace).
-- 5. Cập nhật RPC public.get_public_page(p_slug) đọc đúng bộ Site Shell được gán cho từng trang Landing Page.
--
-- Chạy lại nhiều lần an toàn (idempotent).

-- ============================================================================
-- 1. BẢNG public.site_shells
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.site_shells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  is_default boolean NOT NULL DEFAULT false,
  site_name text CHECK (site_name IS NULL OR length(trim(site_name)) <= 120),
  logo_media_id uuid REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  header_config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(header_config) = 'object'),
  footer_columns jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(footer_columns) = 'array'),
  floating_contact jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(floating_contact) = 'object'),
  default_theme jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(default_theme) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_shells_workspace
  ON public.site_shells (workspace_id, is_default DESC, created_at ASC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_site_shells_default_per_ws
  ON public.site_shells (workspace_id)
  WHERE is_default = true;

DROP TRIGGER IF EXISTS trg_site_shells_updated_at ON public.site_shells;
CREATE TRIGGER trg_site_shells_updated_at
  BEFORE UPDATE ON public.site_shells
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_site_shells_logo_workspace ON public.site_shells;
CREATE TRIGGER trg_site_shells_logo_workspace
  BEFORE INSERT OR UPDATE ON public.site_shells
  FOR EACH ROW EXECUTE FUNCTION public.check_site_settings_logo_workspace();

-- Bật RLS đồng bộ RBAC
ALTER TABLE public.site_shells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_shells_read ON public.site_shells;
CREATE POLICY site_shells_read ON public.site_shells
  FOR SELECT TO authenticated
  USING (private.can_read_workspace(workspace_id));

DROP POLICY IF EXISTS site_shells_write ON public.site_shells;
CREATE POLICY site_shells_write ON public.site_shells
  FOR ALL TO authenticated
  USING (private.can_edit_workspace(workspace_id))
  WITH CHECK (private.can_edit_workspace(workspace_id));

-- ============================================================================
-- 2. MIGRATE DỮ LIỆU CŨ TỪ workspace_site_settings -> site_shells
-- ============================================================================

INSERT INTO public.site_shells (
  workspace_id,
  name,
  is_default,
  site_name,
  logo_media_id,
  header_config,
  footer_columns,
  floating_contact,
  default_theme
)
SELECT
  s.workspace_id,
  COALESCE(NULLIF(trim(s.site_name), ''), w.name, 'Website Chính'),
  true,
  s.site_name,
  s.logo_media_id,
  s.header_config,
  s.footer_columns,
  s.floating_contact,
  s.default_theme
FROM public.workspace_site_settings s
JOIN public.workspaces w ON w.id = s.workspace_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_shells sh
  WHERE sh.workspace_id = s.workspace_id AND sh.is_default = true
);

-- Đảm bảo mọi workspace đang hoạt động đều có ít nhất 1 bộ Site Shell mặc định
INSERT INTO public.site_shells (workspace_id, name, is_default, site_name)
SELECT w.id, COALESCE(NULLIF(trim(w.name), ''), 'Website Chính'), true, w.name
FROM public.workspaces w
WHERE w.archived_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.site_shells sh WHERE sh.workspace_id = w.id
  );

-- ============================================================================
-- 3. GẮN shell_id CHO public.site_nav_items & TRIGGER CÙNG SHELL
-- ============================================================================

ALTER TABLE public.site_nav_items
  ADD COLUMN IF NOT EXISTS shell_id uuid REFERENCES public.site_shells(id) ON DELETE CASCADE;

UPDATE public.site_nav_items n
SET shell_id = sh.id
FROM public.site_shells sh
WHERE sh.workspace_id = n.workspace_id
  AND sh.is_default = true
  AND n.shell_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_site_nav_items_shell_order
  ON public.site_nav_items (shell_id, parent_id, position);

CREATE OR REPLACE FUNCTION public.check_site_nav_item_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_parent_parent_id uuid;
  v_parent_ws uuid;
  v_parent_shell uuid;
  v_shell_ws uuid;
  v_page_ws uuid;
BEGIN
  -- Tự gán shell mặc định của workspace nếu chưa truyền shell_id
  IF NEW.shell_id IS NULL THEN
    SELECT id INTO NEW.shell_id
    FROM public.site_shells
    WHERE workspace_id = NEW.workspace_id
    ORDER BY is_default DESC, created_at ASC
    LIMIT 1;
  END IF;

  IF NEW.shell_id IS NOT NULL THEN
    SELECT workspace_id INTO v_shell_ws
    FROM public.site_shells
    WHERE id = NEW.shell_id;

    IF v_shell_ws IS DISTINCT FROM NEW.workspace_id THEN
      RAISE EXCEPTION 'Bộ Menu (Site Shell) phải thuộc cùng workspace';
    END IF;
  END IF;

  IF NEW.parent_id IS NOT NULL THEN
    SELECT parent_id, workspace_id, shell_id
    INTO v_parent_parent_id, v_parent_ws, v_parent_shell
    FROM public.site_nav_items
    WHERE id = NEW.parent_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Mục menu cha không tồn tại';
    END IF;

    IF v_parent_ws IS DISTINCT FROM NEW.workspace_id THEN
      RAISE EXCEPTION 'Mục menu con phải thuộc cùng workspace với mục cha';
    END IF;

    IF v_parent_shell IS DISTINCT FROM NEW.shell_id THEN
      RAISE EXCEPTION 'Mục menu con phải thuộc cùng bộ Menu (Site Shell) với mục cha';
    END IF;

    IF v_parent_parent_id IS NOT NULL THEN
      RAISE EXCEPTION 'Thanh menu chỉ hỗ trợ tối đa 2 cấp (không thể lồng cấp 3)';
    END IF;
  END IF;

  IF NEW.target_type = 'page' AND NEW.target_page_id IS NOT NULL THEN
    SELECT workspace_id INTO v_page_ws
    FROM public.pages
    WHERE id = NEW.target_page_id;

    IF v_page_ws IS DISTINCT FROM NEW.workspace_id THEN
      RAISE EXCEPTION 'Trang đích phải thuộc cùng workspace';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. GẮN site_shell_id CHO public.pages (NULL = DÙNG BỘ MẶC ĐỊNH)
-- ============================================================================

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS site_shell_id uuid REFERENCES public.site_shells(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pages_site_shell_id
  ON public.pages (site_shell_id)
  WHERE site_shell_id IS NOT NULL;

-- ============================================================================
-- 5. CẬP NHẬT RPC public.get_public_page(p_slug) ĐỌC ĐÚNG BỘ SITE SHELL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_page(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_page_id uuid;
  v_workspace_id uuid;
  v_page_kind text;
  v_page_shell_id uuid;
  v_resolved_shell_id uuid;
  v_is_current boolean;
  v_canonical_slug text;
  v_page_status text;
  v_published_rev_id uuid;
  v_revision record;
  v_blocks jsonb;
  v_site_settings jsonb;
  v_nav_items jsonb;
  v_site_shell jsonb := NULL;
  v_result jsonb;
BEGIN
  SELECT page_id, is_current INTO v_page_id, v_is_current
  FROM public.page_slugs
  WHERE slug = lower(trim(p_slug));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'reason', 'NOT_FOUND');
  END IF;

  IF NOT v_is_current THEN
    SELECT slug INTO v_canonical_slug
    FROM public.page_slugs
    WHERE page_id = v_page_id AND is_current = true;

    RETURN jsonb_build_object('found', true, 'is_alias', true, 'canonical_slug', v_canonical_slug);
  END IF;

  SELECT workspace_id, page_kind, site_shell_id, status, published_revision_id
  INTO v_workspace_id, v_page_kind, v_page_shell_id, v_page_status, v_published_rev_id
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

  -- Chỉ nạp Site Shell (Header/Menu 2 cấp/Footer/Nút nổi) khi trang là Landing Page
  IF v_page_kind = 'landing' THEN
    -- Ưu tiên site_shell_id gán riêng trên trang; nếu NULL thì lấy bộ mặc định của workspace
    IF v_page_shell_id IS NOT NULL THEN
      SELECT id INTO v_resolved_shell_id
      FROM public.site_shells
      WHERE id = v_page_shell_id AND workspace_id = v_workspace_id;
    END IF;

    IF v_resolved_shell_id IS NULL THEN
      SELECT id INTO v_resolved_shell_id
      FROM public.site_shells
      WHERE workspace_id = v_workspace_id
      ORDER BY is_default DESC, created_at ASC
      LIMIT 1;
    END IF;

    IF v_resolved_shell_id IS NOT NULL THEN
      SELECT jsonb_build_object(
        'site_name', s.site_name,
        'logo_url', ma.object_path,
        'header_config', s.header_config,
        'footer_columns', s.footer_columns,
        'floating_contact', s.floating_contact
      )
      INTO v_site_settings
      FROM public.site_shells s
      LEFT JOIN public.media_assets ma
        ON ma.id = s.logo_media_id
       AND ma.status = 'ready'
       AND ma.visibility = 'public'
      WHERE s.id = v_resolved_shell_id;

      WITH visible_nav AS (
        SELECT
          n.id,
          n.parent_id,
          n.label,
          n.target_type,
          n.target_value,
          n.position,
          ps.slug AS target_slug
        FROM public.site_nav_items n
        LEFT JOIN public.pages p
          ON p.id = n.target_page_id
         AND p.archived_at IS NULL
         AND p.status = 'published'
        LEFT JOIN public.page_slugs ps
          ON ps.page_id = p.id
         AND ps.is_current = true
        WHERE n.shell_id = v_resolved_shell_id
          AND n.is_visible = true
          AND (n.target_type <> 'page' OR ps.slug IS NOT NULL)
        ORDER BY n.parent_id NULLS FIRST, n.position ASC, n.created_at ASC
      )
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', vn.id,
            'parent_id', vn.parent_id,
            'label', vn.label,
            'target_type', vn.target_type,
            'target_slug', vn.target_slug,
            'target_value', vn.target_value,
            'position', vn.position
          )
        ),
        '[]'::jsonb
      )
      INTO v_nav_items
      FROM visible_nav vn;
    END IF;

    v_site_shell := jsonb_build_object(
      'settings', COALESCE(
        v_site_settings,
        jsonb_build_object(
          'site_name', NULL,
          'logo_url', NULL,
          'header_config', '{}'::jsonb,
          'footer_columns', '[]'::jsonb,
          'floating_contact', '{}'::jsonb
        )
      ),
      'nav_items', COALESCE(v_nav_items, '[]'::jsonb)
    );
  END IF;

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
    'blocks', v_blocks,
    'site_shell', v_site_shell
  );

  RETURN v_result;
END;
$function$;
