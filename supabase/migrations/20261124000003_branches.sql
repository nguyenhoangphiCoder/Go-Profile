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
