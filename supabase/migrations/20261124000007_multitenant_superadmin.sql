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
