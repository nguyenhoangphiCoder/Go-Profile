import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.generated";

type Db = SupabaseClient<Database>;

/**
 * Các revision còn "đang dùng": bản đang xuất bản của trang chưa lưu trữ + mọi bản nháp.
 * Bản đã niêm phong nhưng đã bị bản mới thay thế không còn hiển thị ở đâu nên không tính.
 */
export async function getActiveRevisionIds(db: Db): Promise<string[]> {
  const [published, drafts] = await Promise.all([
    db
      .from("pages")
      .select("published_revision_id")
      .is("archived_at", null)
      .not("published_revision_id", "is", null),
    db.from("page_revisions").select("id").eq("state", "draft"),
  ]);

  const ids = new Set<string>();
  for (const p of published.data ?? []) {
    if (p.published_revision_id) ids.add(p.published_revision_id);
  }
  for (const d of drafts.data ?? []) ids.add(d.id);
  return [...ids];
}

/** ID ảnh đang được các revision còn dùng tham chiếu (theo bảng revision_media_assets). */
export async function getMediaUsedByActiveRevisions(db: Db): Promise<Set<string>> {
  const revisionIds = await getActiveRevisionIds(db);
  const used = new Set<string>();
  if (revisionIds.length === 0) return used;

  const { data } = await db
    .from("revision_media_assets")
    .select("media_asset_id")
    .in("revision_id", revisionIds);
  for (const row of data ?? []) used.add(row.media_asset_id);
  return used;
}

/** Ảnh có đang được bản xuất bản hoặc bản nháp nào dùng không. */
export async function isMediaUsedByActiveRevision(db: Db, mediaId: string): Promise<boolean> {
  const revisionIds = await getActiveRevisionIds(db);
  if (revisionIds.length === 0) return false;

  const { data } = await db
    .from("revision_media_assets")
    .select("revision_id")
    .eq("media_asset_id", mediaId)
    .in("revision_id", revisionIds)
    .limit(1);
  return (data?.length ?? 0) > 0;
}
