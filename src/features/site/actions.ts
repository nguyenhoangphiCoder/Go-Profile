"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_PAGES_TAG } from "@/features/public/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.generated";
import { getWorkspaceForAction } from "@/features/workspace/context";
import {
  canUseWorkspaceFeature,
  checkWorkspaceQuota,
  FEATURE_DISABLED_MESSAGES,
} from "@/features/workspace/guards";
import { FORBIDDEN_ERROR } from "@/features/workspace/types";
import {
  createNavItemSchema,
  createPageForNavSchema,
  createSiteShellSchema,
  renameSiteShellSchema,
  reorderNavItemsSchema,
  saveSiteSettingsSchema,
  updateNavItemSchema,
  type CreateNavItemInput,
  type CreatePageForNavInput,
  type ReorderNavItemsInput,
  type SaveSiteSettingsInput,
  type UpdateNavItemInput,
} from "./schemas";

function revalidateSite() {
  revalidatePath("/");
  revalidatePath("/admin/site");
  revalidatePath("/admin/pages");
  revalidateTag(PUBLIC_PAGES_TAG, "max");
}

function normalizeTargetValue(type: "page" | "anchor" | "url", val?: string | null): string | null {
  if (type === "page") return null;
  const trimmed = (val || "").trim();
  if (type === "anchor" && trimmed && !trimmed.startsWith("#")) {
    return `#${trimmed}`;
  }
  return trimmed || null;
}

async function resolveTargetShellId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  workspaceId: string,
  requestedShellId?: string
): Promise<string | null> {
  if (requestedShellId) {
    const { data } = await supabase
      .from("site_shells")
      .select("id")
      .eq("id", requestedShellId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (data?.id) return data.id;
  }
  const { data: def } = await supabase
    .from("site_shells")
    .select("id")
    .eq("workspace_id", workspaceId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return def?.id ?? null;
}

export async function createSiteShellAction(name: string) {
  const parsed = createSiteShellSchema.safeParse({ name });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Tên bộ Menu không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };
  if (!canUseWorkspaceFeature(ctx, "landing")) {
    return { success: false, error: FEATURE_DISABLED_MESSAGES.landing };
  }

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("site_shells")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ctx.workspace.id);

  const quota = checkWorkspaceQuota({
    isPlatformAdmin: ctx.isPlatformAdmin,
    current: count ?? 0,
    max: ctx.workspace.maxShells,
    resourceLabel: "bộ giao diện (Site Shell)",
  });
  if (!quota.ok) return { success: false, error: quota.error };

  const { data, error } = await supabase
    .from("site_shells")
    .insert({
      workspace_id: ctx.workspace.id,
      name: parsed.data.name,
      is_default: (count ?? 0) === 0,
      site_name: parsed.data.name,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Lỗi tạo bộ Site Shell:", error);
    return { success: false, error: error?.message || "Không thể tạo bộ Menu mới" };
  }

  revalidateSite();
  return { success: true, id: data.id };
}

export async function renameSiteShellAction(shellId: string, name: string) {
  const parsed = renameSiteShellSchema.safeParse({ shellId, name });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Tên bộ Menu không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("site_shells")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.shellId)
    .eq("workspace_id", ctx.workspace.id);

  if (error) {
    return { success: false, error: error.message || "Không thể đổi tên bộ Menu" };
  }

  revalidateSite();
  return { success: true };
}

export async function setDefaultSiteShellAction(shellId: string) {
  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();
  // Bỏ mặc định cũ trước rồi đặt mặc định mới (tuân thủ unique partial index)
  await supabase
    .from("site_shells")
    .update({ is_default: false })
    .eq("workspace_id", ctx.workspace.id)
    .eq("is_default", true);

  const { error } = await supabase
    .from("site_shells")
    .update({ is_default: true })
    .eq("id", shellId)
    .eq("workspace_id", ctx.workspace.id);

  if (error) {
    return { success: false, error: error.message || "Không thể đặt bộ Menu mặc định" };
  }

  revalidateSite();
  return { success: true };
}

