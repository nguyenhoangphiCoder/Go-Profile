"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import { logPlatformAudit } from "./audit";
import { getWorkspaceContext } from "./context";
import { normalizeDomainHost } from "./domain-utils";
import { FORBIDDEN_ERROR } from "./types";

type Result = { success: true; message?: string; id?: string } | { success: false; error: string };

const upsertDomainSchema = z.object({
  id: z.uuid("ID tên miền không hợp lệ").optional(),
  workspaceId: z.uuid("Vui lòng chọn Workspace hợp lệ"),
  domain: z.string().trim().min(3, "Vui lòng nhập tên miền (VD: go-cafe.com)"),
  homePageId: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
});

async function requirePlatformAdmin() {
  const ctx = await getWorkspaceContext();
  return ctx?.isPlatformAdmin ? ctx : null;
}

export async function upsertWorkspaceDomainAction(
  input: z.input<typeof upsertDomainSchema>
): Promise<Result> {
  const parsed = upsertDomainSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" };
  }

  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const normalized = normalizeDomainHost(parsed.data.domain);
  if (!normalized) {
    return {
      success: false,
      error: "Tên miền không hợp lệ. Chỉ nhập tên miền dạng go-cafe.com hoặc shop.doitac.vn (không chứa khoảng trắng hay IP).",
    };
  }

  const homePageId =
    parsed.data.homePageId && z.uuid().safeParse(parsed.data.homePageId).success
      ? parsed.data.homePageId
      : null;

  const db = createSupabaseAdminClient();

  if (parsed.data.id) {
    const { data, error } = await db
      .from("workspace_domains")
      .update({
        workspace_id: parsed.data.workspaceId,
        domain: normalized,
        home_page_id: homePageId,
        is_active: parsed.data.isActive,
      })
      .eq("id", parsed.data.id)
      .select("id")
      .single();

    if (error || !data) {
      const msg =
        error?.code === "23505"
          ? `Tên miền "${normalized}" đã được gắn cho một workspace khác.`
          : error?.message || "Không cập nhật được tên miền.";
      return { success: false, error: msg };
    }

    await logPlatformAudit({
      actorUserId: ctx.user.userId,
      actorEmail: ctx.user.email,
      action: "domain.update",
      targetType: "workspace_domain",
      targetId: data.id,
      metadata: {
        domain: normalized,
        workspaceId: parsed.data.workspaceId,
        homePageId,
        isActive: parsed.data.isActive,
      },
    });

    revalidatePath("/admin/system");
    revalidatePath("/");
    return { success: true, id: data.id, message: `Đã cập nhật tên miền ${normalized}.` };
  }

  const { data, error } = await db
    .from("workspace_domains")
    .insert({
      workspace_id: parsed.data.workspaceId,
      domain: normalized,
      home_page_id: homePageId,
      is_active: parsed.data.isActive,
    })
    .select("id")
    .single();

  if (error || !data) {
    const msg =
      error?.code === "23505"
        ? `Tên miền "${normalized}" đã tồn tại trên hệ thống.`
        : error?.message || "Không thêm được tên miền.";
    return { success: false, error: msg };
  }

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: "domain.create",
    targetType: "workspace_domain",
    targetId: data.id,
    metadata: {
      domain: normalized,
      workspaceId: parsed.data.workspaceId,
      homePageId,
    },
  });

  revalidatePath("/admin/system");
  revalidatePath("/");
  return { success: true, id: data.id, message: `Đã thêm tên miền ${normalized}.` };
}

export async function toggleWorkspaceDomainAction(
  domainId: string,
  isActive: boolean
): Promise<Result> {
  if (!z.uuid().safeParse(domainId).success) {
    return { success: false, error: "ID tên miền không hợp lệ." };
  }
  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("workspace_domains")
    .update({ is_active: isActive })
    .eq("id", domainId)
    .select("id, domain")
    .single();

  if (error || !data) return { success: false, error: "Không cập nhật được trạng thái tên miền." };

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: "domain.toggle",
    targetType: "workspace_domain",
    targetId: domainId,
    metadata: { domain: data.domain, isActive },
  });

  revalidatePath("/admin/system");
  revalidatePath("/");
  return {
    success: true,
    message: isActive ? `Đã bật tên miền ${data.domain}.` : `Đã tạm tắt tên miền ${data.domain}.`,
  };
}

export async function deleteWorkspaceDomainAction(domainId: string): Promise<Result> {
  if (!z.uuid().safeParse(domainId).success) {
    return { success: false, error: "ID tên miền không hợp lệ." };
  }
  const ctx = await requirePlatformAdmin();
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("workspace_domains")
    .delete()
    .eq("id", domainId)
    .select("id, domain")
    .single();

  if (error || !data) return { success: false, error: "Không xóa được tên miền." };

  await logPlatformAudit({
    actorUserId: ctx.user.userId,
    actorEmail: ctx.user.email,
    action: "domain.delete",
    targetType: "workspace_domain",
    targetId: domainId,
    metadata: { domain: data.domain },
  });

  revalidatePath("/admin/system");
  revalidatePath("/");
  return { success: true, message: `Đã xóa tên miền ${data.domain}.` };
}
