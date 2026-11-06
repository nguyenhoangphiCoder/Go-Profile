"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "./schemas";
import type { AuthState } from "./types";

export async function loginAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
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

  // 2. Kiểm tra phân quyền admin_users
  const { data: adminRecord, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id, is_active")
    .eq("user_id", authData.user.id)
    .single();

  if (adminError || !adminRecord || !adminRecord.is_active) {
    // Thu hồi phiên đăng nhập ngay lập tức nếu không phải admin
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Tài khoản này chưa được cấp quyền quản trị hoặc đã bị vô hiệu hóa.",
    };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo || "/admin");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
