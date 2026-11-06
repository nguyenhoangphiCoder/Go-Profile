import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminUser } from "./types";

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Kiểm tra quyền quản trị trong bảng admin_users
  const { data: adminRecord, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id, display_name, is_active, created_at")
    .eq("user_id", user.id)
    .single();

  if (adminError || !adminRecord || !adminRecord.is_active) {
    return null;
  }

  return {
    userId: adminRecord.user_id,
    email: user.email ?? null,
    displayName: adminRecord.display_name,
    isActive: adminRecord.is_active,
    createdAt: adminRecord.created_at,
  };
}

export async function requireActiveAdmin(redirectTo = "/login"): Promise<AdminUser> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect(redirectTo);
  }

  return admin;
}
