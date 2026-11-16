import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

const tables: Record<string, Record<string, unknown>[]> = {};
vi.mock("@/lib/supabase/privileged", () => ({
  createSupabaseAdminClient: () => ({
    from(table: string) {
      let rows = [...(tables[table] ?? [])];
      const q = {
        select: () => q,
        eq: (c: string, v: unknown) => ((rows = rows.filter((r) => r[c] === v)), q),
        is: (c: string, v: unknown) => ((rows = rows.filter((r) => (r[c] ?? null) === v)), q),
        not: (c: string, _op: string, v: unknown) => (
          (rows = rows.filter((r) => (r[c] ?? null) !== v)),
          q
        ),
        in: (c: string, vs: unknown[]) => ((rows = rows.filter((r) => vs.includes(r[c]))), q),
        then: (resolve: (r: { data: unknown[]; error: null }) => unknown) =>
          resolve({ data: rows, error: null }),
      };
      return q;
    },
  }),
}));

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

beforeEach(() => {
  tables.pages = [
    {
      id: "p1",
      status: "published",
      archived_at: null,
      published_revision_id: "r1",
      updated_at: "2026-11-10T00:00:00Z",
    },
    {
      id: "p2",
      status: "unpublished",
      archived_at: null,
      published_revision_id: null,
      updated_at: "2026-11-10T00:00:00Z",
    },
    {
      id: "p3",
      status: "published",
      archived_at: "2026-11-01",
      published_revision_id: "r3",
      updated_at: "2026-11-10T00:00:00Z",
    },
    {
      id: "p4",
      status: "published",
      archived_at: null,
      published_revision_id: "r4",
      updated_at: "2026-11-12T00:00:00Z",
    },
  ];
  tables.page_slugs = [
    { page_id: "p1", slug: "gocafe", is_current: true },
    { page_id: "p1", slug: "gocafe-cu", is_current: false },
    { page_id: "p3", slug: "da-luu-tru", is_current: true },
    { page_id: "p4", slug: "tuyen-dung", is_current: true },
  ];
});

describe("robots.txt", () => {
  it("chặn khu vực quản trị, đường ghi nhận click và trang test; trỏ tới sitemap", () => {
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.disallow).toEqual(
      expect.arrayContaining(["/admin", "/login", "/r/", "/api/", "/e2e-fixtures/"])
    );
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

describe("sitemap.xml", () => {
  it("chỉ gồm slug chính của trang đang xuất bản, chưa lưu trữ", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => new URL(e.url).pathname);
    expect(urls).toEqual(["/gocafe", "/tuyen-dung"]);
    expect(entries[1].lastModified).toEqual(new Date("2026-11-12T00:00:00Z"));
  });

  it("không có trang nào thì trả danh sách rỗng", async () => {
    tables.pages = [];
    expect(await sitemap()).toEqual([]);
  });
});
