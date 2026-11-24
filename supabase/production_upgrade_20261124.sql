-- ============================================================================
-- GOCAFE.PROFILE — PRODUCTION UPGRADE SQL (7 MIGRATIONS: 20261124000001 -> 000007)
-- 100% 0-downtime, idempotent (chỉ thêm bảng/cột/index/RLS/RPC mới, KHÔNG xóa dữ liệu cũ)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MIGRATION: 20261124000001_landing_pages_foundation.sql
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- MIGRATION: 20261124000002_site_shell.sql
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- MIGRATION: 20261124000003_branches.sql
-- ----------------------------------------------------------------------------

-- Migration: Hệ thống Chi nhánh & Bản đồ tương tác 2 chiều (Phase 4 — Platform CMS)
--
-- 1. Tạo bảng public.branches quản lý danh sách chi nhánh (55+ quán) theo workspace.
--    Hỗ trợ ràng buộc tọa độ lat/lng hợp lệ, ẩn/hiện nhanh (is_active), xóa mềm (archived_at).
-- 2. Bật RLS đồng bộ RBAC (can_read_workspace / can_edit_workspace).
-- 3. Tạo RPC công khai public.get_public_branches(p_workspace_id uuid) chỉ đọc chi nhánh đang mở.
--
-- Chạy lại nhiều lần an toàn (idempotent).

-- ============================================================================
-- 1. BẢNG public.branches
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  code text CHECK (code IS NULL OR length(trim(code)) <= 40),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  address text NOT NULL CHECK (length(trim(address)) BETWEEN 1 AND 300),
  district text NOT NULL DEFAULT '' CHECK (length(district) <= 80),
  city text NOT NULL DEFAULT 'TP.HCM' CHECK (length(city) <= 80),
  phone text CHECK (phone IS NULL OR length(trim(phone)) <= 30),
  hours text CHECK (hours IS NULL OR length(trim(hours)) <= 80),
  lat double precision CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90)),
  lng double precision CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180)),
  maps_url text CHECK (maps_url IS NULL OR length(maps_url) <= 1000),
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  is_active boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branches_ws_active
  ON public.branches (workspace_id, position, name)
  WHERE is_active = true AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_branches_ws_district
  ON public.branches (workspace_id, district)
  WHERE archived_at IS NULL;

DROP TRIGGER IF EXISTS trg_branches_updated_at ON public.branches;
CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_branches_workspace_immutable ON public.branches;
CREATE TRIGGER trg_branches_workspace_immutable
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.check_workspace_immutable();

-- ============================================================================
-- 2. BẬT RLS & PHÂN QUYỀN THEO WORKSPACE
-- ============================================================================

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS branches_select ON public.branches;
CREATE POLICY branches_select ON public.branches
  FOR SELECT TO authenticated
  USING (private.can_read_workspace(workspace_id));

DROP POLICY IF EXISTS branches_write ON public.branches;
CREATE POLICY branches_write ON public.branches
  FOR ALL TO authenticated
  USING (private.can_edit_workspace(workspace_id))
  WITH CHECK (private.can_edit_workspace(workspace_id));

