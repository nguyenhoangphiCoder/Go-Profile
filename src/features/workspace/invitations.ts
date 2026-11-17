import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Nhận mọi lời mời còn hạn gửi tới email (đã xác minh) của người đang đăng nhập
 * (RPC accept_workspace_invitations — migration 20261117000001). Trả về số lời mời đã nhận.
 * Lỗi (ví dụ chưa chạy migration) chỉ ghi log, không chặn đăng nhập.
 */
export async function acceptPendingInvitations(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("accept_workspace_invitations");
  if (error) {
    console.error("Không nhận được lời mời workspace:", error.message);
    return 0;
  }
  return Number(data ?? 0);
}
