import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveAdmin } from "@/features/auth/queries";
import { clientEnv } from "@/lib/env.client";
import type { MediaAssetItem } from "./types";

export function getPublicMediaUrl(objectPath: string): string {
  if (!objectPath) return "";
  return `${clientEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public_media/${objectPath}`;
}

export async function getMediaAssets(): Promise<MediaAssetItem[]> {
  await requireActiveAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: rows, error } = await supabase
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
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error || !rows) {
    console.error("Error fetching media assets:", error);
    return [];
  }

  // Lấy danh sách asset IDs đang được tham chiếu trong links hoặc revision_media_assets
  const { data: referencedInLinks } = await supabase
    .from("links")
    .select("default_media_id")
    .not("default_media_id", "is", null)
    .is("archived_at", null);

  const { data: referencedInRevisions } = await supabase
    .from("revision_media_assets")
    .select("media_asset_id");

  const referencedSet = new Set<string>();

  (referencedInLinks || []).forEach((l) => {
    if (l.default_media_id) referencedSet.add(l.default_media_id);
  });

  (referencedInRevisions || []).forEach((r) => {
    if (r.media_asset_id) referencedSet.add(r.media_asset_id);
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
