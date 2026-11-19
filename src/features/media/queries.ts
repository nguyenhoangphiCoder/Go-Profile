import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import { requireWorkspace } from "@/features/workspace/context";
import { clientEnv } from "@/lib/env.client";
import type { MediaAssetItem } from "./types";
import { getMediaUsedByActiveRevisions } from "./usage";

export function getPublicMediaUrl(objectPath: string): string {
  if (!objectPath) return "";
  return `${clientEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public_media/${objectPath}`;
}

export async function getMediaAssets(): Promise<MediaAssetItem[]> {
  const { workspace } = await requireWorkspace();
  const supabase = await createSupabaseServerClient();

  // Chạy song song 3 truy vấn độc lập: media_assets, links tham chiếu, và revision_media_assets
  const [{ data: rows, error }, { data: referencedInLinks }, referencedSet] = await Promise.all([
    supabase
      .from("media_assets")
      .select(
        `
      id,
      bucket_id,
      object_path,
      visibility,
      status,
      mime_type,
      size_bytes,
      width,
      height,
      original_filename,
      created_at
    `
      )
      .eq("workspace_id", workspace.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("links")
      .select("default_media_id")
      .not("default_media_id", "is", null)
      .is("archived_at", null),
    // Ảnh trong bản đang xuất bản / bản nháp của trang (cùng quy tắc với deleteMediaAction)
    getMediaUsedByActiveRevisions(createSupabaseAdminClient()),
  ]);

  if (error || !rows) {
    console.error("Error fetching media assets:", error);
    return [];
  }

  (referencedInLinks || []).forEach((l) => {
    if (l.default_media_id) referencedSet.add(l.default_media_id);
  });

  return rows.map((r) => {
    const isPublic = r.visibility === "public";
    const publicUrl = isPublic
      ? `${clientEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${r.bucket_id}/${r.object_path}`
      : "";

    return {
      id: r.id,
      bucketId: r.bucket_id,
      objectPath: r.object_path,
      visibility: r.visibility,
      status: r.status,
      mimeType: r.mime_type,
      sizeBytes: r.size_bytes,
      width: r.width,
      height: r.height,
      originalFilename: r.original_filename,
      publicUrl,
      isReferenced: referencedSet.has(r.id),
      createdAt: r.created_at,
    };
  });
}
