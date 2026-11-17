"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";
import { loginSchema } from "./schemas";
import { acceptPendingInvitations } from "@/features/workspace/invitations";
import type { AuthState } from "./types";

export async function loginAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  try {
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: formData.get("redirectTo") || "/admin",
    };

    const parsed = loginSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { email, password, redirectTo } = parsed.data;
    const supabase = await createSupabaseServerClient();

    // 1. Xác thực tài khoản qua Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.",
      };
    }

    // 2. Nhận các lời mời workspace đang chờ (nếu có) rồi kiểm tra quyền vào khu vực quản trị:
    //    quản trị hệ thống (admin_users) hoặc thành viên của ít nhất một workspace
    await acceptPendingInvitations();

    const [{ data: adminRecord }, { count: membershipCount }] = await Promise.all([
      supabase
        .from("admin_users")
        .select("user_id, is_active")
        .eq("user_id", authData.user.id)
        .maybeSingle(),
      supabase
        .from("workspace_members")
        .select("workspace_id", { count: "exact", head: true })
        .eq("user_id", authData.user.id),
    ]);

    if (!adminRecord?.is_active && !membershipCount) {
      // Thu hồi phiên đăng nhập ngay nếu không có quyền vào khu vực quản trị
      await supabase.auth.signOut();
      return {
        success: false,
        error:
          "Tài khoản này chưa thuộc workspace nào. Hãy nhờ chủ sở hữu workspace gửi lời mời tới email này.",
      };
    }

    revalidatePath("/", "layout");
    redirect(safeRedirectPath(redirectTo, "/admin"));
  } catch (err: unknown) {
    // Để Next.js tự xử lý redirect() thay vì nuốt lỗi
    unstable_rethrow(err);
    console.error("[loginAction] CAUGHT ERROR:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Đã có lỗi xảy ra",
    };
  }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
