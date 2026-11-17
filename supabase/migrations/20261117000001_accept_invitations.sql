-- Migration: Nhận lời mời workspace (giai đoạn 5c)
--
-- public.accept_workspace_invitations(): người dùng đang đăng nhập nhận mọi lời mời còn hạn gửi
-- tới ĐÚNG email ĐÃ XÁC MINH của mình. Gọi khi đăng nhập và khi vào khu vực quản trị.
--   - Chỉ nhận lời mời của workspace đang hoạt động, chưa thu hồi, chưa hết hạn.
--   - Đã là thành viên: giữ vai trò cao hơn (lời mời không bao giờ hạ quyền).
--   - Trả về số lời mời đã nhận.
-- Thuần bổ sung (không đổi bảng / hàm cũ); chạy lại nhiều lần an toàn.

CREATE OR REPLACE FUNCTION private.role_rank(p_role text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE p_role WHEN 'owner' THEN 3 WHEN 'editor' THEN 2 WHEN 'viewer' THEN 1 ELSE 0 END;
$$;

CREATE OR REPLACE FUNCTION public.accept_workspace_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_count integer := 0;
  r record;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  SELECT lower(u.email), u.email_confirmed_at INTO v_email, v_confirmed
  FROM auth.users u
  WHERE u.id = v_uid;

  -- Email chưa xác minh thì không nhận lời mời (tránh chiếm lời mời bằng email của người khác)
  IF v_email IS NULL OR v_confirmed IS NULL THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT i.id, i.workspace_id, i.role
    FROM public.workspace_invitations i
    JOIN public.workspaces w ON w.id = i.workspace_id AND w.archived_at IS NULL
    WHERE i.email = v_email
      AND i.accepted_at IS NULL
      AND i.revoked_at IS NULL
      AND i.expires_at > now()
    ORDER BY i.created_at
    FOR UPDATE OF i
  LOOP
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (r.workspace_id, v_uid, r.role)
    ON CONFLICT (workspace_id, user_id) DO UPDATE
      SET role = CASE
        WHEN private.role_rank(EXCLUDED.role) > private.role_rank(public.workspace_members.role)
          THEN EXCLUDED.role
        ELSE public.workspace_members.role
      END;

    UPDATE public.workspace_invitations
    SET accepted_at = now(), accepted_by = v_uid
    WHERE id = r.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_workspace_invitations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invitations() TO authenticated;
