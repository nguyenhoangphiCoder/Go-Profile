import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardSummary, getPrimaryPublicSlug } from "@/features/dashboard/queries";

type Row = Record<string, unknown>;
const WS = "ws-1";
const OTHER_WS = "ws-2";

let tables: Record<string, Row[]> = {};

/** Supabase client giả: áp dụng eq / in / is / limit lên dữ liệu trong bộ nhớ. */
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        let rows = [...(tables[table] ?? [])];
        let headCount = false;
        const result = () =>
          headCount ? { count: rows.length, error: null } : { data: rows, error: null };
        const q = {
          select: (_cols?: string, opts?: { count?: string; head?: boolean }) => {
            headCount = Boolean(opts?.head);
            return q;
          },
          eq: (c: string, v: unknown) => ((rows = rows.filter((r) => r[c] === v)), q),
          in: (c: string, vs: unknown[]) => ((rows = rows.filter((r) => vs.includes(r[c]))), q),
          is: (c: string, v: unknown) => ((rows = rows.filter((r) => (r[c] ?? null) === v)), q),
          order: () => q,
          limit: (n: number) => ((rows = rows.slice(0, n)), q),
          maybeSingle: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
          then: (resolve: (r: unknown) => unknown) => resolve(result()),
        };
        return q;
      },
    }),
}));

const page = (id: string, status: string, slug: string, workspace_id = WS): Row => ({
  id,
  internal_name: `Trang ${id}`,
  status,
  workspace_id,
  archived_at: null,
  page_slugs: [{ slug, is_current: true }],
});

describe("Dashboard Module: Real-time Metrics & Slug Resolution", () => {
  beforeEach(() => {
    tables = { pages: [], links: [], click_events: [] };
  });

  it("handles empty database state cleanly (0 pages, 0 links, 0 clicks)", async () => {
    const summary = await getDashboardSummary(WS);

    expect(summary.publishedPagesCount).toBe(0);
    expect(summary.pagesSummaryText).toBe("Chưa có trang nào được xuất bản");
    expect(summary.totalLinksCount).toBe(0);
    expect(summary.linksSummaryText).toBe("Kho liên kết đang trống");
    expect(summary.totalClicksCount).toBe(0);
    expect(summary.clicksSummaryText).toBe("Chưa ghi nhận lượt click nào");
  });

  it("handles unpublished draft pages gracefully", async () => {
    tables.pages = [page("p1", "unpublished", "draft-1")];

    const summary = await getDashboardSummary(WS);
    expect(summary.publishedPagesCount).toBe(0);
    expect(summary.pagesSummaryText).toBe("1 trang nháp (chưa xuất bản)");
  });

  it("aggregates dynamic metrics when pages, links, and clicks exist", async () => {
    tables.pages = [page("p1", "published", "gocafe"), page("p2", "published", "tuyendung")];
    tables.links = ["ShopeeFood", "Grab", "Menu"].map((label, i) => ({
      id: `l${i}`,
      default_label: label,
      is_active: true,
      workspace_id: WS,
      archived_at: null,
    }));
    tables.click_events = [
      ...Array.from({ length: 12 }, () => ({ page_id: "p1" })),
      ...Array.from({ length: 5 }, () => ({ page_id: "p2" })),
    ];

    const summary = await getDashboardSummary(WS);

    expect(summary.publishedPagesCount).toBe(2);
    expect(summary.pagesSummaryText).toContain("/gocafe, /tuyendung");
    expect(summary.totalLinksCount).toBe(3);
    expect(summary.linksSummaryText).toBe("ShopeeFood, Grab, Menu");
    expect(summary.totalClicksCount).toBe(17);
    expect(summary.clicksSummaryText).toContain("12 click (/gocafe)");
    expect(summary.clicksSummaryText).toContain("5 click (/tuyendung)");
  });

  it("chỉ tính trang, liên kết và click của workspace hiện tại", async () => {
    tables.pages = [page("p1", "published", "gocafe"), page("x1", "published", "khac", OTHER_WS)];
    tables.links = [
      { id: "l1", default_label: "Của mình", workspace_id: WS, archived_at: null },
      { id: "l2", default_label: "Của người khác", workspace_id: OTHER_WS, archived_at: null },
    ];
    tables.click_events = [{ page_id: "p1" }, { page_id: "x1" }, { page_id: "x1" }];

    const summary = await getDashboardSummary(WS);
    expect(summary.publishedPagesCount).toBe(1);
    expect(summary.totalLinksCount).toBe(1);
    expect(summary.totalClicksCount).toBe(1);
    expect(summary.pagesSummaryText).not.toContain("/khac");
  });

  it("resolves primary public slug for published pages and returns null when empty", async () => {
    expect(await getPrimaryPublicSlug(WS)).toBeNull();

    tables.pages = [page("x1", "published", "khac", OTHER_WS)];
    expect(await getPrimaryPublicSlug(WS)).toBeNull();

    tables.pages.push(page("p1", "published", "gocafe"));
    expect(await getPrimaryPublicSlug(WS)).toBe("gocafe");
  });
});
