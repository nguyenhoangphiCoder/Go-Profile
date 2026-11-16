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
  slug text PRIMARY KEY CHECK (length(slug) <= 80 AND slug ~ '^[a-z0-9]+([.-][a-z0-9]+)*$'),
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
DECLARE v_total_clicks bigint; v_clicks_by_date jsonb; v_clicks_by_page jsonb; v_clicks_by_link jsonb; v_clicks_by_placement jsonb;
BEGIN
  IF NOT private.is_active_admin() THEN RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền xem báo cáo'; END IF;

  SELECT count(*) INTO v_total_clicks FROM public.click_events c WHERE c.occurred_at >= p_from AND c.occurred_at < p_to AND (p_page_id IS NULL OR c.page_id = p_page_id) AND (p_link_id IS NULL OR c.link_id = p_link_id);

  SELECT COALESCE(jsonb_agg(jsonb_build_object('date', day_str, 'clicks', click_count) ORDER BY day_str ASC), '[]'::jsonb) INTO v_clicks_by_date
  FROM (SELECT to_char(c.occurred_at AT TIME ZONE p_timezone, 'YYYY-MM-DD') AS day_str, count(*) AS click_count FROM public.click_events c WHERE c.occurred_at >= p_from AND c.occurred_at < p_to AND (p_page_id IS NULL OR c.page_id = p_page_id) AND (p_link_id IS NULL OR c.link_id = p_link_id) GROUP BY day_str) d;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('page_id', t.page_id, 'internal_name', t.internal_name, 'slug', t.slug, 'clicks', t.click_count) ORDER BY t.click_count DESC, t.internal_name ASC), '[]'::jsonb) INTO v_clicks_by_page
  FROM (SELECT p.id AS page_id, p.internal_name, ps.slug, count(c.id) AS click_count FROM public.pages p LEFT JOIN public.page_slugs ps ON ps.page_id = p.id AND ps.is_current = true LEFT JOIN public.click_events c ON c.page_id = p.id AND c.occurred_at >= p_from AND c.occurred_at < p_to AND (p_link_id IS NULL OR c.link_id = p_link_id) WHERE (p_page_id IS NULL OR p.id = p_page_id) GROUP BY p.id, p.internal_name, ps.slug) t;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('link_id', t.link_id, 'label', t.label, 'target_url', t.target_url, 'kind', t.kind, 'clicks', t.click_count) ORDER BY t.click_count DESC, t.label ASC), '[]'::jsonb) INTO v_clicks_by_link
  FROM (SELECT l.id AS link_id, l.default_label AS label, l.target_url, l.kind, count(c.id) AS click_count FROM public.links l LEFT JOIN public.click_events c ON c.link_id = l.id AND c.occurred_at >= p_from AND c.occurred_at < p_to AND (p_page_id IS NULL OR c.page_id = p_page_id) WHERE (p_link_id IS NULL OR l.id = p_link_id) GROUP BY l.id, l.default_label, l.target_url, l.kind) t;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('page_link_id', t.page_link_id, 'page_id', t.page_id, 'page_name', t.page_name, 'link_id', t.link_id, 'label', t.label, 'target_url', t.target_url, 'position', t.position, 'clicks', t.click_count) ORDER BY t.click_count DESC), '[]'::jsonb) INTO v_clicks_by_placement
  FROM (SELECT plk.id AS page_link_id, plk.page_id, p.internal_name AS page_name, l.id AS link_id, COALESCE(rlp.resolved_label, l.default_label) AS label, l.target_url, rlp.position, count(c.id) AS click_count FROM public.click_events c JOIN public.page_links plk ON plk.id = c.page_link_id JOIN public.links l ON l.id = c.link_id JOIN public.pages p ON p.id = c.page_id LEFT JOIN public.revision_link_placements rlp ON rlp.revision_id = c.revision_id AND rlp.page_link_id = c.page_link_id WHERE c.occurred_at >= p_from AND c.occurred_at < p_to AND (p_page_id IS NULL OR c.page_id = p_page_id) AND (p_link_id IS NULL OR c.link_id = p_link_id) GROUP BY plk.id, plk.page_id, p.internal_name, l.id, COALESCE(rlp.resolved_label, l.default_label), l.target_url, rlp.position) t;

  RETURN jsonb_build_object('total_clicks', v_total_clicks, 'timezone', p_timezone, 'from', p_from, 'to', p_to, 'by_date', v_clicks_by_date, 'by_page', v_clicks_by_page, 'by_link', v_clicks_by_link, 'by_placement', v_clicks_by_placement);
