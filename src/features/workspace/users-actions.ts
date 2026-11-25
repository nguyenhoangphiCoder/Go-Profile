"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import { logPlatformAudit } from "./audit";
import { getWorkspaceContext } from "./context";
import {
  assignUserWorkspaceSchema,
  createPlatformUserSchema,
  resetUserPasswordSchema,
  type AssignUserWorkspaceInput,
  type CreatePlatformUserInput,
  type ResetUserPasswordInput,
} from "./schemas";
import { FORBIDDEN_ERROR } from "./types";

type Result =
  { success: true; message?: string; userId?: string } | { success: false; error: string };

const firstIssue = (e: z.ZodError) => e.issues[0]?.message || "Dữ liệu không hợp lệ";
const LAST_OWNER = /ít nhất một chủ sở hữu/;

async function requirePlatformAdmin() {
  const ctx = await getWorkspaceContext();
  return ctx?.isPlatformAdmin ? ctx : null;
}

export async function createPlatformUserAction(input: CreatePlatformUserInput): Promise<Result> {
  const parsed = createPlatformUserSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const db = createSupabaseAdminClient();
  const displayName = parsed.data.displayName?.trim() || null;

  const { data: created, error } = await db.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: displayName ? { display_name: displayName } : {},
  });

  if (error || !created?.user) {
    const msg = /already|exists|registered/i.test(error?.message ?? "")
      ? "Email này đã tồn tại trên hệ thống."
      : error?.message || "Không tạo được tài khoản mới.";
    return { success: false, error: msg };
  }

  const userId = created.user.id;

  if (parsed.data.isSuperAdmin) {
    await db.from("admin_users").upsert(
      {
        user_id: userId,
        display_name: displayName,
        is_active: true,
      },
      { onConflict: "user_id" }
    );
  }

  const wsId = parsed.data.workspaceId?.trim() || "";
  if (wsId && z.uuid().safeParse(wsId).success) {
    await db.from("workspace_members").upsert(
      {
        workspace_id: wsId,
        user_id: userId,
        role: parsed.data.role,
      },
      { onConflict: "workspace_id,user_id" }
    );
  }

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: "user.create",
    targetType: "user",
    targetId: userId,
    metadata: {
      email: parsed.data.email,
      isSuperAdmin: parsed.data.isSuperAdmin,
      workspaceId: wsId || null,
      role: wsId ? parsed.data.role : null,
    },
  });

  revalidatePath("/admin/system");
  return {
    success: true,
    userId,
    message: `Đã tạo tài khoản ${parsed.data.email} (đã xác thực sẵn, có thể đăng nhập ngay).`,
  };
}

export async function resetPlatformUserPasswordAction(
  input: ResetUserPasswordInput
): Promise<Result> {
  const parsed = resetUserPasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const db = createSupabaseAdminClient();
  const { data, error } = await db.auth.admin.updateUserById(parsed.data.userId, {
    password: parsed.data.newPassword,
  });

  if (error || !data.user) {
    return { success: false, error: error?.message || "Không đổi được mật khẩu." };
  }

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: "user.reset_password",
    targetType: "user",
    targetId: parsed.data.userId,
    metadata: { email: data.user.email ?? null },
  });

  return {
    success: true,
    message: `Đã đặt lại mật khẩu mới cho ${data.user.email ?? "tài khoản"}.`,
  };
}

export async function togglePlatformUserBanAction(
  userId: string,
  banned: boolean
): Promise<Result> {
  if (!z.uuid().safeParse(userId).success) {
    return { success: false, error: "ID tài khoản không hợp lệ." };
  }
  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  if (ctx.user.userId === userId && banned) {
    return { success: false, error: "Bạn không thể tự khóa tài khoản của chính mình." };
  }

  const db = createSupabaseAdminClient();
  const { data, error } = await db.auth.admin.updateUserById(userId, {
    ban_duration: banned ? "876000h" : "none",
  });
  if (error || !data.user) {
    return { success: false, error: error?.message || "Không cập nhật được trạng thái khóa." };
  }

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: banned ? "user.ban" : "user.unban",
    targetType: "user",
    targetId: userId,
    metadata: { email: data.user.email ?? null },
  });

  revalidatePath("/admin/system");
  return {
    success: true,
    message: banned
      ? `Đã khóa tài khoản ${data.user.email ?? ""}.`
      : `Đã mở khóa tài khoản ${data.user.email ?? ""}.`,
  };
}

