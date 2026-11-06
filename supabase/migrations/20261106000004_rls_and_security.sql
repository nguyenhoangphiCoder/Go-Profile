-- Migration 04: Row Level Security (RLS) & Granular Access Policies

-- 1. Enable RLS on all tables
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

-- 2. Revoke default DML privileges from public roles
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Grant SELECT only to authenticated users (evaluated by RLS policies)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Service role retains full administrative access for background/server tasks
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 3. RLS Policies

-- admin_users: Users can read their own admin record to verify session status
CREATE POLICY "Admins can view own record"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Active Admins have SELECT access across business entities for CMS operations
CREATE POLICY "Active admins can view reserved slugs"
  ON public.reserved_slugs
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());

CREATE POLICY "Active admins can view media assets"
  ON public.media_assets
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());

CREATE POLICY "Active admins can view links"
  ON public.links
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());

CREATE POLICY "Active admins can view pages"
  ON public.pages
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());

CREATE POLICY "Active admins can view page slugs"
  ON public.page_slugs
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());

CREATE POLICY "Active admins can view page revisions"
  ON public.page_revisions
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());

CREATE POLICY "Active admins can view page blocks"
  ON public.page_blocks
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());

CREATE POLICY "Active admins can view page links"
  ON public.page_links
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());

CREATE POLICY "Active admins can view link placements"
  ON public.revision_link_placements
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());

CREATE POLICY "Active admins can view revision media assets"
  ON public.revision_media_assets
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());

CREATE POLICY "Active admins can view click events"
  ON public.click_events
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());

-- 4. Storage Bucket Configuration & Policies
-- Đảm bảo bucket public_media và private_media tồn tại trong storage.buckets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES
      ('public_media', 'public_media', true),
      ('private_media', 'private_media', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Storage Objects Policies (áp dụng nếu storage.objects tồn tại)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    -- Cho phép công chúng đọc ảnh trong bucket public_media
    EXECUTE 'CREATE POLICY "Public read for public_media bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = ''public_media'')';
    
    -- Chỉ admin hoạt động mới được thao tác tải lên, sửa, xóa
    EXECUTE 'CREATE POLICY "Admins can manage public media" ON storage.objects FOR ALL TO authenticated USING (bucket_id = ''public_media'' AND private.is_active_admin()) WITH CHECK (bucket_id = ''public_media'' AND private.is_active_admin())';
    
    EXECUTE 'CREATE POLICY "Admins can manage private media" ON storage.objects FOR ALL TO authenticated USING (bucket_id = ''private_media'' AND private.is_active_admin()) WITH CHECK (bucket_id = ''private_media'' AND private.is_active_admin())';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

