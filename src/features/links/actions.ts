"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveAdmin } from "@/features/auth/queries";
import { linkSchema } from "./schemas";
import type { LinkActionState } from "./types";

export async function upsertLinkAction(
  _prevState: LinkActionState,
  formData: FormData
): Promise<LinkActionState> {
  const admin = await requireActiveAdmin();

  const rawData = {
    id: formData.get("id") ? String(formData.get("id")) : undefined,
    defaultLabel: formData.get("defaultLabel"),
    targetUrl: formData.get("targetUrl"),
    kind: formData.get("kind"),
    description: formData.get("description") || null,
    defaultMediaId: formData.get("defaultMediaId") ? String(formData.get("defaultMediaId")) : null,
    lockVersion: formData.get("lockVersion") || 1,
  };

  const parsed = linkSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, defaultLabel, targetUrl, kind, defaultMediaId, lockVersion } = parsed.data;
  const supabase = await createSupabaseServerClient();

  if (id) {
    // Cập nhật link có kiểm tra optimistic locking
    const { data: currentLink, error: fetchError } = await supabase
      .from("links")
      .select("lock_version")
      .eq("id", id)
      .single();

    if (fetchError || !currentLink) {
      return {
        success: false,
        error: "Liên kết không tồn tại hoặc đã bị xóa.",
      };
    }

    if (currentLink.lock_version !== lockVersion) {
      return {
        success: false,
        error: "Dữ liệu liên kết đã bị thay đổi bởi người khác. Vui lòng tải lại trang và thử lại.",
      };
    }

    const { error: updateError } = await supabase
      .from("links")
      .update({
        default_label: defaultLabel,
        target_url: targetUrl,
        kind,
        default_media_id: defaultMediaId,
        lock_version: lockVersion + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Update link error:", updateError);
      return {
        success: false,
        error: "Không thể cập nhật liên kết. Vui lòng thử lại sau.",
      };
    }
  } else {
    // Thêm link mới
    const { error: insertError } = await supabase.from("links").insert({
      default_label: defaultLabel,
      target_url: targetUrl,
      kind,
      default_media_id: defaultMediaId,
      created_by: admin.userId,
      lock_version: 1,
    });

    if (insertError) {
      console.error("Insert link error:", insertError);
      return {
        success: false,
        error: "Không thể thêm liên kết mới. Vui lòng thử lại sau.",
      };
    }
  }

  revalidatePath("/admin/links");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleLinkStatusAction(
  id: string,
  currentStatus: boolean,
  expectedVersion: number
): Promise<{ success: boolean; error?: string }> {
  await requireActiveAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("links")
    .update({
      is_active: !currentStatus,
      lock_version: expectedVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("lock_version", expectedVersion);

  if (error) {
    console.error("Toggle link status error:", error);
    return { success: false, error: "Không thể thay đổi trạng thái liên kết." };
  }

  revalidatePath("/admin/links");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function archiveLinkAction(
  id: string,
  expectedVersion: number
): Promise<{ success: boolean; error?: string }> {
  await requireActiveAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("links")
    .update({
      is_active: false,
      archived_at: new Date().toISOString(),
      lock_version: expectedVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("lock_version", expectedVersion);

  if (error) {
    console.error("Archive link error:", error);
    return { success: false, error: "Không thể lưu trữ liên kết." };
  }

  revalidatePath("/admin/links");
  revalidatePath("/", "layout");
  return { success: true };
}
