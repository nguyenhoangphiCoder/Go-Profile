"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import { clientEnv } from "@/lib/env.client";
import type { Database, Json } from "@/types/database.generated";
import { logPlatformAudit } from "./audit";
import { listAllAuthUsers } from "./auth-users-helper";
import { getWorkspaceContext, getWorkspaceForAction } from "./context";
import { getWorkspaceMembers } from "./members";
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  mbToBytes,
  renameWorkspaceSchema,
  updateMemberRoleSchema,
  workspaceLimitsSchema,
  type CreateWorkspaceInput,
  type InviteMemberInput,
  type WorkspaceLimitsInput,
} from "./schemas";
import {
  FORBIDDEN_ERROR,
  GO_CAFE_WORKSPACE_ID,
  PLAN_PRESETS,
  type WorkspacePlan,
  type WorkspaceRole,
} from "./types";

type Result =
  { success: true; message?: string; workspaceId?: string } | { success: false; error: string };

const firstIssue = (e: z.ZodError) => e.issues[0]?.message || "Dữ liệu không hợp lệ";
const LAST_OWNER = /ít nhất một chủ sở hữu/;

/**
 * Lưu lời mời (tạo mới hoặc làm mới lời mời đang chờ) rồi gửi email mời qua Supabase Auth.
 * Người đã có tài khoản: Supabase không gửi lại email mời — họ tự vào workspace ở lần đăng
 * nhập kế tiếp (RPC accept_workspace_invitations).
 */
async function saveAndSendInvitation(
  workspaceId: string,
  email: string,
  role: WorkspaceRole,
  invitedBy: string
): Promise<Result> {
  const db = createSupabaseAdminClient();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: pending } = await db
    .from("workspace_invitations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("email", email)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .maybeSingle();

  const { error: saveError } = pending
    ? await db
        .from("workspace_invitations")
        .update({ role, invited_by: invitedBy, expires_at: expiresAt })
        .eq("id", pending.id)
    : await db.from("workspace_invitations").insert({
        workspace_id: workspaceId,
        email,
        role,
        invited_by: invitedBy,
        expires_at: expiresAt,
      });
  if (saveError) {
    console.error("Lưu lời mời lỗi:", saveError);
    return { success: false, error: "Không lưu được lời mời." };
  }

  const { error: sendError } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")}/auth/accept-invite`,
  });
  if (sendError) {
    if (/already|registered|exists/i.test(sendError.message)) {
      return {
        success: true,
        message: `${email} đã có tài khoản: họ sẽ tự vào workspace ở lần đăng nhập kế tiếp.`,
      };
    }
    console.error("Gửi email mời lỗi:", sendError);
    return {
      success: true,
      message: `Đã lưu lời mời nhưng chưa gửi được email (${sendError.message}). Người được mời vẫn vào được nếu đăng nhập bằng email này.`,
    };
  }
  return { success: true, message: `Đã gửi email mời tới ${email}.` };
}

/** Tìm user_id theo email trong auth.users (dùng khi SuperAdmin gán Owner trực tiếp). */
async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const db = createSupabaseAdminClient();
  const normalized = email.trim().toLowerCase();
  const users = await listAllAuthUsers(db);
  const match = users.find((u) => u.email?.toLowerCase() === normalized);
  return match?.id ?? null;
}

// ---------------------------------------------------------------------------
// Chủ sở hữu workspace
// ---------------------------------------------------------------------------

export async function inviteMemberAction(input: InviteMemberInput): Promise<Result> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const ctx = await getWorkspaceForAction("owner");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const { members } = await getWorkspaceMembers(ctx.workspace.id);
  if (members.some((m) => m.email?.toLowerCase() === parsed.data.email)) {
    return { success: false, error: "Người này đã là thành viên của workspace." };
  }

  const res = await saveAndSendInvitation(
    ctx.workspace.id,
    parsed.data.email,
    parsed.data.role,
    ctx.user.userId
  );
  revalidatePath("/admin/members");
  return res;
}

