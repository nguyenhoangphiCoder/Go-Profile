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

CREATE POLICY "Active admins can view theme presets"
  ON public.theme_presets
  FOR SELECT
  TO authenticated
  USING (private.is_active_admin());
