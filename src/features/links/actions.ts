"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import { requireActiveAdmin } from "@/features/auth/queries";
import { linkSchema } from "./schemas";
import type { LinkActionState } from "./types";

const STALE_LINK_ERROR =
  "Liên kết không tồn tại hoặc đã bị thay đổi bởi người khác. Vui lòng tải lại trang và thử lại.";

function toDbKind(kind: string): "standard" | "contact" | "social" {
  if (kind === "tel" || kind === "mailto" || kind === "contact") {
    return "contact";
  }
  if (kind === "social") {
    return "social";
  }
  return "standard";
}

export async function upsertLinkAction(
  _prevState: LinkActionState,
  formData: FormData
): Promise<LinkActionState> {
  try {
    const admin = await requireActiveAdmin();

    const rawData = {
      id: formData.get("id") ? String(formData.get("id")) : undefined,
      defaultLabel: formData.get("defaultLabel"),
      targetUrl: formData.get("targetUrl"),
      kind: formData.get("kind"),
      description: formData.get("description") || null,
      defaultMediaId: formData.get("defaultMediaId")
        ? String(formData.get("defaultMediaId"))
        : null,
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
    const adminClient = createSupabaseAdminClient();
    const dbKind = toDbKind(kind);

    if (id) {
      // Cập nhật link có kiểm tra optimistic locking
      const { data: currentLink, error: fetchError } = await adminClient
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
          error:
            "Dữ liệu liên kết đã bị thay đổi bởi người khác. Vui lòng tải lại trang và thử lại.",
        };
      }

      const { error: updateError } = await adminClient
        .from("links")
        .update({
          default_label: defaultLabel,
          target_url: targetUrl,
          kind: dbKind,
          default_media_id: defaultMediaId,
          lock_version: lockVersion + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        console.error("Update link error:", updateError);
        return {
          success: false,
          error: "Không thể cập nhật liên kết: " + updateError.message,
        };
      }
    } else {
      // Thêm link mới
      const { error: insertError } = await adminClient.from("links").insert({
        default_label: defaultLabel,
        target_url: targetUrl,
        kind: dbKind,
        default_media_id: defaultMediaId,
        created_by: admin.userId,
        lock_version: 1,
      });

      if (insertError) {
        console.error("Insert link error:", insertError);
        return {
          success: false,
          error: "Không thể thêm liên kết mới: " + insertError.message,
        };
      }
    }

    revalidatePath("/admin/links");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    unstable_rethrow(err);
    console.error("Unexpected error in upsertLinkAction:", err);
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
    return { success: false, error: message };
  }
}

export async function toggleLinkStatusAction(
  id: string,
  currentStatus: boolean,
  expectedVersion: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireActiveAdmin();
    const adminClient = createSupabaseAdminClient();

    const { data: updated, error } = await adminClient
      .from("links")
      .update({
        is_active: !currentStatus,
        lock_version: expectedVersion + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("lock_version", expectedVersion)
      .select("id");

    if (error) {
      console.error("Toggle link status error:", error);
      return { success: false, error: "Không thể thay đổi trạng thái liên kết: " + error.message };
    }

    if (!updated || updated.length === 0) {
      return { success: false, error: STALE_LINK_ERROR };
    }

    revalidatePath("/admin/links");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    unstable_rethrow(err);
    console.error("Unexpected error in toggleLinkStatusAction:", err);
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
    return { success: false, error: message };
  }
}

export async function archiveLinkAction(
  id: string,
  expectedVersion: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireActiveAdmin();
    const adminClient = createSupabaseAdminClient();

    const { data: updated, error } = await adminClient
      .from("links")
      .update({
        is_active: false,
        archived_at: new Date().toISOString(),
        lock_version: expectedVersion + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("lock_version", expectedVersion)
      .select("id");

    if (error) {
      console.error("Archive link error:", error);
      return { success: false, error: "Không thể lưu trữ liên kết: " + error.message };
    }

    if (!updated || updated.length === 0) {
      return { success: false, error: STALE_LINK_ERROR };
    }

    revalidatePath("/admin/links");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    unstable_rethrow(err);
    console.error("Unexpected error in archiveLinkAction:", err);
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
    return { success: false, error: message };
  }
}