END;
$$;
REVOKE ALL ON FUNCTION public.get_click_report(timestamptz, timestamptz, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_click_report(timestamptz, timestamptz, uuid, uuid, text) TO authenticated, service_role;

-- ==============================================================================
-- PHẦN 6: MẪU GIAO DIỆN TỰ LƯU (theme_presets)
-- (nguồn: supabase/migrations/20261116000001_theme_presets.sql)
-- ==============================================================================

-- Migration: Mẫu giao diện do quản trị viên tự lưu (theme v2)
-- Lưu cấu hình theme dạng { preset, version: 2, overrides } để áp dụng lại cho trang khác.

CREATE TABLE IF NOT EXISTS public.theme_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 60),
  config jsonb NOT NULL CHECK (jsonb_typeof(config) = 'object'),
  schema_version integer NOT NULL DEFAULT 2,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_theme_presets_active
  ON public.theme_presets (created_at DESC)
  WHERE archived_at IS NULL;

DROP TRIGGER IF EXISTS trg_theme_presets_updated_at ON public.theme_presets;
CREATE TRIGGER trg_theme_presets_updated_at
  BEFORE UPDATE ON public.theme_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Bảo mật: giống các bảng nghiệp vụ khác — quản trị viên đang hoạt động được đọc,
-- mọi thao tác ghi đi qua server action dùng service role sau khi kiểm tra quyền.
ALTER TABLE public.theme_presets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.theme_presets FROM anon;
GRANT SELECT ON public.theme_presets TO authenticated;
GRANT ALL ON public.theme_presets TO service_role;

DROP POLICY IF EXISTS "Active admins can view theme presets" ON public.theme_presets;
CREATE POLICY "Active admins can view theme presets"
  ON public.theme_presets
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());

-- ==============================================================================
-- PHẦN 7: MỞ RỘNG LOẠI KHỐI NỘI DUNG (14 loại)
-- (nguồn: supabase/migrations/20261116000002_block_types_v2.sql)
-- ==============================================================================

-- Migration: Mở rộng loại khối nội dung (giai đoạn 4 — tuỳ biến giao diện)
-- Thêm: button, gallery, menu_card, accordion, video_embed, map.
-- Style riêng của từng khối lưu trong payload.blockStyle nên không cần thêm cột.
-- Các RPC (get_public_page, publish_page) xử lý khối theo cách chung nên không phải sửa.

-- Xoá mọi CHECK constraint cũ giới hạn cột type (tên constraint có thể khác nhau tuỳ cách
-- database được khởi tạo: migrations, production_bootstrap.sql hay full_schema_migration.sql).
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
      'header', 'image', 'heading', 'text', 'link_list', 'social_icons', 'spacer', 'divider',
      'button', 'gallery', 'menu_card', 'accordion', 'video_embed', 'map'
    )
  );

-- ==============================================================================
-- PHẦN 8: GHI NHẬN ẢNH MỖI PHIÊN BẢN TRANG SỬ DỤNG
-- (nguồn: supabase/migrations/20261116000003_track_revision_media.sql)
-- ==============================================================================

