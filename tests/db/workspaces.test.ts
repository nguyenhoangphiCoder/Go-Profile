// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asService, asUser, createDb, createUser } from "./harness";
import { createMedia, createPageWithAvatar, createPlatformAdmin } from "./seed";

// Mỗi test dựng PostgreSQL (PGlite) và chạy toàn bộ migration: cần nhiều hơn 5 giây khi máy bận
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const GO_CAFE = "00000000-0000-4000-8000-000000000001";
const WS_MIGRATION = "20261116000005_workspaces.sql";
const readMigration = (f: string) =>
  readFileSync(path.resolve(__dirname, "../../supabase/migrations", f), "utf8");

type Q = Pick<PGlite, "query">;
const ids = async (tx: Q, sql: string, params: unknown[] = []) =>
  (await tx.query<{ id: string }>(sql, params)).rows.map((r) => r.id).sort();

describe("migration workspace trên database đang chạy thật", () => {
  it("gắn toàn bộ dữ liệu cũ vào workspace Gờ Cafe và biến quản trị viên thành owner", async () => {
    const db = await createDb({ upTo: "20261116000004_fix_media_sync_sealed.sql" });
    const admin = await createPlatformAdmin(db);
    await createMedia(db, "cu.png");
    await createPageWithAvatar(db, admin, {
      slug: "trang-cu",
      avatarPath: "cu.png",
      publish: true,
    });
    await db.query(
      "INSERT INTO public.links (default_label, target_url) VALUES ('Menu', 'https://x.y')"
    );

    await db.exec(readMigration(WS_MIGRATION));
    await db.exec(readMigration(WS_MIGRATION)); // chạy lại vẫn an toàn

    for (const t of ["pages", "links", "media_assets"]) {
      const r = await db.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM public.${t} WHERE workspace_id <> $1`,
        [GO_CAFE]
      );
      expect(r.rows[0].n, t).toBe(0);
    }
    const m = await db.query<{ role: string }>(
      "SELECT role FROM public.workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [GO_CAFE, admin]
    );
    expect(m.rows[0].role).toBe("owner");
    // Trang công khai cũ vẫn hiển thị
    const pub = await asUser(db, null, (tx) =>
      tx.query<{ r: { found: boolean } }>("SELECT public.get_public_page('trang-cu') AS r")
    );
    expect(pub.rows[0].r.found).toBe(true);
  });
});

describe("phân quyền theo workspace (RLS + RPC)", () => {
  let db: PGlite;
  let admin: string, ownerB: string, editorB: string, viewerB: string, outsider: string;
  let wsB: string;
  let pageA: { pageId: string; revisionId: string };
  let pageB: { pageId: string; revisionId: string };

  beforeAll(async () => {
    db = await createDb();
    admin = await createPlatformAdmin(db);
    ownerB = await createUser(db, "owner@b.test");
    editorB = await createUser(db, "editor@b.test");
    viewerB = await createUser(db, "viewer@b.test");
    outsider = await createUser(db, "outsider@x.test");

    wsB = (
      await db.query<{ id: string }>(
        "INSERT INTO public.workspaces (name, max_pages) VALUES ('Chi nhánh B', 2) RETURNING id"
      )
    ).rows[0].id;
    await db.query(
      `INSERT INTO public.workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, 'owner'), ($1, $3, 'editor'), ($1, $4, 'viewer')`,
      [wsB, ownerB, editorB, viewerB]
    );

    await createMedia(db, "a.png", GO_CAFE);
    await createMedia(db, "b.png", wsB);
    pageA = await createPageWithAvatar(db, admin, {
      slug: "trang-a",
      avatarPath: "a.png",
      workspaceId: GO_CAFE,
      publish: true,
    });
    pageB = await createPageWithAvatar(db, editorB, {
      slug: "trang-b",
      avatarPath: "b.png",
      workspaceId: wsB,
    });
  });

  const visiblePages = (user: string | null) =>
    asUser(db, user, (tx) => ids(tx, "SELECT id FROM public.pages"));

  it("mỗi người chỉ thấy trang trong workspace của mình; quản trị hệ thống thấy tất cả", async () => {
    expect(await visiblePages(admin)).toEqual([pageA.pageId, pageB.pageId].sort());
    expect(await visiblePages(ownerB)).toEqual([pageB.pageId]);
    expect(await visiblePages(viewerB)).toEqual([pageB.pageId]);
    expect(await visiblePages(outsider)).toEqual([]);
  });

  it("bảng con (khối, slug, phiên bản, ảnh) cũng bị cô lập theo workspace", async () => {
    for (const t of ["page_blocks", "page_slugs", "page_revisions"]) {
      const seen = await asUser(db, ownerB, (tx) =>
        tx.query<{ page_id: string }>(`SELECT DISTINCT page_id FROM public.${t}`)
      );
      expect(
        seen.rows.map((r) => r.page_id),
        t
      ).toEqual([pageB.pageId]);
    }
    const media = await asUser(db, ownerB, (tx) =>
      tx.query<{ object_path: string }>("SELECT object_path FROM public.media_assets")
    );
    expect(media.rows.map((r) => r.object_path)).toEqual(["b.png"]);
    const rma = await asUser(db, outsider, (tx) =>
      tx.query("SELECT * FROM public.revision_media_assets")
    );
    expect(rma.rows).toEqual([]);
  });

  it("chỉ thấy workspace và thành viên của workspace mình", async () => {
    const ws = await asUser(db, editorB, (tx) => ids(tx, "SELECT id FROM public.workspaces"));
    expect(ws).toEqual([wsB]);
    const members = await asUser(db, outsider, (tx) =>
      tx.query("SELECT * FROM public.workspace_members")
    );
    expect(members.rows).toEqual([]);
  });

  it("khách chưa đăng nhập không đọc được bảng nào", async () => {
    await expect(asUser(db, null, (tx) => tx.query("SELECT * FROM public.pages"))).rejects.toThrow(
      /permission denied/
    );
    await expect(
      asUser(db, null, (tx) => tx.query("SELECT * FROM public.workspaces"))
    ).rejects.toThrow(/permission denied/);
  });

  it("người dùng đăng nhập không ghi trực tiếp được vào bảng (chỉ qua server/RPC)", async () => {
    await expect(
      asUser(db, ownerB, (tx) =>
        tx.query("UPDATE public.pages SET internal_name = 'x' WHERE id = $1", [pageB.pageId])
      )
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(db, ownerB, (tx) =>
        tx.query(
          "INSERT INTO public.workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')",
          [GO_CAFE, ownerB]
        )
      )
    ).rejects.toThrow(/permission denied/);
  });

  it("tạo trang: editor được, viewer và người ngoài không; không tạo được ở workspace khác", async () => {
    const create = (user: string, ws: string, slug: string) =>
      asUser(db, user, (tx) => tx.query("SELECT public.create_page($1, 'T', $2, 'T')", [ws, slug]));
    await expect(create(viewerB, wsB, "viewer-tao")).rejects.toThrow(/không có quyền/);
    await expect(create(outsider, wsB, "ngoai-tao")).rejects.toThrow(/không có quyền/);
    await expect(create(ownerB, GO_CAFE, "b-tao-o-a")).rejects.toThrow(/không có quyền/);
    await expect(create(editorB, wsB, "editor-tao")).resolves.toBeDefined();
  });

  it("giới hạn số trang của workspace", async () => {
    // wsB: max_pages = 2, đã có trang-b + editor-tao
    await expect(
      asUser(db, ownerB, (tx) =>
        tx.query("SELECT public.create_page($1, 'T', 'qua-gioi-han', 'T')", [wsB])
      )
    ).rejects.toThrow(/giới hạn 2 trang/);
  });

  it("xuất bản / ẩn / đổi slug: chỉ editor+ của đúng workspace", async () => {
    await expect(
      asUser(db, editorB, (tx) => tx.query("SELECT public.unpublish_page($1, 2)", [pageA.pageId]))
    ).rejects.toThrow(/không có quyền/);
    await expect(
      asUser(db, viewerB, (tx) =>
        tx.query("SELECT public.publish_page($1, $2, 1, 1)", [pageB.pageId, pageB.revisionId])
      )
    ).rejects.toThrow(/không có quyền/);
    await expect(
      asUser(db, ownerB, (tx) =>
        tx.query("SELECT public.rename_page_slug($1, 'doi-ten', 1)", [pageA.pageId])
      )
    ).rejects.toThrow(/không có quyền/);
    await expect(
      asUser(db, editorB, (tx) =>
        tx.query("SELECT public.publish_page($1, $2, 1, 1)", [pageB.pageId, pageB.revisionId])
      )
    ).resolves.toBeDefined();
  });

  it("slug vẫn duy nhất toàn hệ thống giữa các workspace", async () => {
    await expect(
      asUser(db, ownerB, (tx) =>
        tx.query("SELECT public.rename_page_slug($1, 'trang-a', 2)", [pageB.pageId])
      )
    ).rejects.toThrow(/đã được sử dụng/);
  });

  it("báo cáo click: thành viên xem được workspace mình, không xem được toàn hệ thống hay workspace khác", async () => {
    const report = (user: string, ws: string | null) =>
      asUser(db, user, (tx) =>
        tx.query(
          "SELECT public.get_click_report(now() - interval '1 day', now(), NULL, NULL, 'Asia/Ho_Chi_Minh', $1) AS r",
          [ws]
        )
      );
    await expect(report(viewerB, wsB)).resolves.toBeDefined();
    await expect(report(viewerB, null)).rejects.toThrow(/toàn hệ thống/);
    await expect(report(viewerB, GO_CAFE)).rejects.toThrow(/không có quyền/);
    await expect(report(admin, null)).resolves.toBeDefined();
    const r = await report(ownerB, wsB);
    const byPage = (r.rows[0] as { r: { by_page: { page_id: string }[] } }).r.by_page;
    expect(byPage.every((p) => p.page_id !== pageA.pageId)).toBe(true);
  });

  it("không đặt được liên kết / ảnh của workspace khác lên trang", async () => {
    const linkA = (
      await db.query<{ id: string }>(
        "INSERT INTO public.links (workspace_id, default_label, target_url) VALUES ($1, 'A', 'https://a.vn') RETURNING id",
        [GO_CAFE]
      )
    ).rows[0].id;
    await expect(
      asService(db, (tx) =>
        tx.query("INSERT INTO public.page_links (page_id, link_id) VALUES ($1, $2)", [
          pageB.pageId,
          linkA,
        ])
      )
    ).rejects.toThrow(/cùng một workspace/);

    const mediaA = await createMedia(db, "a2.png", GO_CAFE);
    await expect(
      asService(db, (tx) =>
        tx.query(
          "INSERT INTO public.links (workspace_id, default_label, target_url, default_media_id) VALUES ($1, 'B', 'https://b.vn', $2)",
          [wsB, mediaA]
        )
      )
    ).rejects.toThrow(/cùng workspace/);
  });

  it("không chuyển được trang sang workspace khác", async () => {
    await expect(
      asService(db, (tx) =>
        tx.query("UPDATE public.pages SET workspace_id = $1 WHERE id = $2", [GO_CAFE, pageB.pageId])
      )
    ).rejects.toThrow(/workspace khác/);
  });

  it("workspace luôn còn ít nhất một owner", async () => {
    await expect(
      asService(db, (tx) =>
        tx.query("DELETE FROM public.workspace_members WHERE workspace_id = $1 AND user_id = $2", [
          wsB,
          ownerB,
        ])
      )
    ).rejects.toThrow(/ít nhất một chủ sở hữu/);
    await expect(
      asService(db, (tx) =>
        tx.query(
          "UPDATE public.workspace_members SET role = 'editor' WHERE workspace_id = $1 AND user_id = $2",
          [wsB, ownerB]
        )
      )
    ).rejects.toThrow(/ít nhất một chủ sở hữu/);
    // Có owner thứ hai thì hạ vai trò được
    await asService(db, async (tx) => {
      await tx.query(
        "UPDATE public.workspace_members SET role = 'owner' WHERE workspace_id = $1 AND user_id = $2",
        [wsB, editorB]
      );
      await tx.query(
        "UPDATE public.workspace_members SET role = 'editor' WHERE workspace_id = $1 AND user_id = $2",
        [wsB, ownerB]
      );
    });
  });

  it("lời mời: chỉ owner (và quản trị hệ thống) xem được", async () => {
    await db.query(
      "INSERT INTO public.workspace_invitations (workspace_id, email, role) VALUES ($1, 'moi@b.test', 'editor')",
      [wsB]
    );
    const seen = (user: string) =>
      asUser(db, user, (tx) => tx.query("SELECT email FROM public.workspace_invitations"));
    expect((await seen(editorB)).rows).toHaveLength(1); // editorB đã thành owner ở test trước
    expect((await seen(viewerB)).rows).toHaveLength(0);
    expect((await seen(admin)).rows).toHaveLength(1);
    await expect(
      db.query(
        "INSERT INTO public.workspace_invitations (workspace_id, email, role) VALUES ($1, 'MOI@B.TEST', 'editor')",
        [wsB]
      )
    ).rejects.toThrow(/check constraint/);
  });

  it("hàm create_page cũ (3 tham số) vẫn chạy và tạo trang trong workspace Gờ Cafe", async () => {
    const r = await asUser(db, admin, (tx) =>
      tx.query<{ r: { page_id: string } }>(
        "SELECT public.create_page('Cũ', 'tao-kieu-cu', 'Cũ') AS r"
      )
    );
    const ws = await db.query<{ workspace_id: string }>(
      "SELECT workspace_id FROM public.pages WHERE id = $1",
      [r.rows[0].r.page_id]
    );
    expect(ws.rows[0].workspace_id).toBe(GO_CAFE);
  });
});
