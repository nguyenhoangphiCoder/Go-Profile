import type { PGlite } from "@electric-sql/pglite";
import { asUser, createUser } from "./harness";

/** Tạo quản trị viên hệ thống (bảng admin_users). */
export async function createPlatformAdmin(db: PGlite, email = "admin@go.test") {
  const id = await createUser(db, email);
  await db.query("INSERT INTO public.admin_users (user_id, display_name) VALUES ($1, 'Admin')", [
    id,
  ]);
  return id;
}

export async function createMedia(db: PGlite, objectPath: string, workspaceId?: string) {
  const cols = workspaceId ? ", workspace_id" : "";
  const vals = workspaceId ? ", $2" : "";
  const res = await db.query<{ id: string }>(
    `INSERT INTO public.media_assets (bucket_id, object_path, visibility, status${cols})
     VALUES ('public_media', $1, 'public', 'ready'${vals}) RETURNING id`,
    workspaceId ? [objectPath, workspaceId] : [objectPath]
  );
  return res.rows[0].id;
}

/**
 * Tạo trang qua RPC create_page (với quyền của userId), gắn avatar vào khối header,
 * rồi (tuỳ chọn) xuất bản qua RPC publish_page.
 */
export async function createPageWithAvatar(
  db: PGlite,
  userId: string,
  opts: { slug: string; avatarPath: string; publish?: boolean; workspaceId?: string }
) {
  const created = await asUser(db, userId, async (tx) => {
    const sql = opts.workspaceId
      ? "SELECT public.create_page($1, 'Trang test', $2, 'Tiêu đề') AS r"
      : "SELECT public.create_page('Trang test', $1, 'Tiêu đề') AS r";
    const params = opts.workspaceId ? [opts.workspaceId, opts.slug] : [opts.slug];
    const res = await tx.query<{ r: { page_id: string; revision_id: string } }>(sql, params);
    return res.rows[0].r;
  });

  await db.query(
    `UPDATE public.page_blocks SET payload = jsonb_build_object(
       'title', 'Tiêu đề',
       'avatarUrl', 'https://x.supabase.co/storage/v1/object/public/public_media/' || $2::text)
     WHERE revision_id = $1`,
    [created.revision_id, opts.avatarPath]
  );

  if (opts.publish) {
    await asUser(db, userId, (tx) =>
      tx.query("SELECT public.publish_page($1, $2, 1, 1)", [created.page_id, created.revision_id])
    );
  }
  return { pageId: created.page_id, revisionId: created.revision_id };
}
