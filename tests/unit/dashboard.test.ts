import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardSummary, getPrimaryPublicSlug } from "@/features/dashboard/queries";

let mockPages: any[] = [];
let mockLinks: any[] = [];
let mockClicksCount = 0;
let mockClickEvents: any[] = [];

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      from: (table: string) => ({
        select: (_cols?: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count === "exact" && opts?.head) {
            return Promise.resolve({ count: mockClicksCount, error: null });
          }
          return {
            is: () => ({
              order: () =>
                Promise.resolve({
                  data: table === "pages" ? mockPages : mockLinks,
                  error: null,
                }),
            }),
            eq: () => ({
              is: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: () =>
                      Promise.resolve({
                        data: mockPages.find((p) => p.status === "published") || null,
                        error: null,
                      }),
                  }),
                }),
              }),
            }),
            limit: () =>
              Promise.resolve({
                data: mockClickEvents,
                error: null,
              }),
          };
        },
      }),
    }),
}));

describe("Dashboard Module: Real-time Metrics & Slug Resolution", () => {
  beforeEach(() => {
    mockPages = [];
    mockLinks = [];
    mockClicksCount = 0;
    mockClickEvents = [];
  });

  it("handles empty database state cleanly (0 pages, 0 links, 0 clicks)", async () => {
    const summary = await getDashboardSummary();

    expect(summary.publishedPagesCount).toBe(0);
    expect(summary.pagesSummaryText).toBe("Chưa có trang nào được xuất bản");

    expect(summary.totalLinksCount).toBe(0);
    expect(summary.linksSummaryText).toBe("Kho liên kết đang trống");

    expect(summary.totalClicksCount).toBe(0);
    expect(summary.clicksSummaryText).toBe("Chưa ghi nhận lượt click nào");
  });

  it("handles unpublished draft pages gracefully", async () => {
    mockPages = [
      {
        id: "p1",
        internal_name: "Trang nháp 1",
        status: "unpublished",
        page_slugs: [{ slug: "draft-1", is_current: true }],
      },
    ];

    const summary = await getDashboardSummary();
    expect(summary.publishedPagesCount).toBe(0);
    expect(summary.pagesSummaryText).toBe("1 trang nháp (chưa xuất bản)");
  });

  it("aggregates dynamic metrics when pages, links, and clicks exist", async () => {
    mockPages = [
      {
        id: "p1",
        internal_name: "Gờ Cafe Official",
        status: "published",
        page_slugs: [{ slug: "gocafe", is_current: true }],
      },
      {
        id: "p2",
        internal_name: "Tuyển dụng",
        status: "published",
        page_slugs: [{ slug: "tuyendung", is_current: true }],
      },
    ];

    mockLinks = [
      { id: "l1", default_label: "ShopeeFood", is_active: true },
      { id: "l2", default_label: "Grab", is_active: true },
      { id: "l3", default_label: "Menu", is_active: true },
    ];

    mockClicksCount = 17;
    mockClickEvents = [
      ...Array(12).fill({ page_id: "p1" }),
      ...Array(5).fill({ page_id: "p2" }),
    ];

    const summary = await getDashboardSummary();

    expect(summary.publishedPagesCount).toBe(2);
    expect(summary.pagesSummaryText).toContain("/gocafe, /tuyendung");

    expect(summary.totalLinksCount).toBe(3);
    expect(summary.linksSummaryText).toBe("ShopeeFood, Grab, Menu");

    expect(summary.totalClicksCount).toBe(17);
    expect(summary.clicksSummaryText).toContain("12 click (/gocafe)");
    expect(summary.clicksSummaryText).toContain("5 click (/tuyendung)");
  });

  it("resolves primary public slug for published pages and returns null when empty", async () => {
    // Empty state
    const emptySlug = await getPrimaryPublicSlug();
    expect(emptySlug).toBeNull();

    // Published state
    mockPages = [
      {
        id: "p1",
        internal_name: "Gờ Cafe Official",
        status: "published",
        page_slugs: [{ slug: "gocafe", is_current: true }],
      },
    ];

    const resolvedSlug = await getPrimaryPublicSlug();
    expect(resolvedSlug).toBe("gocafe");
  });
});
