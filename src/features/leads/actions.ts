"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceForAction } from "@/features/workspace/context";
import { canUseWorkspaceFeature, FEATURE_DISABLED_MESSAGES } from "@/features/workspace/guards";
import { FORBIDDEN_ERROR } from "@/features/workspace/types";
import { updateLeadStatusSchema } from "./schemas";
import type { LeadStatus } from "./types";

export async function updateLeadStatusAction(id: string, status: LeadStatus) {
  const parsed = updateLeadStatusSchema.safeParse({ id, status });
  if (!parsed.success) {
    return { success: false, error: "Trạng thái không hợp lệ" };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };
  if (!canUseWorkspaceFeature(ctx, "leads")) {
    return { success: false, error: FEATURE_DISABLED_MESSAGES.leads };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) {
    console.error("Lỗi cập nhật trạng thái lead:", error);
    return { success: false, error: error.message || "Không thể cập nhật trạng thái" };
  }

  revalidatePath("/admin/leads");
  return { success: true };
}

export async function deleteLeadAction(id: string) {
  if (!z.uuid().safeParse(id).success) {
    return { success: false, error: "ID khách hàng không hợp lệ" };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };
  if (!canUseWorkspaceFeature(ctx, "leads")) {
    return { success: false, error: FEATURE_DISABLED_MESSAGES.leads };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) {
    console.error("Lỗi xóa lead:", error);
    return { success: false, error: error.message || "Không thể xóa bản ghi" };
  }

  revalidatePath("/admin/leads");
  return { success: true };
}
