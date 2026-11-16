"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import { getWorkspaceForAction } from "@/features/workspace/context";
import { FORBIDDEN_ERROR } from "@/features/workspace/types";
import { mediaUploadSchema } from "./schemas";
import { isMediaUsedByActiveRevision } from "./usage";
import type { MediaUploadState } from "./types";

export async function uploadMediaAction(
  _prevState: MediaUploadState,
  formData: FormData
): Promise<MediaUploadState> {
  try {
    const ctx = await getWorkspaceForAction("editor");
    if (!ctx) return { success: false, error: FORBIDDEN_ERROR };
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: "Vui lòng chọn một tệp hình ảnh để tải lên." };
    }

    const validation = mediaUploadSchema.safeParse({
      filename: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Tệp tải lên không hợp lệ.",
      };
    }

    const adminClient = createSupabaseAdminClient();

    // Giới hạn dung lượng ảnh của workspace
    const { data: usedRows, error: usedError } = await adminClient
      .from("media_assets")
      .select("size_bytes")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null);
    if (usedError) {
      return { success: false, error: "Không kiểm tra được dung lượng đã dùng của workspace." };
    }
    const usedBytes = (usedRows ?? []).reduce((sum, r) => sum + Number(r.size_bytes ?? 0), 0);
    if (usedBytes + file.size > ctx.workspace.maxMediaBytes) {
      const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
      return {
        success: false,
        error: `Workspace đã dùng ${mb(usedBytes)}/${mb(ctx.workspace.maxMediaBytes)} MB. Hãy xoá bớt ảnh không dùng hoặc liên hệ quản trị hệ thống để nâng giới hạn.`,
      };
    }

    const bucketId = "public_media";
    const cleanFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
    const uniqueKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const objectPath = `uploads/${uniqueKey}-${cleanFilename}`;

    // 1. Tạo bản ghi trạng thái pending trong media_assets
    const { data: assetRecord, error: insertError } = await adminClient
      .from("media_assets")
      .insert({
        bucket_id: bucketId,
        object_path: objectPath,
        visibility: "public",
        status: "pending",
        mime_type: file.type,
        size_bytes: file.size,
        original_filename: file.name,
        created_by: ctx.user.userId,
        workspace_id: ctx.workspace.id,
      })
      .select("id")
      .single();

    if (insertError || !assetRecord) {
      console.error("Error creating pending media asset:", insertError);
      return {
        success: false,
        error: "Không thể khởi tạo bản ghi tài nguyên: " + (insertError?.message || ""),
      };
    }

    // 2. Upload file vào Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: storageError } = await adminClient.storage
      .from(bucketId)
      .upload(objectPath, fileBuffer, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      // Đánh dấu failed
      await adminClient.from("media_assets").update({ status: "failed" }).eq("id", assetRecord.id);

      return {
        success: false,
        error: "Tải tệp lên bộ nhớ lưu trữ thất bại: " + storageError.message,
      };
    }

    // 3. Đánh dấu ready
    await adminClient.from("media_assets").update({ status: "ready" }).eq("id", assetRecord.id);

    const { data: publicUrlData } = adminClient.storage.from(bucketId).getPublicUrl(objectPath);

    revalidatePath("/admin/media");
    return {
      success: true,
      asset: {
        id: assetRecord.id,
        bucketId,
        objectPath,
        visibility: "public",
        status: "ready",
        mimeType: file.type,
        sizeBytes: file.size,
        width: null,
        height: null,
        originalFilename: file.name,
        publicUrl: publicUrlData.publicUrl,
        isReferenced: false,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    unstable_rethrow(err);
    console.error("Unexpected error in uploadMediaAction:", err);
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
    return { success: false, error: message };
  }
}

export async function uploadMediaDirectAction(formData: FormData): Promise<MediaUploadState> {
  return uploadMediaAction({}, formData);
}

export async function deleteMediaAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getWorkspaceForAction("editor");
    if (!ctx) return { success: false, error: FORBIDDEN_ERROR };
    const adminClient = createSupabaseAdminClient();

    // 0. Ảnh phải thuộc workspace hiện tại
    const { data: owned } = await adminClient
      .from("media_assets")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null)
      .maybeSingle();
    if (!owned) {
      return { success: false, error: "Hình ảnh không tồn tại trong workspace hiện tại." };
    }

    // 1. Kiểm tra tham chiếu trên TOÀN hệ thống (service role): trang ở workspace khác có thể
    //    đang dùng URL công khai của ảnh này
    const { data: linkUsage } = await adminClient
      .from("links")
      .select("id")
      .eq("default_media_id", id)
      .is("archived_at", null)
      .limit(1);

    if (linkUsage && linkUsage.length > 0) {
      return {
        success: false,
        error: "Không thể xóa hình ảnh đang được sử dụng làm ảnh mặc định của liên kết.",
      };
    }

    // Ảnh nằm trong bản đang xuất bản hoặc bản nháp của trang (avatar, banner, khối ảnh,
    // thư viện, thẻ món, nền theme, icon liên kết...) — xem migration 20261116000003.
    if (await isMediaUsedByActiveRevision(adminClient, id)) {
      return {
        success: false,
        error:
          "Không thể xóa hình ảnh đang được sử dụng trên trang (bản đã xuất bản hoặc bản nháp).",
      };
    }

    // 2. Lấy thông tin file trong Storage
    const { data: asset, error: fetchError } = await adminClient
      .from("media_assets")
      .select("bucket_id, object_path")
      .eq("id", id)
      .single();

    if (fetchError || !asset) {
      return { success: false, error: "Hình ảnh không tồn tại." };
    }

    // 3. Xóa file khỏi Storage
    await adminClient.storage.from(asset.bucket_id).remove([asset.object_path]);

    // 4. Đánh dấu xóa mềm trong database
    const { error: deleteError } = await adminClient
      .from("media_assets")
      .update({
        archived_at: new Date().toISOString(),
        status: "deleting",
      })
      .eq("id", id);

    if (deleteError) {
      console.error("Delete media asset error:", deleteError);
      return { success: false, error: "Lỗi cập nhật trạng thái xóa tài nguyên." };
    }

    revalidatePath("/admin/media");
    return { success: true };
  } catch (err: unknown) {
    unstable_rethrow(err);
    console.error("Unexpected error in deleteMediaAction:", err);
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
    return { success: false, error: message };
  }
}
