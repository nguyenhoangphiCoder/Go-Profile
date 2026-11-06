-- ==============================================================================
-- GỜ CAFE PROFILE: FULL DATABASE SCHEMA MIGRATION (PARTS 01 -> 05)
-- Chạy toàn bộ file này 1 lần duy nhất trong SQL Editor của Supabase Dashboard
-- ==============================================================================

-- ==============================================================================
-- PHẦN 1: SCHEMA PRIVATE, HELPER FUNCTIONS & ADMIN_USERS
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

-- Helper trigger for automatic updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Table: admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Helper function: private.is_active_admin()
CREATE OR REPLACE FUNCTION private.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
      AND is_active = true
  );
$$;

-- Table: reserved_slugs
CREATE TABLE IF NOT EXISTS public.reserved_slugs (
  slug text PRIMARY KEY,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial system reserved slugs
INSERT INTO public.reserved_slugs (slug, reason)
VALUES
  ('admin', 'Khu vực quản trị CMS'),
  ('api', 'API endpoints hệ thống'),
  ('login', 'Trang đăng nhập quản trị'),
  ('logout', 'Đăng xuất hệ thống'),
  ('auth', 'Xác thực và OAuth callback'),
  ('r', 'Tuyến chuyển hướng và ghi nhận click'),
  ('static', 'Tài nguyên tĩnh ứng dụng'),
  ('_next', 'Tuyến nội bộ của Next.js'),
  ('dashboard', 'Bảng điều khiển quản trị'),
  ('settings', 'Cài đặt hệ thống'),
  ('assets', 'Đường dẫn tài nguyên media'),
  ('favicon.ico', 'Biểu tượng trình duyệt'),
  ('robots.txt', 'Cấu hình công cụ tìm kiếm'),
  ('sitemap.xml', 'Sơ đồ website')
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- PHẦN 2: 10 BẢNG NGHIỆP VỤ CỐT LÕI & CÁC RÀNG BUỘC
-- ==============================================================================

-- 1. media_assets
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL,
  object_path text NOT NULL,
  visibility text NOT NULL CHECK (visibility IN ('private', 'public')),
  status text NOT NULL CHECK (status IN ('pending', 'ready', 'failed', 'deleting')) DEFAULT 'pending',
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  original_filename text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT uq_media_assets_bucket_path UNIQUE (bucket_id, object_path)
);

-- 2. links
CREATE TABLE IF NOT EXISTS public.links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_label text NOT NULL CHECK (length(trim(default_label)) > 0),
  target_url text NOT NULL CHECK (length(trim(target_url)) > 0),
  kind text NOT NULL CHECK (kind IN ('http', 'tel', 'mailto')) DEFAULT 'http',
  description text,
  default_media_id uuid REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  lock_version bigint NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

-- 3. pages (chưa gắn FK con trỏ)
CREATE TABLE IF NOT EXISTS public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_name text NOT NULL CHECK (length(trim(internal_name)) > 0),
  status text NOT NULL CHECK (status IN ('unpublished', 'published', 'archived')) DEFAULT 'unpublished',
  published_revision_id uuid,
  lock_version bigint NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT chk_pages_status_archived CHECK (
    (status = 'archived' AND archived_at IS NOT NULL) OR
    (status <> 'archived' AND archived_at IS NULL)
  )
);

