import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  getActiveRevisionIds,
  getMediaUsedByActiveRevisions,
  isMediaUsedByActiveRevision,
} from "@/features/media/usage";

type Row = Record<string, unknown>;

/** Supabase client giả: áp dụng các bộ lọc eq / in / is / not lên dữ liệu trong bộ nhớ. */
function fakeDb(tables: Record<string, Row[]>) {
  return {
    from(table: string) {
      let rows = [...(tables[table] ?? [])];
      const q = {
        select: () => q,
        eq: (col: string, v: unknown) => ((rows = rows.filter((r) => r[col] === v)), q),
        in: (col: string, vs: unknown[]) => ((rows = rows.filter((r) => vs.includes(r[col]))), q),
        is: (col: string, v: unknown) => ((rows = rows.filter((r) => (r[col] ?? null) === v)), q),
        not: (col: string, _op: string, v: unknown) => (
          (rows = rows.filter((r) => (r[col] ?? null) !== v)),
          q
        ),
        limit: (n: number) => ((rows = rows.slice(0, n)), q),
        then: (resolve: (r: { data: Row[] }) => unknown) => resolve({ data: rows }),
      };
      return q;
    },
  } as never;
}

const db = fakeDb({
  pages: [
    { id: "p1", published_revision_id: "rev-pub", archived_at: null },
    { id: "p2", published_revision_id: "rev-archived-page", archived_at: "2026-01-01" },
    { id: "p3", published_revision_id: null, archived_at: null },
  ],
  page_revisions: [
    { id: "rev-pub", state: "sealed" },
    { id: "rev-old", state: "sealed" },
    { id: "rev-draft", state: "draft" },
  ],
  revision_media_assets: [
    { revision_id: "rev-pub", media_asset_id: "m-avatar" },
    { revision_id: "rev-draft", media_asset_id: "m-gallery" },
    { revision_id: "rev-old", media_asset_id: "m-old" },
    { revision_id: "rev-archived-page", media_asset_id: "m-archived" },
  ],
});

describe("ảnh đang được trang sử dụng", () => {
  it("chỉ tính bản đang xuất bản (trang chưa lưu trữ) và bản nháp", async () => {
    expect((await getActiveRevisionIds(db)).sort()).toEqual(["rev-draft", "rev-pub"]);
  });

  it("danh sách ảnh đang dùng bỏ qua bản cũ và trang đã lưu trữ", async () => {
    expect([...(await getMediaUsedByActiveRevisions(db))].sort()).toEqual([
      "m-avatar",
      "m-gallery",
    ]);
  });

  it("chặn xoá ảnh trong bản xuất bản / bản nháp, cho xoá ảnh chỉ còn ở bản cũ", async () => {
    expect(await isMediaUsedByActiveRevision(db, "m-avatar")).toBe(true);
    expect(await isMediaUsedByActiveRevision(db, "m-gallery")).toBe(true);
    expect(await isMediaUsedByActiveRevision(db, "m-old")).toBe(false);
    expect(await isMediaUsedByActiveRevision(db, "m-unused")).toBe(false);
  });
});

describe("migration theo dõi ảnh", () => {
  const sql = readFileSync("supabase/migrations/20261116000003_track_revision_media.sql", "utf8");

  it("quét payload khối, theme và placement", () => {
    expect(sql).toMatch(/jsonb_path_query\(b\.payload/);
    expect(sql).toMatch(/jsonb_path_query\(r\.theme/);
    expect(sql).toMatch(/media_override_id, pl\.resolved_media_id/);
  });

  it("publish_page dùng hàm đồng bộ mới và chỉ service_role gọi trực tiếp được hàm đồng bộ", () => {
    expect(sql).toMatch(/PERFORM public\.sync_revision_media_assets\(p_draft_id\)/);
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.sync_revision_media_assets\(uuid\) FROM PUBLIC, anon, authenticated/
    );
    expect(sql).toMatch(
      /SELECT public\.sync_revision_media_assets\(id\) FROM public\.page_revisions/
    );
  });
});
