-- Migration 01: Private schema, Helper functions, admin_users, reserved_slugs

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