export async function toggleSuperAdminAction(
  userId: string,
  makeSuperAdmin: boolean
): Promise<Result> {
  if (!z.uuid().safeParse(userId).success) {
    return { success: false, error: "ID tài khoản không hợp lệ." };
  }
  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  if (ctx.user.userId === userId && !makeSuperAdmin) {
    return { success: false, error: "Bạn không thể tự gỡ quyền SuperAdmin của chính mình." };
  }

  const db = createSupabaseAdminClient();
  const { data: targetUser } = await db.auth.admin.getUserById(userId);
  const { error } = await db.from("admin_users").upsert(
    {
      user_id: userId,
      is_active: makeSuperAdmin,
    },
    { onConflict: "user_id" }
  );
  if (error) {
    return { success: false, error: "Không cập nhật được quyền SuperAdmin." };
  }

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: makeSuperAdmin ? "user.grant_superadmin" : "user.revoke_superadmin",
    targetType: "user",
    targetId: userId,
    metadata: { email: targetUser?.user?.email ?? null },
  });

  revalidatePath("/admin", "layout");
  return {
    success: true,
    message: makeSuperAdmin
      ? `Đã cấp quyền SuperAdmin cho ${targetUser?.user?.email ?? "tài khoản"}.`
      : `Đã gỡ quyền SuperAdmin của ${targetUser?.user?.email ?? "tài khoản"}.`,
  };
}

export async function assignUserToWorkspaceAction(
  input: AssignUserWorkspaceInput
): Promise<Result> {
  const parsed = assignUserWorkspaceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const db = createSupabaseAdminClient();
  const { error } = await db.from("workspace_members").upsert(
    {
      workspace_id: parsed.data.workspaceId,
      user_id: parsed.data.userId,
      role: parsed.data.role,
    },
    { onConflict: "workspace_id,user_id" }
  );
  if (error) {
    return {
      success: false,
      error: LAST_OWNER.test(error.message)
        ? "Workspace phải còn ít nhất một chủ sở hữu."
        : "Không gán được tài khoản vào workspace.",
    };
  }

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: "user.assign_workspace",
    targetType: "workspace_member",
    targetId: `${parsed.data.workspaceId}:${parsed.data.userId}`,
    metadata: {
      workspaceId: parsed.data.workspaceId,
      userId: parsed.data.userId,
      role: parsed.data.role,
    },
  });

  revalidatePath("/admin", "layout");
  return { success: true, message: "Đã cập nhật quyền truy cập workspace." };
}

export async function removeUserFromWorkspaceAction(
  userId: string,
  workspaceId: string
): Promise<Result> {
  if (!z.uuid().safeParse(userId).success || !z.uuid().safeParse(workspaceId).success) {
    return { success: false, error: "ID không hợp lệ." };
  }
  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const db = createSupabaseAdminClient();
  const { error } = await db
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) {
    return {
      success: false,
      error: LAST_OWNER.test(error.message)
        ? "Không thể gỡ chủ sở hữu cuối cùng của workspace."
        : "Không gỡ được thành viên khỏi workspace.",
    };
  }

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: "user.remove_workspace",
    targetType: "workspace_member",
    targetId: `${workspaceId}:${userId}`,
    metadata: { workspaceId, userId },
  });

  revalidatePath("/admin", "layout");
  return { success: true, message: "Đã gỡ tài khoản khỏi workspace." };
}
