-- Migration: Workspace — nền tảng cho nhiều người dùng tự quản trang (giai đoạn 5a)
--
-- Mô hình:
--   - workspaces: không gian sở hữu trang, liên kết, ảnh, mẫu giao diện.
--   - workspace_members: thành viên với vai trò owner / editor / viewer.
--   - workspace_invitations: lời mời theo email (đăng ký chỉ qua lời mời).
--   - Quản trị hệ thống = bảng admin_users hiện có (private.is_active_admin()) — xem được mọi workspace.
--   - Dữ liệu cũ thuộc workspace "Gờ Cafe" (id cố định ...0001); quản trị viên hiện tại là owner.
--   - Slug trang vẫn duy nhất toàn hệ thống (/slug), không đổi định tuyến.
--
-- Giai đoạn chuyển tiếp: cột workspace_id có DEFAULT = workspace Gờ Cafe để ứng dụng hiện tại
-- (chưa biết workspace) vẫn chạy đúng. Ứng dụng giai đoạn 5b sẽ truyền workspace_id tường minh.
--
-- Chạy lại nhiều lần an toàn.

-- ============================================================================
-- 1. BẢNG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  max_pages integer NOT NULL DEFAULT 20 CHECK (max_pages BETWEEN 0 AND 100000),
  max_media_bytes bigint NOT NULL DEFAULT 209715200 CHECK (max_media_bytes >= 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);

CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (email = lower(trim(email)) AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role text NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz
);

-- Mỗi email chỉ có một lời mời đang chờ trong một workspace
CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_invitations_pending
  ON public.workspace_invitations(workspace_id, email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email
  ON public.workspace_invitations(email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_workspace_members_updated_at ON public.workspace_members;
CREATE TRIGGER trg_workspace_members_updated_at
  BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ============================================================================
-- 2. WORKSPACE MẶC ĐỊNH "GỜ CAFE" + GẮN DỮ LIỆU CŨ
-- ============================================================================

INSERT INTO public.workspaces (id, name, max_pages, max_media_bytes)
VALUES ('00000000-0000-4000-8000-000000000001', 'Gờ Cafe', 1000, 10737418240)
ON CONFLICT (id) DO NOTHING;

-- Quản trị viên hiện tại trở thành owner của workspace Gờ Cafe
INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT '00000000-0000-4000-8000-000000000001', user_id, 'owner'
FROM public.admin_users
WHERE is_active = true
ON CONFLICT (workspace_id, user_id) DO NOTHING;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pages', 'links', 'media_assets', 'theme_presets'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS workspace_id uuid', t);
    EXECUTE format(
      'UPDATE public.%I SET workspace_id = %L WHERE workspace_id IS NULL',
      t, '00000000-0000-4000-8000-000000000001'
    );
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN workspace_id SET DEFAULT %L::uuid',
      t, '00000000-0000-4000-8000-000000000001'
    );
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN workspace_id SET NOT NULL', t);
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = format('fk_%s_workspace', t)) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE RESTRICT',
        t, format('fk_%s_workspace', t)
      );
    END IF;
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(workspace_id)', format('idx_%s_workspace', t), t);
  END LOOP;
END $$;

-- ============================================================================
-- 3. HÀM PHÂN QUYỀN
-- ============================================================================