-- ============================================================================
-- 3. RPC CÔNG KHAI: public.get_public_branches(p_workspace_id)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_branches(p_workspace_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'code', b.code,
        'name', b.name,
        'address', b.address,
        'district', b.district,
        'city', b.city,
        'phone', b.phone,
        'hours', b.hours,
        'lat', b.lat,
        'lng', b.lng,
        'maps_url', b.maps_url,
        'position', b.position
      )
      ORDER BY b.position ASC, b.name ASC
    ),
    '[]'::jsonb
  )
  FROM public.branches b
  JOIN public.workspaces w
    ON w.id = b.workspace_id
   AND w.archived_at IS NULL
  WHERE b.workspace_id = p_workspace_id
    AND b.is_active = true
    AND b.archived_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.get_public_branches(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_branches(uuid) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- MIGRATION: 20261124000004_leads.sql
-- ----------------------------------------------------------------------------

-- Migration: Thu thập & Quản lý Khách hàng tiềm năng Leads (Phase 5 — Platform CMS)
--
-- 1. Tạo bảng public.leads lưu thông tin khách đăng ký (Nhượng quyền, Báo giá sỉ, Mẫu thử, Ứng tuyển)
--    kèm nguồn UTM và ip_hash (SHA-256, không lưu IP thô — tuân thủ NĐ 13/2023/NĐ-CP).
-- 2. Khóa chặt RLS: chặn 100% quyền của anon (kể cả INSERT) để chống bot gọi thẳng REST API.
--    Khách gửi form đi qua Next.js Route Handler POST /api/leads (Zod + Honeypot + Rate Limit).
--
-- Chạy lại nhiều lần an toàn (idempotent).

-- ============================================================================
-- 1. BẢNG public.leads
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  form_name text NOT NULL CHECK (length(trim(form_name)) BETWEEN 1 AND 80),
  full_name text NOT NULL CHECK (length(trim(full_name)) BETWEEN 1 AND 120),
  phone text NOT NULL CHECK (length(trim(phone)) BETWEEN 8 AND 20),
  email text CHECK (email IS NULL OR length(trim(email)) <= 160),
  note text CHECK (note IS NULL OR length(note) <= 2000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'spam')),
  utm_source text CHECK (utm_source IS NULL OR length(utm_source) <= 100),
  utm_medium text CHECK (utm_medium IS NULL OR length(utm_medium) <= 100),
  utm_campaign text CHECK (utm_campaign IS NULL OR length(utm_campaign) <= 120),
  ip_hash text CHECK (ip_hash IS NULL OR length(ip_hash) <= 128),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_ws_status_created
  ON public.leads (workspace_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_rate_limit
  ON public.leads (workspace_id, ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_leads_workspace_immutable ON public.leads;
CREATE TRIGGER trg_leads_workspace_immutable
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.check_workspace_immutable();

-- ============================================================================
-- 2. BẬT RLS — KHÓA CHẶT anon 100%
-- ============================================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Tuyệt đối KHÔNG tạo policy cho anon (chặn cả SELECT lẫn INSERT trực tiếp từ client)
DROP POLICY IF EXISTS leads_select ON public.leads;
CREATE POLICY leads_select ON public.leads
  FOR SELECT TO authenticated
  USING (private.can_read_workspace(workspace_id));

DROP POLICY IF EXISTS leads_update ON public.leads;
CREATE POLICY leads_update ON public.leads
  FOR UPDATE TO authenticated
  USING (private.can_edit_workspace(workspace_id))
  WITH CHECK (private.can_edit_workspace(workspace_id));

DROP POLICY IF EXISTS leads_delete ON public.leads;
CREATE POLICY leads_delete ON public.leads
  FOR DELETE TO authenticated
  USING (private.can_edit_workspace(workspace_id));

-- ----------------------------------------------------------------------------
-- MIGRATION: 20261124000005_landing_blocks_p1.sql
-- ----------------------------------------------------------------------------

-- Migration: Bổ sung 3 khối Landing Page nâng cao (Gói P1 — Platform CMS)
--   - banner_slider: Banner trượt nhiều ảnh (Slider / Carousel)
--   - testimonials: Đánh giá khách hàng / Đối tác (Testimonials)
--   - cta_banner: Dải kêu gọi hành động nổi bật (CTA Banner)
--
-- Chạy lại nhiều lần an toàn (idempotent, 0-downtime).

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
      -- 14 khối gốc (Profile + Landing dùng chung)
      'header',
      'image',
      'heading',
      'text',
      'link_list',
      'social_icons',
      'spacer',
      'divider',
      'button',
      'gallery',
      'menu_card',
      'accordion',
      'video_embed',
      'map',
      -- 9 khối Landing Page Phase 1-5
      'hero_section',
      'toc_bar',
      'stats_strip',
      'split_content',
      'info_cards',
      'pricing_table',
      'product_grid',
      'store_locator',
      'lead_form',
      -- 3 khối Landing Page nâng cao P1
      'banner_slider',
      'testimonials',
      'cta_banner'
    )
  );

-- ----------------------------------------------------------------------------
-- MIGRATION: 20261124000006_multi_site_shells.sql
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- MIGRATION: 20261124000007_multitenant_superadmin.sql
-- ----------------------------------------------------------------------------

-- Migration: Nâng cấp Đa Tenant (Multi-Tenant) & SuperAdmin Control Center (MT-1)
--
-- 1. Mở rộng bảng public.workspaces: plan, features (jsonb), max_branches, max_shells.
-- 2. Tạo bảng public.workspace_domains (định tuyến tên miền riêng theo Tenant, dùng cho MT-3).
-- 3. Tạo bảng public.platform_audit_logs (nhật ký thao tác SuperAdmin, chỉ is_active_admin được đọc).
--
-- Chạy lại nhiều lần an toàn (idempotent, 0-downtime).