export async function deleteSiteShellAction(shellId: string) {
  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();
  const { data: allShells } = await supabase
    .from("site_shells")
    .select("id, is_default")
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: true });

  if (!allShells || allShells.length <= 1) {
    return { success: false, error: "Cần giữ lại ít nhất 1 bộ Menu cho workspace." };
  }

  const target = allShells.find((s) => s.id === shellId);
  if (!target) {
    return { success: false, error: "Không tìm thấy bộ Menu cần xóa." };
  }

  const { error } = await supabase
    .from("site_shells")
    .delete()
    .eq("id", shellId)
    .eq("workspace_id", ctx.workspace.id);

  if (error) {
    return { success: false, error: error.message || "Không thể xóa bộ Menu" };
  }

  // Nếu vừa xóa bộ mặc định -> tự đặt bộ đầu tiên còn lại làm mặc định
  if (target.is_default) {
    const nextDefault = allShells.find((s) => s.id !== shellId);
    if (nextDefault) {
      await supabase
        .from("site_shells")
        .update({ is_default: true })
        .eq("id", nextDefault.id)
        .eq("workspace_id", ctx.workspace.id);
    }
  }

  revalidateSite();
  return { success: true };
}

export async function saveSiteSettingsAction(input: SaveSiteSettingsInput) {
  const parsed = saveSiteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Cấu hình website không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };
  if (!canUseWorkspaceFeature(ctx, "landing")) {
    return { success: false, error: FEATURE_DISABLED_MESSAGES.landing };
  }

  const supabase = await createSupabaseServerClient();
  const targetShellId = await resolveTargetShellId(supabase, ctx.workspace.id, parsed.data.shellId);

  if (!targetShellId) {
    return { success: false, error: "Không tìm thấy bộ Menu để lưu cấu hình" };
  }

  // Nếu gói của Workspace tắt Marketing Pixels (tracking), xóa sạch tracking IDs trước khi lưu
  const headerConfigToSave = canUseWorkspaceFeature(ctx, "tracking")
    ? parsed.data.headerConfig
    : { ...parsed.data.headerConfig, tracking: undefined };

  const { error } = await supabase
    .from("site_shells")
    .update({
      site_name: parsed.data.siteName || null,
      logo_media_id: parsed.data.logoMediaId ?? null,
      header_config: headerConfigToSave as unknown as Json,
      footer_columns: parsed.data.footerColumns as unknown as Json,
      floating_contact: parsed.data.floatingContact as unknown as Json,
    })
    .eq("id", targetShellId)
    .eq("workspace_id", ctx.workspace.id);

  if (error) {
    console.error("Lỗi lưu cấu hình site:", error);
    return { success: false, error: error.message || "Không thể lưu cấu hình website" };
  }

  revalidateSite();
  return { success: true };
}