-- 4. page_slugs
CREATE TABLE IF NOT EXISTS public.page_slugs (
  slug text PRIMARY KEY CHECK (length(slug) <= 80 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE RESTRICT,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_page_slugs_current ON public.page_slugs(page_id) WHERE is_current;

-- 5. page_revisions
CREATE TABLE IF NOT EXISTS public.page_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE RESTRICT,
  revision_no integer NOT NULL CHECK (revision_no > 0),
  state text NOT NULL CHECK (state IN ('draft', 'sealed')) DEFAULT 'draft',
  lock_version bigint NOT NULL DEFAULT 1,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(seo) = 'object'),
  theme jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(theme) = 'object'),
  schema_version integer NOT NULL DEFAULT 1,
  sealed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_page_revisions_no UNIQUE (page_id, revision_no),
  CONSTRAINT uq_page_revisions_composite UNIQUE (page_id, id),
  CONSTRAINT chk_page_revisions_sealed CHECK (
    (state = 'sealed' AND sealed_at IS NOT NULL) OR
    (state = 'draft' AND sealed_at IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_page_revisions_draft ON public.page_revisions(page_id) WHERE state = 'draft';

-- Bổ sung FK con trỏ công khai từ pages -> page_revisions(page_id, id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_pages_published_revision' AND table_name = 'pages'
  ) THEN
    ALTER TABLE public.pages
      ADD CONSTRAINT fk_pages_published_revision
      FOREIGN KEY (id, published_revision_id)
      REFERENCES public.page_revisions(page_id, id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- 6. page_blocks
CREATE TABLE IF NOT EXISTS public.page_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  revision_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('header', 'image', 'heading', 'text', 'link_list', 'social_icons', 'spacer', 'divider')),
  position integer NOT NULL CHECK (position >= 0),
  is_visible boolean NOT NULL DEFAULT true,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_page_blocks_revision FOREIGN KEY (page_id, revision_id) REFERENCES public.page_revisions(page_id, id) ON DELETE RESTRICT,
  CONSTRAINT uq_page_blocks_composite UNIQUE (page_id, revision_id, id),
  CONSTRAINT uq_page_blocks_position UNIQUE (revision_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- 7. page_links
CREATE TABLE IF NOT EXISTS public.page_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE RESTRICT,
  link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT uq_page_links_composite UNIQUE (page_id, id),
  CONSTRAINT uq_page_links_composite_all UNIQUE (page_id, id, link_id)
);

-- 8. revision_link_placements
CREATE TABLE IF NOT EXISTS public.revision_link_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  revision_id uuid NOT NULL,
  block_id uuid NOT NULL,
  page_link_id uuid NOT NULL,
  position integer NOT NULL CHECK (position >= 0),
  label_override text,
  media_override_id uuid REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  resolved_label text,
  resolved_media_id uuid REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_placements_block FOREIGN KEY (page_id, revision_id, block_id) REFERENCES public.page_blocks(page_id, revision_id, id) ON DELETE RESTRICT,
  CONSTRAINT fk_placements_page_link FOREIGN KEY (page_id, page_link_id) REFERENCES public.page_links(page_id, id) ON DELETE RESTRICT,
  CONSTRAINT uq_placements_revision_link UNIQUE (revision_id, page_link_id),
  CONSTRAINT uq_placements_block_position UNIQUE (block_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- 9. revision_media_assets
CREATE TABLE IF NOT EXISTS public.revision_media_assets (
  revision_id uuid NOT NULL REFERENCES public.page_revisions(id) ON DELETE RESTRICT,
  media_asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  PRIMARY KEY (revision_id, media_asset_id)
);

-- 10. click_events
CREATE TABLE IF NOT EXISTS public.click_events (
  id uuid PRIMARY KEY,
  page_id uuid NOT NULL,
  link_id uuid NOT NULL,
  page_link_id uuid NOT NULL,
  revision_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_click_events_revision FOREIGN KEY (page_id, revision_id) REFERENCES public.page_revisions(page_id, id) ON DELETE RESTRICT,
  CONSTRAINT fk_click_events_link FOREIGN KEY (page_id, page_link_id, link_id) REFERENCES public.page_links(page_id, id, link_id) ON DELETE RESTRICT
);

-- ==============================================================================
-- PHẦN 3: INDEXES, TRIGGERS & BẢO VỆ BẤT BIẾN
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_page_slugs_page_id ON public.page_slugs(page_id);
CREATE INDEX IF NOT EXISTS idx_page_revisions_page_history ON public.page_revisions(page_id, revision_no DESC);
CREATE INDEX IF NOT EXISTS idx_page_links_link_page ON public.page_links(link_id, page_id);
CREATE INDEX IF NOT EXISTS idx_placements_page_link_id ON public.revision_link_placements(page_link_id);
CREATE INDEX IF NOT EXISTS idx_revision_media_asset_id ON public.revision_media_assets(media_asset_id);
CREATE INDEX IF NOT EXISTS idx_click_events_page_time ON public.click_events(page_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_click_events_link_time ON public.click_events(link_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_click_events_occurred_at ON public.click_events(occurred_at);

DROP TRIGGER IF EXISTS trg_links_updated_at ON public.links;
CREATE TRIGGER trg_links_updated_at BEFORE UPDATE ON public.links FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_pages_updated_at ON public.pages;
CREATE TRIGGER trg_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_page_revisions_updated_at ON public.page_revisions;
CREATE TRIGGER trg_page_revisions_updated_at BEFORE UPDATE ON public.page_revisions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_page_blocks_updated_at ON public.page_blocks;
CREATE TRIGGER trg_page_blocks_updated_at BEFORE UPDATE ON public.page_blocks FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_placements_updated_at ON public.revision_link_placements;
CREATE TRIGGER trg_placements_updated_at BEFORE UPDATE ON public.revision_link_placements FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE OR REPLACE FUNCTION public.check_sealed_revision_immutability()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.state = 'sealed' THEN RAISE EXCEPTION 'Không thể sửa đổi phiên bản đã được niêm phong (%)', OLD.id; END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.state = 'sealed' THEN RAISE EXCEPTION 'Không thể xóa phiên bản đã được niêm phong (%)', OLD.id; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_sealed_revision ON public.page_revisions;
CREATE TRIGGER trg_protect_sealed_revision BEFORE UPDATE OR DELETE ON public.page_revisions FOR EACH ROW EXECUTE FUNCTION public.check_sealed_revision_immutability();

CREATE OR REPLACE FUNCTION public.check_child_of_sealed_revision()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_rev_id uuid; v_state text;
BEGIN
  IF TG_OP = 'DELETE' THEN v_rev_id := OLD.revision_id; ELSE v_rev_id := NEW.revision_id; END IF;
  SELECT state INTO v_state FROM public.page_revisions WHERE id = v_rev_id;
  IF v_state = 'sealed' THEN RAISE EXCEPTION 'Không thể thay đổi nội dung của revision đã niêm phong (%)', v_rev_id; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_page_blocks_sealed_guard ON public.page_blocks;
CREATE TRIGGER trg_page_blocks_sealed_guard BEFORE INSERT OR UPDATE OR DELETE ON public.page_blocks FOR EACH ROW EXECUTE FUNCTION public.check_child_of_sealed_revision();

DROP TRIGGER IF EXISTS trg_placements_sealed_guard ON public.revision_link_placements;
CREATE TRIGGER trg_placements_sealed_guard BEFORE INSERT OR UPDATE OR DELETE ON public.revision_link_placements FOR EACH ROW EXECUTE FUNCTION public.check_child_of_sealed_revision();

DROP TRIGGER IF EXISTS trg_revision_media_sealed_guard ON public.revision_media_assets;
CREATE TRIGGER trg_revision_media_sealed_guard BEFORE INSERT OR UPDATE OR DELETE ON public.revision_media_assets FOR EACH ROW EXECUTE FUNCTION public.check_child_of_sealed_revision();

CREATE OR REPLACE FUNCTION public.check_published_revision_is_sealed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_state text;
BEGIN
  IF NEW.published_revision_id IS NOT NULL THEN
    SELECT state INTO v_state FROM public.page_revisions WHERE id = NEW.published_revision_id;
    IF v_state IS DISTINCT FROM 'sealed' THEN RAISE EXCEPTION 'Chỉ có thể công khai revision ở trạng thái sealed (%, %)', NEW.published_revision_id, v_state; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pages_published_revision_sealed_guard ON public.pages;
CREATE TRIGGER trg_pages_published_revision_sealed_guard BEFORE INSERT OR UPDATE OF published_revision_id ON public.pages FOR EACH ROW EXECUTE FUNCTION public.check_published_revision_is_sealed();

-- ==============================================================================
-- PHẦN 4: RLS & PHÂN QUYỀN
-- ==============================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserved_slugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_slugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_link_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

DROP POLICY IF EXISTS "Admins can view own record" ON public.admin_users;
CREATE POLICY "Admins can view own record" ON public.admin_users FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Active admins can view reserved slugs" ON public.reserved_slugs;
CREATE POLICY "Active admins can view reserved slugs" ON public.reserved_slugs FOR SELECT TO authenticated USING (private.is_active_admin());

DROP POLICY IF EXISTS "Active admins can view media assets" ON public.media_assets;
CREATE POLICY "Active admins can view media assets" ON public.media_assets FOR SELECT TO authenticated USING (private.is_active_admin());

DROP POLICY IF EXISTS "Active admins can view links" ON public.links;
CREATE POLICY "Active admins can view links" ON public.links FOR SELECT TO authenticated USING (private.is_active_admin());

DROP POLICY IF EXISTS "Active admins can view pages" ON public.pages;
CREATE POLICY "Active admins can view pages" ON public.pages FOR SELECT TO authenticated USING (private.is_active_admin());

DROP POLICY IF EXISTS "Active admins can view page slugs" ON public.page_slugs;
CREATE POLICY "Active admins can view page slugs" ON public.page_slugs FOR SELECT TO authenticated USING (private.is_active_admin());

DROP POLICY IF EXISTS "Active admins can view page revisions" ON public.page_revisions;
CREATE POLICY "Active admins can view page revisions" ON public.page_revisions FOR SELECT TO authenticated USING (private.is_active_admin());

DROP POLICY IF EXISTS "Active admins can view page blocks" ON public.page_blocks;
CREATE POLICY "Active admins can view page blocks" ON public.page_blocks FOR SELECT TO authenticated USING (private.is_active_admin());

DROP POLICY IF EXISTS "Active admins can view page links" ON public.page_links;
CREATE POLICY "Active admins can view page links" ON public.page_links FOR SELECT TO authenticated USING (private.is_active_admin());

DROP POLICY IF EXISTS "Active admins can view link placements" ON public.revision_link_placements;
CREATE POLICY "Active admins can view link placements" ON public.revision_link_placements FOR SELECT TO authenticated USING (private.is_active_admin());

DROP POLICY IF EXISTS "Active admins can view revision media assets" ON public.revision_media_assets;
CREATE POLICY "Active admins can view revision media assets" ON public.revision_media_assets FOR SELECT TO authenticated USING (private.is_active_admin());

DROP POLICY IF EXISTS "Active admins can view click events" ON public.click_events;
CREATE POLICY "Active admins can view click events" ON public.click_events FOR SELECT TO authenticated USING (private.is_active_admin());

-- Storage buckets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('public_media', 'public_media', true), ('private_media', 'private_media', false) ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    BEGIN
      EXECUTE 'CREATE POLICY "Public read for public_media bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = ''public_media'')';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      EXECUTE 'CREATE POLICY "Admins can manage public media" ON storage.objects FOR ALL TO authenticated USING (bucket_id = ''public_media'' AND private.is_active_admin()) WITH CHECK (bucket_id = ''public_media'' AND private.is_active_admin())';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      EXECUTE 'CREATE POLICY "Admins can manage private media" ON storage.objects FOR ALL TO authenticated USING (bucket_id = ''private_media'' AND private.is_active_admin()) WITH CHECK (bucket_id = ''private_media'' AND private.is_active_admin())';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- ==============================================================================
-- PHẦN 5: RPC FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_public_page(p_slug text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_page_id uuid; v_is_current boolean; v_canonical_slug text;
  v_page_status text; v_published_rev_id uuid; v_revision record;
  v_blocks jsonb; v_result jsonb;
BEGIN
  SELECT page_id, is_current INTO v_page_id, v_is_current FROM public.page_slugs WHERE slug = lower(trim(p_slug));
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false, 'reason', 'SLUG_NOT_FOUND'); END IF;

  IF NOT v_is_current THEN
    SELECT slug INTO v_canonical_slug FROM public.page_slugs WHERE page_id = v_page_id AND is_current = true;
    RETURN jsonb_build_object('found', true, 'is_alias', true, 'canonical_slug', v_canonical_slug);
  END IF;

  SELECT status, published_revision_id INTO v_page_status, v_published_rev_id FROM public.pages WHERE id = v_page_id AND archived_at IS NULL;
  IF v_page_status IS DISTINCT FROM 'published' OR v_published_rev_id IS NULL THEN RETURN jsonb_build_object('found', false, 'reason', 'PAGE_UNPUBLISHED'); END IF;

  SELECT id, title, description, theme, seo INTO v_revision FROM public.page_revisions WHERE id = v_published_rev_id AND state = 'sealed';
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false, 'reason', 'REVISION_NOT_SEALED'); END IF;

  WITH block_items AS (
    SELECT b.id AS block_id, b.type, b.position, b.payload,
      COALESCE(jsonb_agg(jsonb_build_object(
        'page_link_id', pl.page_link_id, 'position', pl.position,
        'label', COALESCE(pl.resolved_label, l.default_label),
        'kind', l.kind, 'target_url', l.target_url, 'media_url', ma.object_path
      ) ORDER BY pl.position ASC) FILTER (WHERE pl.id IS NOT NULL), '[]'::jsonb) AS links
    FROM public.page_blocks b
    LEFT JOIN public.revision_link_placements pl ON pl.block_id = b.id AND pl.revision_id = v_published_rev_id
    LEFT JOIN public.page_links plk ON plk.id = pl.page_link_id AND plk.archived_at IS NULL
    LEFT JOIN public.links l ON l.id = plk.link_id AND l.is_active = true AND l.archived_at IS NULL
    LEFT JOIN public.media_assets ma ON ma.id = COALESCE(pl.resolved_media_id, l.default_media_id) AND ma.status = 'ready' AND ma.visibility = 'public'
    WHERE b.revision_id = v_published_rev_id AND b.is_visible = true
    GROUP BY b.id, b.type, b.position, b.payload ORDER BY b.position ASC
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(bi)), '[]'::jsonb) INTO v_blocks FROM block_items bi;

  RETURN jsonb_build_object('found', true, 'is_alias', false, 'slug', lower(trim(p_slug)), 'title', v_revision.title, 'description', v_revision.description, 'theme', v_revision.theme, 'seo', v_revision.seo, 'blocks', v_blocks);
END;
$$;
REVOKE ALL ON FUNCTION public.get_public_page(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_page(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.resolve_public_link(p_page_link_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_page_id uuid; v_link_id uuid; v_revision_id uuid; v_target_url text; v_kind text; v_page_status text;
BEGIN
  SELECT plk.page_id, plk.link_id, p.status, p.published_revision_id, l.target_url, l.kind INTO v_page_id, v_link_id, v_page_status, v_revision_id, v_target_url, v_kind
  FROM public.page_links plk JOIN public.pages p ON p.id = plk.page_id JOIN public.links l ON l.id = plk.link_id
  WHERE plk.id = p_page_link_id AND plk.archived_at IS NULL AND p.archived_at IS NULL AND l.archived_at IS NULL AND l.is_active = true;

  IF NOT FOUND OR v_page_status IS DISTINCT FROM 'published' OR v_revision_id IS NULL THEN RETURN jsonb_build_object('valid', false, 'reason', 'LINK_NOT_FOUND_OR_INACTIVE'); END IF;

  IF NOT EXISTS (SELECT 1 FROM public.revision_link_placements rlp JOIN public.page_blocks pb ON pb.id = rlp.block_id WHERE rlp.revision_id = v_revision_id AND rlp.page_link_id = p_page_link_id AND pb.is_visible = true) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'LINK_NOT_IN_PUBLISHED_REVISION');
  END IF;

  RETURN jsonb_build_object('valid', true, 'page_id', v_page_id, 'link_id', v_link_id, 'revision_id', v_revision_id, 'target_url', v_target_url, 'kind', v_kind);
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_public_link(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_public_link(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.record_click(p_event_id uuid, p_page_link_id uuid, p_expected_revision_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_page_id uuid; v_link_id uuid; v_existing_event record;
BEGIN
  SELECT id, page_link_id, revision_id INTO v_existing_event FROM public.click_events WHERE id = p_event_id;
  IF FOUND THEN
    IF v_existing_event.page_link_id = p_page_link_id AND v_existing_event.revision_id = p_expected_revision_id THEN RETURN jsonb_build_object('success', true, 'idempotent', true);
    ELSE RETURN jsonb_build_object('success', false, 'error', 'IDEMPOTENT_EVENT_CONFLICT'); END IF;
  END IF;

  SELECT page_id, link_id INTO v_page_id, v_link_id FROM public.page_links WHERE id = p_page_link_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'PAGE_LINK_NOT_FOUND'); END IF;

  INSERT INTO public.click_events (id, page_id, link_id, page_link_id, revision_id, occurred_at) VALUES (p_event_id, v_page_id, v_link_id, p_page_link_id, p_expected_revision_id, now());
  RETURN jsonb_build_object('success', true, 'idempotent', false);
END;
$$;
REVOKE ALL ON FUNCTION public.record_click(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_click(uuid, uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.create_page(p_internal_name text, p_slug text, p_title text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_norm_slug text := lower(trim(p_slug)); v_page_id uuid; v_revision_id uuid;
BEGIN
  IF NOT private.is_active_admin() THEN RAISE EXCEPTION 'Chỉ quản trị viên đang hoạt động mới có quyền tạo trang'; END IF;
  IF EXISTS (SELECT 1 FROM public.reserved_slugs WHERE slug = v_norm_slug) THEN RAISE EXCEPTION 'Slug "%" là slug hệ thống', v_norm_slug; END IF;

  INSERT INTO public.pages (internal_name, status, created_by) VALUES (trim(p_internal_name), 'unpublished', auth.uid()) RETURNING id INTO v_page_id;
  INSERT INTO public.page_slugs (slug, page_id, is_current) VALUES (v_norm_slug, v_page_id, true);
  INSERT INTO public.page_revisions (page_id, revision_no, state, title, theme, created_by) VALUES (v_page_id, 1, 'draft', trim(p_title), jsonb_build_object('preset', 'go-original'), auth.uid()) RETURNING id INTO v_revision_id;
  INSERT INTO public.page_blocks (page_id, revision_id, type, position, payload) VALUES (v_page_id, v_revision_id, 'header', 0, jsonb_build_object('title', trim(p_title), 'bio', ''));

  RETURN jsonb_build_object('success', true, 'page_id', v_page_id, 'revision_id', v_revision_id, 'slug', v_norm_slug);
END;
$$;
REVOKE ALL ON FUNCTION public.create_page(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_page(text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.publish_page(p_page_id uuid, p_draft_id uuid, p_expected_page_version bigint, p_expected_draft_version bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_page record; v_draft record;
BEGIN
  IF NOT private.is_active_admin() THEN RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền xuất bản trang'; END IF;
  SELECT id, lock_version, status INTO v_page FROM public.pages WHERE id = p_page_id AND archived_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trang không tồn tại'; END IF;
  IF v_page.lock_version <> p_expected_page_version THEN RAISE EXCEPTION 'Xung đột version trang (expected: %, actual: %)', p_expected_page_version, v_page.lock_version; END IF;

  SELECT id, lock_version, state, page_id INTO v_draft FROM public.page_revisions WHERE id = p_draft_id AND page_id = p_page_id FOR UPDATE;
  IF NOT FOUND OR v_draft.state IS DISTINCT FROM 'draft' THEN RAISE EXCEPTION 'Bản nháp không hợp lệ'; END IF;
  IF v_draft.lock_version <> p_expected_draft_version THEN RAISE EXCEPTION 'Xung đột version nháp (expected: %, actual: %)', p_expected_draft_version, v_draft.lock_version; END IF;

  UPDATE public.revision_link_placements pl
  SET resolved_label = COALESCE(pl.label_override, l.default_label), resolved_media_id = COALESCE(pl.media_override_id, l.default_media_id), updated_at = now()
  FROM public.page_links plk JOIN public.links l ON l.id = plk.link_id
  WHERE pl.page_link_id = plk.id AND pl.revision_id = p_draft_id;

  DELETE FROM public.revision_media_assets WHERE revision_id = p_draft_id;
  INSERT INTO public.revision_media_assets (revision_id, media_asset_id)
  SELECT DISTINCT p_draft_id, resolved_media_id FROM public.revision_link_placements WHERE revision_id = p_draft_id AND resolved_media_id IS NOT NULL ON CONFLICT DO NOTHING;

  UPDATE public.page_revisions SET state = 'sealed', sealed_at = now(), updated_at = now() WHERE id = p_draft_id;
  UPDATE public.pages SET published_revision_id = p_draft_id, status = 'published', lock_version = lock_version + 1, updated_at = now() WHERE id = p_page_id;

  RETURN jsonb_build_object('success', true, 'page_id', p_page_id, 'published_revision_id', p_draft_id);
END;
$$;
REVOKE ALL ON FUNCTION public.publish_page(uuid, uuid, bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_page(uuid, uuid, bigint, bigint) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.unpublish_page(p_page_id uuid, p_expected_page_version bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_page record;
BEGIN
  IF NOT private.is_active_admin() THEN RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền ẩn trang'; END IF;
  SELECT id, lock_version INTO v_page FROM public.pages WHERE id = p_page_id AND archived_at IS NULL FOR UPDATE;
  IF NOT FOUND OR v_page.lock_version <> p_expected_page_version THEN RAISE EXCEPTION 'Xung đột version trang'; END IF;

  UPDATE public.pages SET status = 'unpublished', lock_version = lock_version + 1, updated_at = now() WHERE id = p_page_id;
  RETURN jsonb_build_object('success', true, 'page_id', p_page_id, 'status', 'unpublished');
END;
$$;
REVOKE ALL ON FUNCTION public.unpublish_page(uuid, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unpublish_page(uuid, bigint) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.rename_page_slug(p_page_id uuid, p_new_slug text, p_expected_page_version bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_norm_slug text := lower(trim(p_new_slug)); v_existing_page_id uuid;
BEGIN
  IF NOT private.is_active_admin() THEN RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền đổi slug'; END IF;
  IF EXISTS (SELECT 1 FROM public.reserved_slugs WHERE slug = v_norm_slug) THEN RAISE EXCEPTION 'Slug "%" là slug hệ thống', v_norm_slug; END IF;

  SELECT page_id INTO v_existing_page_id FROM public.page_slugs WHERE slug = v_norm_slug;
  IF FOUND AND v_existing_page_id <> p_page_id THEN RAISE EXCEPTION 'Slug "%" đã được sử dụng bởi trang khác', v_norm_slug; END IF;

  UPDATE public.page_slugs SET is_current = false WHERE page_id = p_page_id AND is_current = true;
  INSERT INTO public.page_slugs (slug, page_id, is_current) VALUES (v_norm_slug, p_page_id, true) ON CONFLICT (slug) DO UPDATE SET is_current = true;
  UPDATE public.pages SET lock_version = lock_version + 1, updated_at = now() WHERE id = p_page_id;

  RETURN jsonb_build_object('success', true, 'new_slug', v_norm_slug);
END;
$$;
REVOKE ALL ON FUNCTION public.rename_page_slug(uuid, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rename_page_slug(uuid, text, bigint) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_click_report(
  p_from timestamptz, p_to timestamptz, p_page_id uuid DEFAULT NULL, p_link_id uuid DEFAULT NULL, p_timezone text DEFAULT 'Asia/Ho_Chi_Minh'
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_total_clicks bigint; v_clicks_by_date jsonb; v_clicks_by_page jsonb; v_clicks_by_link jsonb;
BEGIN
  IF NOT private.is_active_admin() THEN RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền xem báo cáo'; END IF;

  SELECT count(*) INTO v_total_clicks FROM public.click_events c WHERE c.occurred_at >= p_from AND c.occurred_at < p_to AND (p_page_id IS NULL OR c.page_id = p_page_id) AND (p_link_id IS NULL OR c.link_id = p_link_id);

  SELECT COALESCE(jsonb_agg(jsonb_build_object('date', day_str, 'clicks', click_count) ORDER BY day_str ASC), '[]'::jsonb) INTO v_clicks_by_date
  FROM (SELECT to_char(c.occurred_at AT TIME ZONE p_timezone, 'YYYY-MM-DD') AS day_str, count(*) AS click_count FROM public.click_events c WHERE c.occurred_at >= p_from AND c.occurred_at < p_to AND (p_page_id IS NULL OR c.page_id = p_page_id) AND (p_link_id IS NULL OR c.link_id = p_link_id) GROUP BY day_str) d;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('page_id', p.id, 'internal_name', p.internal_name, 'slug', ps.slug, 'clicks', count(c.id)) ORDER BY count(c.id) DESC), '[]'::jsonb) INTO v_clicks_by_page
  FROM public.pages p LEFT JOIN public.page_slugs ps ON ps.page_id = p.id AND ps.is_current = true LEFT JOIN public.click_events c ON c.page_id = p.id AND c.occurred_at >= p_from AND c.occurred_at < p_to AND (p_link_id IS NULL OR c.link_id = p_link_id) WHERE (p_page_id IS NULL OR p.id = p_page_id) GROUP BY p.id, p.internal_name, ps.slug;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('link_id', l.id, 'label', l.default_label, 'target_url', l.target_url, 'kind', l.kind, 'clicks', count(c.id)) ORDER BY count(c.id) DESC), '[]'::jsonb) INTO v_clicks_by_link
  FROM public.links l LEFT JOIN public.click_events c ON c.link_id = l.id AND c.occurred_at >= p_from AND c.occurred_at < p_to AND (p_page_id IS NULL OR c.page_id = p_page_id) WHERE (p_link_id IS NULL OR l.id = p_link_id) GROUP BY l.id, l.default_label, l.target_url, l.kind;

  RETURN jsonb_build_object('total_clicks', v_total_clicks, 'timezone', p_timezone, 'from', p_from, 'to', p_to, 'by_date', v_clicks_by_date, 'by_page', v_clicks_by_page, 'by_link', v_clicks_by_link);
END;
$$;
REVOKE ALL ON FUNCTION public.get_click_report(timestamptz, timestamptz, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_click_report(timestamptz, timestamptz, uuid, uuid, text) TO authenticated, service_role;