-- ============================================================================
-- 1. MỞ RỘNG public.workspaces
-- ============================================================================

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'pro'
    CHECK (plan IN ('free', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL
    DEFAULT '{"landing":true,"branches":true,"leads":true,"tracking":true,"customDomains":false}'::jsonb
    CHECK (jsonb_typeof(features) = 'object'),
  ADD COLUMN IF NOT EXISTS max_branches integer NOT NULL DEFAULT 100
    CHECK (max_branches >= 0),
  ADD COLUMN IF NOT EXISTS max_shells integer NOT NULL DEFAULT 10
    CHECK (max_shells >= 1);

-- Nâng cấp workspace mặc định Gờ Café lên gói Enterprise
UPDATE public.workspaces
SET
  plan = 'enterprise',
  features = '{"landing":true,"branches":true,"leads":true,"tracking":true,"customDomains":true}'::jsonb,
  max_branches = GREATEST(max_branches, 500),
  max_shells = GREATEST(max_shells, 50)
WHERE id = '00000000-0000-4000-8000-000000000001';

-- ============================================================================
-- 2. BẢNG public.workspace_domains (Custom Domains cho từng Tenant)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  domain text NOT NULL CHECK (
    length(trim(domain)) BETWEEN 3 AND 253
    AND domain = lower(trim(domain))
    AND position(' ' IN domain) = 0
  ),
  home_page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_domains_domain
  ON public.workspace_domains (domain);

CREATE INDEX IF NOT EXISTS idx_workspace_domains_workspace
  ON public.workspace_domains (workspace_id);

DROP TRIGGER IF EXISTS trg_workspace_domains_updated_at ON public.workspace_domains;
CREATE TRIGGER trg_workspace_domains_updated_at
  BEFORE UPDATE ON public.workspace_domains
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE OR REPLACE FUNCTION public.check_workspace_domain_home_page()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_page_ws uuid;
BEGIN
  IF NEW.home_page_id IS NOT NULL THEN
    SELECT workspace_id INTO v_page_ws
    FROM public.pages
    WHERE id = NEW.home_page_id;

    IF v_page_ws IS NULL OR v_page_ws <> NEW.workspace_id THEN
      RAISE EXCEPTION 'Trang chủ được chọn không thuộc workspace này'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_domains_home_page ON public.workspace_domains;
CREATE TRIGGER trg_workspace_domains_home_page
  BEFORE INSERT OR UPDATE ON public.workspace_domains
  FOR EACH ROW EXECUTE FUNCTION public.check_workspace_domain_home_page();

ALTER TABLE public.workspace_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_domains_read ON public.workspace_domains;
CREATE POLICY workspace_domains_read ON public.workspace_domains
  FOR SELECT TO authenticated
  USING (private.can_read_workspace(workspace_id));

DROP POLICY IF EXISTS workspace_domains_write ON public.workspace_domains;
CREATE POLICY workspace_domains_write ON public.workspace_domains
  FOR ALL TO authenticated
  USING (private.is_active_admin())
  WITH CHECK (private.is_active_admin());

-- ============================================================================
-- 3. BẢNG public.platform_audit_logs (Nhật ký quản trị SuperAdmin)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL CHECK (length(trim(action)) BETWEEN 1 AND 100),
  target_type text NOT NULL CHECK (length(trim(target_type)) BETWEEN 1 AND 60),
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_created_at
  ON public.platform_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_action
  ON public.platform_audit_logs (action, created_at DESC);

ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

-- Chỉ SuperAdmin (admin_users.is_active = true) mới được đọc; ghi chỉ qua service_role
DROP POLICY IF EXISTS platform_audit_logs_admin_read ON public.platform_audit_logs;
CREATE POLICY platform_audit_logs_admin_read ON public.platform_audit_logs
  FOR SELECT TO authenticated
  USING (private.is_active_admin());

-- ============================================================================
-- 4. BỔ SUNG BẢO VỆ TOÀN VẸN workspace_id & GHI CHÚ BẢNG CŨ
-- ============================================================================

DROP TRIGGER IF EXISTS trg_site_shells_workspace_immutable ON public.site_shells;
CREATE TRIGGER trg_site_shells_workspace_immutable
  BEFORE UPDATE ON public.site_shells
  FOR EACH ROW EXECUTE FUNCTION public.check_workspace_immutable();

COMMENT ON TABLE public.workspace_site_settings IS
  'DEPRECATED: đã chuyển sang public.site_shells từ migration 20261124000006_multi_site_shells.sql';

