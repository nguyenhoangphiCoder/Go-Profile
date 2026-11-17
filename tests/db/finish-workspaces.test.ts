// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asService, asUser, createDb } from "./harness";
import { createMedia, createPageWithAvatar, createPlatformAdmin } from "./seed";

// Mỗi test dựng PostgreSQL (PGlite) và chạy toàn bộ migration: cần nhiều hơn 5 giây khi máy bận
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let db: PGlite;
let wsB: string;
let page: { pageId: string; revisionId: string };
let pageLinkId: string;

const publicPage = (slug: string) =>
  asUser(db, null, async (tx) => {
    const r = await tx.query<{ r: { found: boolean; reason?: string } }>(
      "SELECT public.get_public_page($1) AS r",
      [slug]
    );
    return r.rows[0].r;
  });

const resolveLink = (id: string) =>
  asService(db, async (tx) => {
    const r = await tx.query<{ r: { valid: boolean } }>(
      "SELECT public.resolve_public_link($1) AS r",
      [id]
    );
    return r.rows[0].r;
  });

beforeEach(async () => {
  db = await createDb();
  const admin = await createPlatformAdmin(db);
  wsB = (
    await db.query<{ id: string }>("INSERT INTO public.workspaces (name) VALUES ('B') RETURNING id")
  ).rows[0].id;
  await db.query(
    "INSERT INTO public.workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')",
    [wsB, admin]
  );
  await createMedia(db, "b.png", wsB);
  page = await createPageWithAvatar(db, admin, {
    slug: "trang-b",
    avatarPath: "b.png",
    workspaceId: wsB,
  });

  // Gắn một liên kết vào khối header rồi xuất bản
  const linkId = (
    await db.query<{ id: string }>(
      "INSERT INTO public.links (workspace_id, default_label, target_url) VALUES ($1, 'Menu', 'https://b.vn') RETURNING id",
      [wsB]
    )
  ).rows[0].id;
  pageLinkId = (
    await db.query<{ id: string }>(
      "INSERT INTO public.page_links (page_id, link_id) VALUES ($1, $2) RETURNING id",
      [page.pageId, linkId]
    )
  ).rows[0].id;
  const blockId = (
    await db.query<{ id: string }>("SELECT id FROM public.page_blocks WHERE revision_id = $1", [
      page.revisionId,
    ])
  ).rows[0].id;
  await db.query(
    "INSERT INTO public.revision_link_placements (page_id, revision_id, block_id, page_link_id, position) VALUES ($1, $2, $3, $4, 0)",
    [page.pageId, page.revisionId, blockId, pageLinkId]
  );
  await asUser(db, admin, (tx) =>
    tx.query("SELECT public.publish_page($1, $2, 1, 1)", [page.pageId, page.revisionId])
  );
});

describe("workspace đã lưu trữ", () => {
  it("trang công khai và link /r hoạt động khi workspace còn hoạt động", async () => {
    expect((await publicPage("trang-b")).found).toBe(true);
    expect((await resolveLink(pageLinkId)).valid).toBe(true);
  });

  it("lưu trữ workspace: trang công khai biến mất, link không chuyển hướng; khôi phục thì hiện lại", async () => {
    await db.query("UPDATE public.workspaces SET archived_at = now() WHERE id = $1", [wsB]);
    expect(await publicPage("trang-b")).toMatchObject({ found: false, reason: "PAGE_UNPUBLISHED" });
    expect((await resolveLink(pageLinkId)).valid).toBe(false);

    await db.query("UPDATE public.workspaces SET archived_at = NULL WHERE id = $1", [wsB]);
    expect((await publicPage("trang-b")).found).toBe(true);
  });
});

describe("bỏ DEFAULT workspace", () => {
  it.each(["pages", "links", "media_assets", "theme_presets"])(
    "%s không còn giá trị mặc định cho workspace_id",
    async (table) => {
      const r = await db.query<{ d: string | null }>(
        "SELECT column_default AS d FROM information_schema.columns WHERE table_name = $1 AND column_name = 'workspace_id'",
        [table]
      );
      expect(r.rows[0].d).toBeNull();
    }
  );

  it("thêm bản ghi thiếu workspace bị từ chối thay vì lặng lẽ vào Gờ Cafe", async () => {
    await expect(
      db.query("INSERT INTO public.links (default_label, target_url) VALUES ('X', 'https://x.vn')")
    ).rejects.toThrow(/workspace_id/);
  });

  it("create_page bản 3 tham số (tương thích) vẫn tạo trang trong Gờ Cafe", async () => {
    const admin = (
      await db.query<{ user_id: string }>("SELECT user_id FROM public.admin_users LIMIT 1")
    ).rows[0].user_id;
    const r = await asUser(db, admin, (tx) =>
      tx.query<{ r: { page_id: string } }>(
        "SELECT public.create_page('Cũ', 'cu-3-tham-so', 'Cũ') AS r"
      )
    );
    const ws = await db.query<{ workspace_id: string }>(
      "SELECT workspace_id FROM public.pages WHERE id = $1",
      [r.rows[0].r.page_id]
    );
    expect(ws.rows[0].workspace_id).toBe("00000000-0000-4000-8000-000000000001");
  });
});