export async function revokeInvitationAction(invitationId: string): Promise<Result> {
  if (!z.uuid().safeParse(invitationId).success) {
    return { success: false, error: "ID lời mời không hợp lệ" };
  }
  const ctx = await getWorkspaceForAction("owner");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("workspace_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("workspace_id", ctx.workspace.id)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .select("id");
  if (error || !data?.length) {
    return { success: false, error: "Lời mời không tồn tại hoặc đã được xử lý." };
  }
  revalidatePath("/admin/members");
  return { success: true };
}

export async function updateMemberRoleAction(input: {
  userId: string;
  role: WorkspaceRole;
}): Promise<Result> {
  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };
  const ctx = await getWorkspaceForAction("owner");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("workspace_members")
    .update({ role: parsed.data.role })
    .eq("workspace_id", ctx.workspace.id)
    .eq("user_id", parsed.data.userId)
    .select("user_id");
  if (error) {
    return {
      success: false,
      error: LAST_OWNER.test(error.message)
        ? "Workspace phải còn ít nhất một chủ sở hữu. Hãy chỉ định chủ sở hữu khác trước."
        : "Không đổi được vai trò.",
    };
  }
  if (!data?.length) return { success: false, error: "Thành viên không tồn tại." };
  revalidatePath("/admin", "layout");
  return { success: true };
}

export async function removeMemberAction(userId: string): Promise<Result> {
  if (!z.uuid().safeParse(userId).success) {
    return { success: false, error: "ID thành viên không hợp lệ" };
  }
  const ctx = await getWorkspaceForAction("owner");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("workspace_members")
    .delete()
    .eq("workspace_id", ctx.workspace.id)
    .eq("user_id", userId)
    .select("user_id");
  if (error) {
    return {
      success: false,
      error: LAST_OWNER.test(error.message)
        ? "Không thể xoá chủ sở hữu cuối cùng của workspace."
        : "Không xoá được thành viên.",
    };
  }
  if (!data?.length) return { success: false, error: "Thành viên không tồn tại." };
  revalidatePath("/admin", "layout");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Quản trị hệ thống (SuperAdmin)
// ---------------------------------------------------------------------------

async function requirePlatformAdmin() {
  const ctx = await getWorkspaceContext();
  return ctx?.isPlatformAdmin ? ctx : null;
}

export async function createWorkspaceAction(input: CreateWorkspaceInput): Promise<Result> {
  const parsed = createWorkspaceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };
  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const plan: WorkspacePlan = parsed.data.plan ?? "pro";
  const preset = PLAN_PRESETS[plan];
  const features = parsed.data.features ?? preset.features;
  const maxBranches = parsed.data.maxBranches ?? preset.maxBranches;
  const maxShells = parsed.data.maxShells ?? preset.maxShells;

  const db = createSupabaseAdminClient();
  const { data: ws, error } = await db
    .from("workspaces")
    .insert({
      name: parsed.data.name,
      plan,
      features: features as unknown as Json,
      max_pages: parsed.data.maxPages,
      max_media_bytes: mbToBytes(parsed.data.maxMediaMb),
      max_branches: maxBranches,
      max_shells: maxShells,
      created_by: ctx.user.userId,
    })
    .select("id")
    .single();
  if (error || !ws) {
    console.error("Tạo workspace lỗi:", error);
    return { success: false, error: "Không tạo được workspace." };
  }

  // Tự động khởi tạo 1 bộ Site Shell mặc định cho Workspace mới
  const { error: shellErr } = await db.from("site_shells").insert({
    workspace_id: ws.id,
    name: parsed.data.name,
    is_default: true,
    site_name: parsed.data.name,
  });
  if (shellErr) {
    console.error("Khởi tạo site_shells mặc định lỗi:", shellErr);
  }

  const ownerEmail = parsed.data.ownerEmail?.trim() || "";
  let ownerNotice = "";

  if (ownerEmail) {
    const existingUserId = await findAuthUserIdByEmail(ownerEmail);
    if (existingUserId) {
      const { error: memberErr } = await db
        .from("workspace_members")
        .upsert(
          { workspace_id: ws.id, user_id: existingUserId, role: "owner" },
          { onConflict: "workspace_id,user_id" }
        );
      ownerNotice = memberErr
        ? `Chưa gán được ${ownerEmail} làm Chủ sở hữu (${memberErr.message}).`
        : `Đã gán ngay ${ownerEmail} làm Chủ sở hữu.`;
    } else {
      const invite = await saveAndSendInvitation(ws.id, ownerEmail, "owner", ctx.user.userId);
      ownerNotice = invite.success
        ? (invite.message ?? "")
        : `Chưa mời được chủ sở hữu: ${invite.error}`;
    }
  } else {
    // Gán chính SuperAdmin làm owner tạm thời để workspace luôn có owner hợp lệ
    const { error: selfOwnerErr } = await db
      .from("workspace_members")
      .upsert(
        { workspace_id: ws.id, user_id: ctx.user.userId, role: "owner" },
        { onConflict: "workspace_id,user_id" }
      );
    ownerNotice = selfOwnerErr
      ? "Chưa gán được chủ sở hữu mặc định."
      : "Bạn đang là Chủ sở hữu mặc định.";
  }

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: "workspace.create",
    targetType: "workspace",
    targetId: ws.id,
    metadata: {
      name: parsed.data.name,
      plan,
      ownerEmail: ownerEmail || ctx.user.email,
      maxPages: parsed.data.maxPages,
      maxMediaMb: parsed.data.maxMediaMb,
    },
  });

  revalidatePath("/admin", "layout");
  return {
    success: true,
    workspaceId: ws.id,
    message: `Đã tạo workspace "${parsed.data.name}". ${ownerNotice}`.trim(),
  };
}

