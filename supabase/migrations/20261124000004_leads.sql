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
