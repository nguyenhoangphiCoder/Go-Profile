-- Migration: Site Shell dùng chung cho Landing Page (Phase 2 — Platform CMS)
--
-- 1. Tạo bảng public.workspace_site_settings (1-1 với workspaces):
--    Logo (FK media_assets chống xóa nhầm), Header CTA, Footer 3 cột, Nút nổi Zalo/Gọi, Theme mặc định.
-- 2. Tạo bảng public.site_nav_items (Menu 2 cấp tự quản lý):
--    Hỗ trợ target_type ('page' | 'anchor' | 'url'), kéo thả position, trigger giới hạn tối đa 2 cấp
--    và kiểm tra cùng workspace_id.
-- 3. Bật RLS đồng bộ với RBAC (can_read_workspace / can_edit_workspace).
-- 4. Cập nhật RPC public.get_public_page(p_slug) trả kèm site_shell cho trang 'landing' (1 round-trip DB).
--
-- Chạy lại nhiều lần an toàn (idempotent).

-- ============================================================================
-- 1. BẢNG public.workspace_site_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_site_settings (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  site_name text CHECK (site_name IS NULL OR length(trim(site_name)) <= 120),
  logo_media_id uuid REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  header_config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(header_config) = 'object'),
  footer_columns jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(footer_columns) = 'array'),
  floating_contact jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(floating_contact) = 'object'),
  default_theme jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(default_theme) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_workspace_site_settings_updated_at ON public.workspace_site_settings;
CREATE TRIGGER trg_workspace_site_settings_updated_at
  BEFORE UPDATE ON public.workspace_site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE OR REPLACE FUNCTION public.check_site_settings_logo_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_media_ws uuid;
BEGIN
  IF NEW.logo_media_id IS NOT NULL THEN
    SELECT workspace_id INTO v_media_ws
    FROM public.media_assets
    WHERE id = NEW.logo_media_id;

    IF v_media_ws IS DISTINCT FROM NEW.workspace_id THEN
      RAISE EXCEPTION 'Ảnh logo phải thuộc cùng workspace với cấu hình website';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_settings_logo_workspace ON public.workspace_site_settings;
CREATE TRIGGER trg_site_settings_logo_workspace
  BEFORE INSERT OR UPDATE ON public.workspace_site_settings
  FOR EACH ROW EXECUTE FUNCTION public.check_site_settings_logo_workspace();

