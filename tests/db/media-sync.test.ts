// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createDb, migrationFiles } from "./harness";
import { createMedia, createPageWithAvatar, createPlatformAdmin } from "./seed";

// Mỗi test dựng PostgreSQL (PGlite) và chạy toàn bộ migration: cần nhiều hơn 5 giây khi máy bận
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const MEDIA_MIGRATION = "20261116000003_track_revision_media.sql";
const FIX_MIGRATION = "20261116000004_fix_media_sync_sealed.sql";
const readMigration = (f: string) =>
  readFileSync(path.resolve(__dirname, "../../supabase/migrations", f), "utf8");

describe("ghi nhận ảnh của phiên bản trang (revision_media_assets)", () => {
  it("toàn bộ migration chạy được trên database trống", async () => {
    const db = await createDb();
    const res = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public'"
    );
    expect(res.rows[0].n).toBeGreaterThan(10);
    expect(migrationFiles()).toContain(MEDIA_MIGRATION);
  });

  /** Database giống production trước khi chạy migration theo dõi ảnh: có 1 trang đã xuất bản. */
  async function productionLikeDb() {
    const db = await createDb({ upTo: "20261116000002_block_types_v2.sql" });
    const admin = await createPlatformAdmin(db);
    const avatar = await createMedia(db, "avatar.png");
    const { revisionId } = await createPageWithAvatar(db, admin, {
      slug: "trang-a",
      avatarPath: "avatar.png",
      publish: true,
    });
    return { db, avatar, revisionId };
  }

  const mediaOf = async (db: Awaited<ReturnType<typeof createDb>>, revisionId: string) =>
    (
      await db.query<{ media_asset_id: string }>(
        "SELECT media_asset_id FROM public.revision_media_assets WHERE revision_id = $1",
        [revisionId]
      )
    ).rows.map((r) => r.media_asset_id);

  it("[lỗi đã biết] migration 20261116000003 thất bại khi đã có trang xuất bản", async () => {
    const { db } = await productionLikeDb();
    await expect(db.exec(readMigration(MEDIA_MIGRATION))).rejects.toThrow(/niêm phong/);
  });

  it("migration sửa lỗi chạy được khi migration 03 chưa từng áp dụng, và ghi nhận ảnh của bản đã xuất bản", async () => {
    const { db, avatar, revisionId } = await productionLikeDb();
    await db.exec(readMigration(FIX_MIGRATION));
    expect(await mediaOf(db, revisionId)).toEqual([avatar]);
    // chạy lại lần nữa vẫn an toàn
    await db.exec(readMigration(FIX_MIGRATION));
    expect(await mediaOf(db, revisionId)).toEqual([avatar]);
  });

  it("migration sửa lỗi chạy được sau khi migration 03 đã áp dụng (trường hợp chưa có trang xuất bản lúc đó)", async () => {
    const db = await createDb({ upTo: MEDIA_MIGRATION });
    const admin = await createPlatformAdmin(db);
    const avatar = await createMedia(db, "b.png");
    const { revisionId } = await createPageWithAvatar(db, admin, {
      slug: "trang-x",
      avatarPath: "b.png",
      publish: true,
    });
    await db.exec(readMigration(FIX_MIGRATION));
    expect(await mediaOf(db, revisionId)).toEqual([avatar]);
  });

  it("xuất bản trang mới ghi nhận ảnh trong payload (avatar)", async () => {
    const db = await createDb();
    const admin = await createPlatformAdmin(db);
    const avatar = await createMedia(db, "logo.png");
    const { revisionId } = await createPageWithAvatar(db, admin, {
      slug: "trang-b",
      avatarPath: "logo.png",
      publish: true,
    });
    const rows = await db.query<{ media_asset_id: string }>(
      "SELECT media_asset_id FROM public.revision_media_assets WHERE revision_id = $1",
      [revisionId]
    );
    expect(rows.rows.map((r) => r.media_asset_id)).toEqual([avatar]);
  });

  it("vẫn không cho sửa nội dung (khối) của bản đã xuất bản", async () => {
    const db = await createDb();
    const admin = await createPlatformAdmin(db);
    await createMedia(db, "x.png");
    const { revisionId } = await createPageWithAvatar(db, admin, {
      slug: "trang-c",
      avatarPath: "x.png",
      publish: true,
    });
    await expect(
      db.query("UPDATE public.page_blocks SET payload = '{}' WHERE revision_id = $1", [revisionId])
    ).rejects.toThrow(/niêm phong/);
    await expect(
      db.query("DELETE FROM public.revision_media_assets WHERE revision_id = $1", [revisionId])
    ).rejects.toThrow(/niêm phong/);
  });
});