-- Migration: Ghi nhận đầy đủ ảnh mà mỗi phiên bản trang đang sử dụng (revision_media_assets)
--
-- Vấn đề: trước đây publish_page chỉ ghi ảnh icon của liên kết; avatar, banner, ảnh, thư viện ảnh,
-- ảnh món, ảnh nền theme... không được ghi. Kho media vì vậy cho phép xoá (kèm xoá file trên
-- Storage) cả ảnh đang hiển thị trên trang công khai.
--
-- Cách sửa:
--   1. private.revision_media_ids(): gom mọi ảnh một revision dùng — quét toàn bộ chuỗi trong
--      payload các khối + theme (khớp theo id, object_path hoặc URL public), cộng ảnh của placement.
--   2. public.sync_revision_media_assets(): ghi lại bảng revision_media_assets cho một revision
--      (chỉ service_role gọi được — server action lưu nháp gọi sau khi lưu).
--   3. publish_page dùng hàm trên thay cho phần chỉ ghi ảnh placement.
--   4. Bổ sung dữ liệu cho mọi revision hiện có.
-- Chạy lại nhiều lần an toàn.

CREATE OR REPLACE FUNCTION private.revision_media_ids(p_revision_id uuid)
RETURNS TABLE (media_asset_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH strings AS (
    SELECT s #>> '{}' AS v
    FROM public.page_blocks b
    CROSS JOIN LATERAL jsonb_path_query(b.payload, 'strict $.**') AS s
    WHERE b.revision_id = p_revision_id
      AND jsonb_typeof(s) = 'string'
    UNION
    SELECT s #>> '{}'
    FROM public.page_revisions r
    CROSS JOIN LATERAL jsonb_path_query(r.theme, 'strict $.**') AS s
    WHERE r.id = p_revision_id
      AND jsonb_typeof(s) = 'string'
  )
  SELECT ma.id
  FROM public.media_assets ma
  WHERE EXISTS (
    SELECT 1
    FROM strings st
    WHERE st.v = ma.id::text
       OR st.v = ma.object_path
       OR st.v LIKE '%/' || ma.bucket_id || '/' || ma.object_path
  )
  UNION
  SELECT m
  FROM public.revision_link_placements pl
  CROSS JOIN LATERAL unnest(ARRAY[pl.media_override_id, pl.resolved_media_id]) AS m
  WHERE pl.revision_id = p_revision_id
    AND m IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION private.revision_media_ids(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_revision_media_assets(p_revision_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM public.revision_media_assets WHERE revision_id = p_revision_id;

  INSERT INTO public.revision_media_assets (revision_id, media_asset_id)
  SELECT DISTINCT p_revision_id, m.media_asset_id
  FROM private.revision_media_ids(p_revision_id) m
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_revision_media_assets(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_revision_media_assets(uuid) TO service_role;

-- publish_page: giữ nguyên logic cũ, chỉ thay phần ghi revision_media_assets
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

  -- Ghi toàn bộ ảnh của revision (khối, theme, placement) — trước đây chỉ ghi ảnh placement
  PERFORM public.sync_revision_media_assets(p_draft_id);

  UPDATE public.page_revisions
  SET
    state = 'sealed',
    sealed_at = now(),
    updated_at = now()
  WHERE id = p_draft_id;

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

-- Bổ sung dữ liệu cho mọi revision hiện có
SELECT public.sync_revision_media_assets(id) FROM public.page_revisions;

-- ==============================================================================
-- PHẦN 9: SỬA GHI NHẬN ẢNH CHO PHIÊN BẢN ĐÃ XUẤT BẢN
-- (nguồn: supabase/migrations/20261116000004_fix_media_sync_sealed.sql)
-- ==============================================================================

-- Migration: Sửa lỗi ghi nhận ảnh cho phiên bản ĐÃ XUẤT BẢN (sealed)
--
-- Lỗi của migration 20261116000003: trigger trg_revision_media_sealed_guard cấm thêm/xoá dòng
-- revision_media_assets của revision đã niêm phong, nên bước bổ sung dữ liệu cho mọi revision
-- (SELECT sync_revision_media_assets(id) FROM page_revisions) báo lỗi và cả migration bị huỷ
-- — ảnh của trang đã xuất bản không được ghi nhận, vẫn xoá nhầm được.
--
-- Cách sửa: revision_media_assets chỉ là chỉ mục ảnh (dẫn xuất từ nội dung), không phải nội
-- dung trang. Cho phép cập nhật bảng này với revision đã niêm phong KHI VÀ CHỈ KHI đang chạy
-- trong public.sync_revision_media_assets (cờ giao dịch app.media_sync). Nội dung khối và vị trí
-- liên kết của revision đã niêm phong vẫn bất biến như cũ.
-- Chạy lại nhiều lần an toàn; tự chứa — chạy được dù migration 20261116000003 đã chạy hay chưa.

-- 1. Trigger bảo vệ: thêm ngoại lệ cho đồng bộ chỉ mục ảnh
CREATE OR REPLACE FUNCTION public.check_child_of_sealed_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rev_id uuid;
  v_state text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_rev_id := OLD.revision_id;
  ELSE
    v_rev_id := NEW.revision_id;
  END IF;

  SELECT state INTO v_state
  FROM public.page_revisions
  WHERE id = v_rev_id;

  IF v_state = 'sealed'
     AND NOT (
       TG_TABLE_NAME = 'revision_media_assets'
       AND current_setting('app.media_sync', true) = 'on'
     ) THEN
    RAISE EXCEPTION 'Không thể thay đổi nội dung (khối/liên kết/media) của revision đã niêm phong (revision: %)', v_rev_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Hàm gom ảnh (giống migration 20261116000003, khai báo lại để migration này tự chứa)
CREATE OR REPLACE FUNCTION private.revision_media_ids(p_revision_id uuid)
RETURNS TABLE (media_asset_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH strings AS (
    SELECT s #>> '{}' AS v
    FROM public.page_blocks b
    CROSS JOIN LATERAL jsonb_path_query(b.payload, 'strict $.**') AS s
    WHERE b.revision_id = p_revision_id
      AND jsonb_typeof(s) = 'string'
    UNION
    SELECT s #>> '{}'
    FROM public.page_revisions r
    CROSS JOIN LATERAL jsonb_path_query(r.theme, 'strict $.**') AS s
    WHERE r.id = p_revision_id
      AND jsonb_typeof(s) = 'string'
  )
  SELECT ma.id
  FROM public.media_assets ma
  WHERE EXISTS (
    SELECT 1
    FROM strings st
    WHERE st.v = ma.id::text
       OR st.v = ma.object_path
       OR st.v LIKE '%/' || ma.bucket_id || '/' || ma.object_path
  )
  UNION
  SELECT m
  FROM public.revision_link_placements pl
  CROSS JOIN LATERAL unnest(ARRAY[pl.media_override_id, pl.resolved_media_id]) AS m
  WHERE pl.revision_id = p_revision_id
    AND m IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION private.revision_media_ids(uuid) FROM PUBLIC, anon, authenticated;

-- 3. Hàm đồng bộ: bật cờ app.media_sync trong phạm vi giao dịch rồi tắt lại
CREATE OR REPLACE FUNCTION public.sync_revision_media_assets(p_revision_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM set_config('app.media_sync', 'on', true);

  DELETE FROM public.revision_media_assets WHERE revision_id = p_revision_id;

  INSERT INTO public.revision_media_assets (revision_id, media_asset_id)
  SELECT DISTINCT p_revision_id, m.media_asset_id
  FROM private.revision_media_ids(p_revision_id) m
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  PERFORM set_config('app.media_sync', 'off', true);
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_revision_media_assets(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_revision_media_assets(uuid) TO service_role;

-- 4. publish_page ghi đủ ảnh của revision (khai báo lại để migration này tự chứa)
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

  -- Ghi toàn bộ ảnh của revision (khối, theme, placement) — trước đây chỉ ghi ảnh placement
  PERFORM public.sync_revision_media_assets(p_draft_id);

  UPDATE public.page_revisions
  SET
    state = 'sealed',
    sealed_at = now(),
    updated_at = now()
  WHERE id = p_draft_id;

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

-- 5. Bổ sung dữ liệu cho mọi revision (kể cả bản đã xuất bản)
SELECT public.sync_revision_media_assets(id) FROM public.page_revisions;

-- ==============================================================================
-- PHẦN 10: WORKSPACE (NHIỀU NGƯỜI DÙNG TỰ QUẢN TRANG)
-- (nguồn: supabase/migrations/20261116000005_workspaces.sql)
-- ==============================================================================

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