export async function createNavItemAction(input: CreateNavItemInput) {
  const parsed = createNavItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Thông tin mục menu không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();
  const targetShellId = await resolveTargetShellId(supabase, ctx.workspace.id, parsed.data.shellId);

  if (!targetShellId) {
    return { success: false, error: "Không tìm thấy bộ Menu cho workspace này" };
  }

  // Lấy position kế tiếp trong cùng cấp & cùng bộ Menu
  const posQuery = supabase
    .from("site_nav_items")
    .select("position")
    .eq("workspace_id", ctx.workspace.id)
    .eq("shell_id", targetShellId)
    .order("position", { ascending: false })
    .limit(1);

  const { data: lastRow } = parsed.data.parentId
    ? await posQuery.eq("parent_id", parsed.data.parentId)
    : await posQuery.is("parent_id", null);

  const nextPos = lastRow && lastRow.length > 0 ? Number(lastRow[0].position) + 1 : 0;

  const { data, error } = await supabase
    .from("site_nav_items")
    .insert({
      workspace_id: ctx.workspace.id,
      shell_id: targetShellId,
      parent_id: parsed.data.parentId ?? null,
      label: parsed.data.label,
      target_type: parsed.data.targetType,
      target_page_id: parsed.data.targetType === "page" ? (parsed.data.targetPageId ?? null) : null,
      target_value: normalizeTargetValue(parsed.data.targetType, parsed.data.targetValue),
      position: nextPos,
      is_visible: parsed.data.isVisible,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Lỗi tạo mục menu:", error);
    return { success: false, error: error.message || "Không thể thêm mục menu" };
  }

  revalidateSite();
  return { success: true, id: data.id };
}

export async function updateNavItemAction(input: UpdateNavItemInput) {
  const parsed = updateNavItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Thông tin mục menu không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();
  const updatePayload: {
    parent_id?: string | null;
    label: string;
    target_type: "page" | "anchor" | "url";
    target_page_id: string | null;
    target_value: string | null;
    is_visible?: boolean;
  } = {
    label: parsed.data.label,
    target_type: parsed.data.targetType,
    target_page_id: parsed.data.targetType === "page" ? (parsed.data.targetPageId ?? null) : null,
    target_value: normalizeTargetValue(parsed.data.targetType, parsed.data.targetValue),
  };

  if (parsed.data.parentId !== undefined) {
    updatePayload.parent_id = parsed.data.parentId;
  }
  if (parsed.data.isVisible !== undefined) {
    updatePayload.is_visible = parsed.data.isVisible;
  }

  const { error } = await supabase
    .from("site_nav_items")
    .update(updatePayload)
    .eq("id", parsed.data.id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) {
    console.error("Lỗi cập nhật mục menu:", error);
    return { success: false, error: error.message || "Không thể cập nhật mục menu" };
  }

  revalidateSite();
  return { success: true };
}

export async function deleteNavItemAction(navItemId: string) {
  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("site_nav_items")
    .delete()
    .eq("id", navItemId)
    .eq("workspace_id", ctx.workspace.id);

  if (error) {
    console.error("Lỗi xóa mục menu:", error);
    return { success: false, error: error.message || "Không thể xóa mục menu" };
  }

  revalidateSite();
  return { success: true };
}

export async function reorderNavItemsAction(input: ReorderNavItemsInput) {
  const parsed = reorderNavItemsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu sắp xếp menu không hợp lệ" };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();
  for (const item of parsed.data.items) {
    const { error } = await supabase
      .from("site_nav_items")
      .update({ parent_id: item.parentId, position: item.position })
      .eq("id", item.id)
      .eq("workspace_id", ctx.workspace.id);
    if (error) {
      console.error("Lỗi sắp xếp menu:", error);
      return { success: false, error: error.message || "Không thể lưu thứ tự menu" };
    }
  }

  revalidateSite();
  return { success: true };
}

/**
 * Tiện ích "Tạo trang Landing Page mới cho tab này":
 * Tạo đồng thời 1 Landing Page mới (gắn sẵn đúng bộ Menu hiện tại) và thêm tab vào Menu đó.
 */
export async function createPageAndLinkNavAction(input: CreatePageForNavInput) {
  const parsed = createPageForNavSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Thông tin tạo trang cho tab không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();
  const targetShellId = await resolveTargetShellId(supabase, ctx.workspace.id, parsed.data.shellId);

  const { data: created, error: createErr } = await supabase.rpc("create_page", {
    p_workspace_id: ctx.workspace.id,
    p_internal_name: parsed.data.label,
    p_slug: parsed.data.slug,
    p_title: parsed.data.title || parsed.data.label,
    p_page_kind: "landing",
  });

  if (createErr || !created) {
    console.error("Lỗi tạo trang mới cho tab:", createErr);
    return { success: false, error: createErr?.message || "Không thể tạo trang mới" };
  }

  const pageId = (created as { page_id?: string }).page_id;
  if (!pageId) {
    return { success: false, error: "Không nhận được ID trang vừa tạo" };
  }

  // Gắn luôn trang mới vào đúng bộ Menu (Site Shell) đang mở
  if (targetShellId) {
    await supabase
      .from("pages")
      .update({ site_shell_id: targetShellId })
      .eq("id", pageId)
      .eq("workspace_id", ctx.workspace.id);
  }

  const navRes = await createNavItemAction({
    shellId: targetShellId || undefined,
    parentId: parsed.data.parentId ?? null,
    label: parsed.data.label,
    targetType: "page",
    targetPageId: pageId,
    isVisible: true,
  });

  if (!navRes.success) {
    return { success: false, error: navRes.error, pageId };
  }

  revalidatePath("/admin/pages");
  return { success: true, pageId, navItemId: navRes.id };
}