export async function renameWorkspaceAction(workspaceId: string, name: string): Promise<Result> {
  const parsed = renameWorkspaceSchema.safeParse({ workspaceId, name });
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };
  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("workspaces")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.workspaceId)
    .select("id")
    .single();
  if (error || !data) {
    return { success: false, error: "Không đổi được tên workspace." };
  }

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: "workspace.rename",
    targetType: "workspace",
    targetId: parsed.data.workspaceId,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/admin", "layout");
  return { success: true, message: `Đã đổi tên workspace thành "${parsed.data.name}".` };
}

export async function updateWorkspaceLimitsAction(
  workspaceId: string,
  input: WorkspaceLimitsInput
): Promise<Result> {
  if (!z.uuid().safeParse(workspaceId).success) {
    return { success: false, error: "ID workspace không hợp lệ" };
  }
  const parsed = workspaceLimitsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };
  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const updatePayload: Database["public"]["Tables"]["workspaces"]["Update"] = {
    max_pages: parsed.data.maxPages,
    max_media_bytes: mbToBytes(parsed.data.maxMediaMb),
  };
  if (parsed.data.plan !== undefined) updatePayload.plan = parsed.data.plan;
  if (parsed.data.features !== undefined) {
    updatePayload.features = parsed.data.features as unknown as Json;
  }
  if (parsed.data.maxBranches !== undefined) updatePayload.max_branches = parsed.data.maxBranches;
  if (parsed.data.maxShells !== undefined) updatePayload.max_shells = parsed.data.maxShells;

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("workspaces")
    .update(updatePayload)
    .eq("id", workspaceId)
    .select("id, name")
    .single();
  if (error || !data)
    return { success: false, error: "Không cập nhật được cấu hình gói & giới hạn." };

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: "workspace.update_limits",
    targetType: "workspace",
    targetId: workspaceId,
    metadata: {
      name: data.name,
      plan: parsed.data.plan,
      maxPages: parsed.data.maxPages,
      maxMediaMb: parsed.data.maxMediaMb,
      maxBranches: parsed.data.maxBranches,
      maxShells: parsed.data.maxShells,
    },
  });

  revalidatePath("/admin", "layout");
  return { success: true, message: `Đã cập nhật gói & giới hạn cho "${data.name}".` };
}

export async function setWorkspaceArchivedAction(
  workspaceId: string,
  archived: boolean
): Promise<Result> {
  if (!z.uuid().safeParse(workspaceId).success) {
    return { success: false, error: "ID workspace không hợp lệ" };
  }
  if (workspaceId === GO_CAFE_WORKSPACE_ID && archived) {
    return { success: false, error: "Không thể lưu trữ workspace Gờ Cafe." };
  }
  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("workspaces")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", workspaceId)
    .select("id, name")
    .single();
  if (error || !data) return { success: false, error: "Không cập nhật được workspace." };

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: archived ? "workspace.archive" : "workspace.restore",
    targetType: "workspace",
    targetId: workspaceId,
    metadata: { name: data.name },
  });

  revalidatePath("/admin", "layout");
  return {
    success: true,
    message: archived
      ? `Đã lưu trữ workspace "${data.name}".`
      : `Đã khôi phục workspace "${data.name}".`,
  };
}