-- ============================================================================
-- 2. BẢNG public.site_nav_items (MENU 2 CẤP)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.site_nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.site_nav_items(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 60),
  target_type text NOT NULL CHECK (target_type IN ('page', 'anchor', 'url')),
  target_page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  target_value text,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_site_nav_no_self_parent CHECK (parent_id IS DISTINCT FROM id),
  CONSTRAINT chk_site_nav_target_valid CHECK (
    (target_type = 'page' AND target_page_id IS NOT NULL)
    OR (target_type IN ('anchor', 'url') AND length(trim(coalesce(target_value, ''))) > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_site_nav_items_ws_order
  ON public.site_nav_items (workspace_id, parent_id, position);

DROP TRIGGER IF EXISTS trg_site_nav_items_updated_at ON public.site_nav_items;
CREATE TRIGGER trg_site_nav_items_updated_at
  BEFORE UPDATE ON public.site_nav_items
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_site_nav_items_workspace_immutable ON public.site_nav_items;
CREATE TRIGGER trg_site_nav_items_workspace_immutable
  BEFORE UPDATE ON public.site_nav_items
  FOR EACH ROW EXECUTE FUNCTION public.check_workspace_immutable();

CREATE OR REPLACE FUNCTION public.check_site_nav_item_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_parent_ws uuid;
  v_parent_parent_id uuid;
  v_page_ws uuid;
BEGIN
  -- Kiểm tra mục cha: cùng workspace & tối đa 2 cấp
  IF NEW.parent_id IS NOT NULL THEN
    SELECT workspace_id, parent_id INTO v_parent_ws, v_parent_parent_id
    FROM public.site_nav_items
    WHERE id = NEW.parent_id;

    IF NOT FOUND OR v_parent_ws IS DISTINCT FROM NEW.workspace_id THEN
      RAISE EXCEPTION 'Mục menu cha phải thuộc cùng workspace';
    END IF;

    IF v_parent_parent_id IS NOT NULL THEN
      RAISE EXCEPTION 'Thanh menu chỉ hỗ trợ tối đa 2 cấp (không thể lồng cấp 3)';
    END IF;

    -- Nếu chính mục này đang có mục con thì không thể đẩy nó xuống thành cấp 2
    IF TG_OP = 'UPDATE' AND EXISTS (
      SELECT 1 FROM public.site_nav_items WHERE parent_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Mục menu đang chứa mục con không thể chuyển thành mục cấp 2';
    END IF;
  END IF;

  -- Kiểm tra trang đích thuộc cùng workspace
  IF NEW.target_page_id IS NOT NULL THEN
    SELECT workspace_id INTO v_page_ws
    FROM public.pages
    WHERE id = NEW.target_page_id;

    IF v_page_ws IS DISTINCT FROM NEW.workspace_id THEN
      RAISE EXCEPTION 'Trang đích của menu phải thuộc cùng workspace';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_nav_items_integrity ON public.site_nav_items;
CREATE TRIGGER trg_site_nav_items_integrity
  BEFORE INSERT OR UPDATE ON public.site_nav_items
  FOR EACH ROW EXECUTE FUNCTION public.check_site_nav_item_integrity();

-- ============================================================================
-- 3. BẬT RLS & PHÂN QUYỀN THEO WORKSPACE
-- ============================================================================

ALTER TABLE public.workspace_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_nav_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_settings_select ON public.workspace_site_settings;
CREATE POLICY site_settings_select ON public.workspace_site_settings
  FOR SELECT TO authenticated
  USING (private.can_read_workspace(workspace_id));

DROP POLICY IF EXISTS site_settings_write ON public.workspace_site_settings;
CREATE POLICY site_settings_write ON public.workspace_site_settings
  FOR ALL TO authenticated
  USING (private.can_edit_workspace(workspace_id))
  WITH CHECK (private.can_edit_workspace(workspace_id));

DROP POLICY IF EXISTS site_nav_items_select ON public.site_nav_items;
CREATE POLICY site_nav_items_select ON public.site_nav_items
  FOR SELECT TO authenticated
  USING (private.can_read_workspace(workspace_id));

DROP POLICY IF EXISTS site_nav_items_write ON public.site_nav_items;
CREATE POLICY site_nav_items_write ON public.site_nav_items
  FOR ALL TO authenticated
  USING (private.can_edit_workspace(workspace_id))
  WITH CHECK (private.can_edit_workspace(workspace_id));

-- ============================================================================
-- 4. CẬP NHẬT RPC public.get_public_page TRẢ KÈM site_shell CHO LANDING PAGE
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
  v_site_shell jsonb := NULL;
  v_site_settings jsonb;
  v_nav_items jsonb;
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

  -- Chỉ nạp Site Shell (Header/Menu 2 cấp/Footer/Nút nổi) khi trang là Landing Page
  IF v_page_kind = 'landing' THEN
    SELECT jsonb_build_object(
      'site_name', s.site_name,
      'logo_url', ma.object_path,
      'header_config', s.header_config,
      'footer_columns', s.footer_columns,
      'floating_contact', s.floating_contact
    )
    INTO v_site_settings
    FROM public.workspace_site_settings s
    LEFT JOIN public.media_assets ma
      ON ma.id = s.logo_media_id
     AND ma.status = 'ready'
     AND ma.visibility = 'public'
    WHERE s.workspace_id = v_workspace_id;

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
      WHERE n.workspace_id = v_workspace_id
        AND n.is_visible = true
        -- Nếu trỏ tới trang nội bộ thì chỉ hiện khi trang đó đang published (tránh link 404)
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