-- Vai trò của người đang đăng nhập trong workspace (NULL nếu không phải thành viên / đã lưu trữ)
CREATE OR REPLACE FUNCTION private.workspace_role(p_workspace_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT m.role
  FROM public.workspace_members m
  JOIN public.workspaces w ON w.id = m.workspace_id
  WHERE m.workspace_id = p_workspace_id
    AND m.user_id = auth.uid()
    AND w.archived_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION private.can_read_workspace(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_active_admin() OR private.workspace_role(p_workspace_id) IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION private.can_edit_workspace(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_active_admin()
      OR coalesce(private.workspace_role(p_workspace_id) IN ('owner', 'editor'), false);
$$;

CREATE OR REPLACE FUNCTION private.page_workspace_id(p_page_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT workspace_id FROM public.pages WHERE id = p_page_id;
$$;

-- ============================================================================
-- 4. RÀNG BUỘC NHẤT QUÁN GIỮA CÁC WORKSPACE
-- ============================================================================

-- Không cho chuyển dữ liệu sang workspace khác sau khi tạo (tránh lẫn dữ liệu giữa workspace)
CREATE OR REPLACE FUNCTION public.check_workspace_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id THEN
    RAISE EXCEPTION 'Không thể chuyển % sang workspace khác', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pages', 'links', 'media_assets', 'theme_presets'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', format('trg_%s_workspace_immutable', t), t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE OF workspace_id ON public.%I FOR EACH ROW EXECUTE FUNCTION public.check_workspace_immutable()',
      format('trg_%s_workspace_immutable', t), t
    );
  END LOOP;
END $$;

-- Liên kết đặt trên trang phải cùng workspace với trang
CREATE OR REPLACE FUNCTION public.check_page_link_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT workspace_id FROM public.pages WHERE id = NEW.page_id)
     IS DISTINCT FROM (SELECT workspace_id FROM public.links WHERE id = NEW.link_id) THEN
    RAISE EXCEPTION 'Liên kết và trang phải thuộc cùng một workspace';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_page_links_workspace ON public.page_links;
CREATE TRIGGER trg_page_links_workspace
  BEFORE INSERT OR UPDATE ON public.page_links
  FOR EACH ROW EXECUTE FUNCTION public.check_page_link_workspace();

-- Ảnh mặc định của liên kết phải cùng workspace
CREATE OR REPLACE FUNCTION public.check_link_media_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.default_media_id IS NOT NULL
     AND (SELECT workspace_id FROM public.media_assets WHERE id = NEW.default_media_id)
         IS DISTINCT FROM NEW.workspace_id THEN
    RAISE EXCEPTION 'Ảnh của liên kết phải thuộc cùng workspace';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_links_media_workspace ON public.links;
CREATE TRIGGER trg_links_media_workspace
  BEFORE INSERT OR UPDATE OF default_media_id, workspace_id ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.check_link_media_workspace();

-- Ảnh ghi đè icon trên vị trí liên kết phải cùng workspace với trang
CREATE OR REPLACE FUNCTION public.check_placement_media_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.media_override_id IS NOT NULL
     AND (SELECT workspace_id FROM public.media_assets WHERE id = NEW.media_override_id)
         IS DISTINCT FROM (SELECT workspace_id FROM public.pages WHERE id = NEW.page_id) THEN
    RAISE EXCEPTION 'Ảnh của vị trí liên kết phải thuộc cùng workspace với trang';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_placements_media_workspace ON public.revision_link_placements;
CREATE TRIGGER trg_placements_media_workspace
  BEFORE INSERT OR UPDATE OF media_override_id ON public.revision_link_placements
  FOR EACH ROW EXECUTE FUNCTION public.check_placement_media_workspace();

-- Mỗi workspace đang hoạt động luôn còn ít nhất một owner
CREATE OR REPLACE FUNCTION public.check_last_workspace_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.role = 'owner'
     AND (TG_OP = 'DELETE' OR NEW.role <> 'owner')
     AND EXISTS (
       SELECT 1 FROM public.workspaces
       WHERE id = OLD.workspace_id AND archived_at IS NULL
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.workspace_members
       WHERE workspace_id = OLD.workspace_id
         AND role = 'owner'
         AND user_id <> OLD.user_id
     ) THEN
    RAISE EXCEPTION 'Workspace phải còn ít nhất một chủ sở hữu (owner)';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_members_last_owner ON public.workspace_members;
CREATE TRIGGER trg_workspace_members_last_owner
  BEFORE UPDATE OF role OR DELETE ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.check_last_workspace_owner();

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.workspaces, public.workspace_members, public.workspace_invitations FROM PUBLIC, anon;
GRANT SELECT ON public.workspaces, public.workspace_members, public.workspace_invitations TO authenticated;
GRANT ALL ON public.workspaces, public.workspace_members, public.workspace_invitations TO service_role;

-- Bỏ các policy "chỉ quản trị viên" cũ
DROP POLICY IF EXISTS "Active admins can view reserved slugs" ON public.reserved_slugs;
DROP POLICY IF EXISTS "Active admins can view media assets" ON public.media_assets;
DROP POLICY IF EXISTS "Active admins can view links" ON public.links;
DROP POLICY IF EXISTS "Active admins can view pages" ON public.pages;
DROP POLICY IF EXISTS "Active admins can view page slugs" ON public.page_slugs;
DROP POLICY IF EXISTS "Active admins can view page revisions" ON public.page_revisions;
DROP POLICY IF EXISTS "Active admins can view page blocks" ON public.page_blocks;
DROP POLICY IF EXISTS "Active admins can view page links" ON public.page_links;
DROP POLICY IF EXISTS "Active admins can view link placements" ON public.revision_link_placements;
DROP POLICY IF EXISTS "Active admins can view revision media assets" ON public.revision_media_assets;
DROP POLICY IF EXISTS "Active admins can view click events" ON public.click_events;
DROP POLICY IF EXISTS "Active admins can view theme presets" ON public.theme_presets;

-- Policy mới theo workspace (tên cố định để chạy lại được)
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
CREATE POLICY "Members can view their workspaces" ON public.workspaces
  FOR SELECT TO authenticated USING (private.can_read_workspace(id));

DROP POLICY IF EXISTS "Members can view co-members" ON public.workspace_members;
CREATE POLICY "Members can view co-members" ON public.workspace_members
  FOR SELECT TO authenticated USING (private.can_read_workspace(workspace_id));

DROP POLICY IF EXISTS "Owners can view invitations" ON public.workspace_invitations;
CREATE POLICY "Owners can view invitations" ON public.workspace_invitations
  FOR SELECT TO authenticated
  USING (private.is_active_admin() OR private.workspace_role(workspace_id) = 'owner');

DROP POLICY IF EXISTS "Authenticated can view reserved slugs" ON public.reserved_slugs;
CREATE POLICY "Authenticated can view reserved slugs" ON public.reserved_slugs
  FOR SELECT TO authenticated USING (true);

DO $$
DECLARE
  t text;
BEGIN
  -- Bảng có cột workspace_id
  FOREACH t IN ARRAY ARRAY['pages', 'links', 'media_assets', 'theme_presets'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Workspace members can view', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (private.can_read_workspace(workspace_id))',
      'Workspace members can view', t
    );
  END LOOP;

  -- Bảng con của trang (có cột page_id)
  FOREACH t IN ARRAY ARRAY[
    'page_slugs', 'page_revisions', 'page_blocks', 'page_links', 'revision_link_placements', 'click_events'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Workspace members can view', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (private.can_read_workspace(private.page_workspace_id(page_id)))',
      'Workspace members can view', t
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Workspace members can view" ON public.revision_media_assets;
CREATE POLICY "Workspace members can view" ON public.revision_media_assets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.page_revisions r
      WHERE r.id = revision_id
        AND private.can_read_workspace(private.page_workspace_id(r.page_id))
    )
  );

-- ============================================================================
-- 6. RPC THEO WORKSPACE
-- ============================================================================

-- create_page có workspace + giới hạn số trang
CREATE OR REPLACE FUNCTION public.create_page(
  p_workspace_id uuid,
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
  v_workspace record;
  v_page_count integer;
  v_page_id uuid;
  v_revision_id uuid;
BEGIN
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

  INSERT INTO public.pages (workspace_id, internal_name, status, created_by)
  VALUES (p_workspace_id, trim(p_internal_name), 'unpublished', auth.uid())
  RETURNING id INTO v_page_id;

  INSERT INTO public.page_slugs (slug, page_id, is_current)
  VALUES (v_norm_slug, v_page_id, true);

  INSERT INTO public.page_revisions (page_id, revision_no, state, title, theme, created_by)
  VALUES (v_page_id, 1, 'draft', trim(p_title), jsonb_build_object('preset', 'go-original'), auth.uid())
  RETURNING id INTO v_revision_id;

  INSERT INTO public.page_blocks (page_id, revision_id, type, position, payload)
  VALUES (v_page_id, v_revision_id, 'header', 0, jsonb_build_object('title', trim(p_title), 'bio', ''));

  RETURN jsonb_build_object(
    'success', true,
    'page_id', v_page_id,
    'revision_id', v_revision_id,
    'slug', v_norm_slug
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_page(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_page(uuid, text, text, text) TO authenticated, service_role;

-- Bản cũ (3 tham số) giữ để tương thích trong giai đoạn chuyển tiếp: tạo trong workspace Gờ Cafe
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
    '00000000-0000-4000-8000-000000000001'::uuid, p_internal_name, p_slug, p_title
  );
$$;

REVOKE ALL ON FUNCTION public.create_page(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_page(text, text, text) TO authenticated, service_role;

-- publish_page: quyền theo workspace của trang
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
  SELECT id, lock_version, status, workspace_id INTO v_page
  FROM public.pages
  WHERE id = p_page_id AND archived_at IS NULL
  FOR UPDATE;

  IF NOT FOUND OR NOT private.can_edit_workspace(v_page.workspace_id) THEN
    RAISE EXCEPTION 'Trang không tồn tại hoặc bạn không có quyền xuất bản trang này';
  END IF;

  IF v_page.lock_version <> p_expected_page_version THEN
    RAISE EXCEPTION 'Xung đột dữ liệu trang (expected version: %, actual: %)', p_expected_page_version, v_page.lock_version;
  END IF;

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

  UPDATE public.revision_link_placements pl
  SET
    resolved_label = COALESCE(pl.label_override, l.default_label),
    resolved_media_id = COALESCE(pl.media_override_id, l.default_media_id),
    updated_at = now()
  FROM public.page_links plk
  JOIN public.links l ON l.id = plk.link_id
  WHERE pl.page_link_id = plk.id
    AND pl.revision_id = p_draft_id;

  PERFORM public.sync_revision_media_assets(p_draft_id);

  UPDATE public.page_revisions
  SET state = 'sealed', sealed_at = now(), updated_at = now()
  WHERE id = p_draft_id;

  UPDATE public.pages
  SET
    published_revision_id = p_draft_id,
    status = 'published',
    lock_version = lock_version + 1,
    updated_at = now()
  WHERE id = p_page_id;

  RETURN jsonb_build_object('success', true, 'page_id', p_page_id, 'published_revision_id', p_draft_id);
END;
$$;

REVOKE ALL ON FUNCTION public.publish_page(uuid, uuid, bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_page(uuid, uuid, bigint, bigint) TO authenticated, service_role;

-- unpublish_page: quyền theo workspace của trang
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
  SELECT id, lock_version, workspace_id INTO v_page
  FROM public.pages
  WHERE id = p_page_id AND archived_at IS NULL
  FOR UPDATE;

  IF NOT FOUND OR NOT private.can_edit_workspace(v_page.workspace_id) THEN
    RAISE EXCEPTION 'Trang không tồn tại hoặc bạn không có quyền ẩn trang này';
  END IF;

  IF v_page.lock_version <> p_expected_page_version THEN
    RAISE EXCEPTION 'Xung đột phiên bản trang';
  END IF;

  UPDATE public.pages
  SET status = 'unpublished', lock_version = lock_version + 1, updated_at = now()
  WHERE id = p_page_id;

  RETURN jsonb_build_object('success', true, 'page_id', p_page_id, 'status', 'unpublished');
END;
$$;

REVOKE ALL ON FUNCTION public.unpublish_page(uuid, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unpublish_page(uuid, bigint) TO authenticated, service_role;

-- rename_page_slug: quyền theo workspace của trang (slug vẫn duy nhất toàn hệ thống)
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
  v_page record;
BEGIN
  SELECT id, lock_version, workspace_id INTO v_page
  FROM public.pages
  WHERE id = p_page_id AND archived_at IS NULL
  FOR UPDATE;

  IF NOT FOUND OR NOT private.can_edit_workspace(v_page.workspace_id) THEN
    RAISE EXCEPTION 'Trang không tồn tại hoặc bạn không có quyền đổi đường dẫn trang này';
  END IF;

  IF v_page.lock_version <> p_expected_page_version THEN
    RAISE EXCEPTION 'Xung đột phiên bản trang';
  END IF;

  IF EXISTS (SELECT 1 FROM public.reserved_slugs WHERE slug = v_norm_slug) THEN
    RAISE EXCEPTION 'Slug "%" nằm trong danh sách từ khóa hệ thống', v_norm_slug;
  END IF;

  SELECT page_id INTO v_existing_page_id FROM public.page_slugs WHERE slug = v_norm_slug;
  IF FOUND AND v_existing_page_id <> p_page_id THEN
    RAISE EXCEPTION 'Slug "%" đã được sử dụng bởi trang khác', v_norm_slug;
  END IF;

  UPDATE public.page_slugs SET is_current = false WHERE page_id = p_page_id AND is_current = true;

  INSERT INTO public.page_slugs (slug, page_id, is_current)
  VALUES (v_norm_slug, p_page_id, true)
  ON CONFLICT (slug) DO UPDATE SET is_current = true;

  UPDATE public.pages SET lock_version = lock_version + 1, updated_at = now() WHERE id = p_page_id;

  RETURN jsonb_build_object('success', true, 'new_slug', v_norm_slug);
END;
$$;

REVOKE ALL ON FUNCTION public.rename_page_slug(uuid, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rename_page_slug(uuid, text, bigint) TO authenticated, service_role;

-- get_click_report: thêm phạm vi workspace.
--   p_workspace_id NULL  -> toàn hệ thống (chỉ quản trị hệ thống)
--   p_workspace_id có    -> thành viên workspace (mọi vai trò) hoặc quản trị hệ thống
DROP FUNCTION IF EXISTS public.get_click_report(timestamptz, timestamptz, uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.get_click_report(
  p_from timestamptz,
  p_to timestamptz,
  p_page_id uuid DEFAULT NULL,
  p_link_id uuid DEFAULT NULL,
  p_timezone text DEFAULT 'Asia/Ho_Chi_Minh',
  p_workspace_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
-- VOLATILE (mặc định): dùng bảng tạm để lọc click một lần cho mọi thống kê
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total_clicks bigint;
  v_clicks_by_date jsonb;
  v_clicks_by_page jsonb;
  v_clicks_by_link jsonb;
  v_clicks_by_placement jsonb;
BEGIN
  IF p_workspace_id IS NULL THEN
    IF NOT private.is_active_admin() THEN
      RAISE EXCEPTION 'Chỉ quản trị hệ thống mới xem được báo cáo toàn hệ thống';
    END IF;
  ELSIF NOT private.can_read_workspace(p_workspace_id) THEN
    RAISE EXCEPTION 'Bạn không có quyền xem báo cáo của workspace này';
  END IF;

  -- Click trong phạm vi: theo thời gian, bộ lọc trang/link và workspace của trang
  CREATE TEMP TABLE IF NOT EXISTS pg_temp.report_clicks (
    id uuid, page_id uuid, link_id uuid, page_link_id uuid, revision_id uuid, occurred_at timestamptz
  ) ON COMMIT DROP;
  TRUNCATE pg_temp.report_clicks;

  INSERT INTO pg_temp.report_clicks
  SELECT c.id, c.page_id, c.link_id, c.page_link_id, c.revision_id, c.occurred_at
  FROM public.click_events c
  JOIN public.pages p ON p.id = c.page_id
  WHERE c.occurred_at >= p_from
    AND c.occurred_at < p_to
    AND (p_page_id IS NULL OR c.page_id = p_page_id)
    AND (p_link_id IS NULL OR c.link_id = p_link_id)
    AND (p_workspace_id IS NULL OR p.workspace_id = p_workspace_id);

  SELECT count(*) INTO v_total_clicks FROM pg_temp.report_clicks;

  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('date', day_str, 'clicks', click_count) ORDER BY day_str ASC),
    '[]'::jsonb
  ) INTO v_clicks_by_date
  FROM (
    SELECT to_char(c.occurred_at AT TIME ZONE p_timezone, 'YYYY-MM-DD') AS day_str, count(*) AS click_count
    FROM pg_temp.report_clicks c
    GROUP BY day_str
  ) d;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('page_id', t.page_id, 'internal_name', t.internal_name, 'slug', t.slug, 'clicks', t.click_count)
      ORDER BY t.click_count DESC, t.internal_name ASC
    ),
    '[]'::jsonb
  ) INTO v_clicks_by_page
  FROM (
    SELECT p.id AS page_id, p.internal_name, ps.slug, count(c.id) AS click_count
    FROM public.pages p
    LEFT JOIN public.page_slugs ps ON ps.page_id = p.id AND ps.is_current = true
    LEFT JOIN pg_temp.report_clicks c ON c.page_id = p.id
    WHERE (p_page_id IS NULL OR p.id = p_page_id)
      AND (p_workspace_id IS NULL OR p.workspace_id = p_workspace_id)
    GROUP BY p.id, p.internal_name, ps.slug
  ) t;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('link_id', t.link_id, 'label', t.label, 'target_url', t.target_url, 'kind', t.kind, 'clicks', t.click_count)
      ORDER BY t.click_count DESC, t.label ASC
    ),
    '[]'::jsonb
  ) INTO v_clicks_by_link
  FROM (
    SELECT l.id AS link_id, l.default_label AS label, l.target_url, l.kind, count(c.id) AS click_count
    FROM public.links l
    LEFT JOIN pg_temp.report_clicks c ON c.link_id = l.id
    WHERE (p_link_id IS NULL OR l.id = p_link_id)
      AND (p_workspace_id IS NULL OR l.workspace_id = p_workspace_id)
    GROUP BY l.id, l.default_label, l.target_url, l.kind
  ) t;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'page_link_id', t.page_link_id, 'page_id', t.page_id, 'page_name', t.page_name,
        'link_id', t.link_id, 'label', t.label, 'target_url', t.target_url,
        'position', t.position, 'clicks', t.click_count
      ) ORDER BY t.click_count DESC
    ),
    '[]'::jsonb
  ) INTO v_clicks_by_placement
  FROM (
    SELECT
      plk.id AS page_link_id, plk.page_id, p.internal_name AS page_name, l.id AS link_id,
      COALESCE(rlp.resolved_label, l.default_label) AS label, l.target_url, rlp.position,
      count(c.id) AS click_count
    FROM pg_temp.report_clicks c
    JOIN public.page_links plk ON plk.id = c.page_link_id
    JOIN public.links l ON l.id = c.link_id
    JOIN public.pages p ON p.id = c.page_id
    LEFT JOIN public.revision_link_placements rlp
      ON rlp.revision_id = c.revision_id AND rlp.page_link_id = c.page_link_id
    GROUP BY plk.id, plk.page_id, p.internal_name, l.id, COALESCE(rlp.resolved_label, l.default_label), l.target_url, rlp.position
  ) t;

  RETURN jsonb_build_object(
    'total_clicks', v_total_clicks,
    'timezone', p_timezone,
    'from', p_from,
    'to', p_to,
    'by_date', v_clicks_by_date,
    'by_page', v_clicks_by_page,
    'by_link', v_clicks_by_link,
    'by_placement', v_clicks_by_placement
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_click_report(timestamptz, timestamptz, uuid, uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_click_report(timestamptz, timestamptz, uuid, uuid, text, uuid) TO authenticated, service_role;
