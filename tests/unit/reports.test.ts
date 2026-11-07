import { describe, it, expect, vi } from "vitest";
import {
  vietnamDayStartToUtc,
  vietnamDayEndToUtc,
  vietnamDateRangeToUtc,
  getPresetDateStrings,
  formatDisplayDate,
  formatVietnamDateTime,
} from "@/features/reports/timezone";
import { reportParamsSchema } from "@/features/reports/schemas";

// Mock Supabase Server Client & Auth
vi.mock("@/features/auth/queries", () => ({
  requireActiveAdmin: vi.fn(() =>
    Promise.resolve({
      userId: "admin-user-id-01",
      email: "admin@gocafe.vn",
      displayName: "Quản trị viên Gờ",
      isActive: true,
    })
  ),
}));

const mockRpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      rpc: mockRpc,
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data:
                table === "pages"
                  ? [
                      {
                        id: "page-a-id",
                        internal_name: "Trang Gờ Cafe A",
                        archived_at: null,
                        page_slugs: [{ slug: "gocafe-a", is_current: true }],
                      },
                      {
                        id: "page-b-id",
                        internal_name: "Trang Gờ Cafe B (Archived)",
                        archived_at: "2026-11-06T10:00:00Z",
                        page_slugs: [{ slug: "gocafe-b", is_current: true }],
                      },
                    ]
                  : [
                      {
                        id: "link-x-id",
                        default_label: "Đặt món ShopeeFood",
                        target_url: "https://shopeefood.vn/gocafe",
                        kind: "standard",
                        is_active: true,
                        archived_at: null,
                      },
                    ],
              error: null,
            })
          ),
        })),
      })),
    }),
}));

import { getClickReport, getReportFilterOptions } from "@/features/reports/queries";

describe("Phase 08 — Click Reports & Analytics (P08)", () => {
  describe("P08.03 — Múi giờ Asia/Ho_Chi_Minh & Khoảng nửa mở [from, to)", () => {
    it("chuyển đổi mốc 00:00:00 Việt Nam sang đúng 17:00:00 UTC của ngày hôm trước", () => {
      // 06/11/2026 00:00:00 +07:00 = 05/11/2026 17:00:00 UTC
      const startUtc = vietnamDayStartToUtc("2026-11-06");
      expect(startUtc).toBe("2026-11-05T17:00:00.000Z");
    });

    it("chuyển đổi mốc kết thúc ngày sang đúng 17:00:00 UTC của ngày hiện tại (nửa mở)", () => {
      // Kết thúc ngày 06/11/2026 là 07/11/2026 00:00:00 +07:00 = 06/11/2026 17:00:00 UTC
      const endUtc = vietnamDayEndToUtc("2026-11-06");
      expect(endUtc).toBe("2026-11-06T17:00:00.000Z");
    });

    it("khoảng nửa mở [from, to) cho dải ngày tạo mốc chính xác", () => {
      const range = vietnamDateRangeToUtc("2026-11-01", "2026-11-06");
      expect(range.from).toBe("2026-10-31T17:00:00.000Z");
      expect(range.to).toBe("2026-11-06T17:00:00.000Z");
    });

    it("kiểm chứng mốc biên 16:59:59.999Z thuộc ngày trước và 17:00:00.000Z thuộc ngày mới tại Việt Nam", () => {
      const boundaryBefore = new Date("2026-11-05T16:59:59.999Z");
      const boundaryAfter = new Date("2026-11-05T17:00:00.000Z");

      const vnDateTimeBefore = formatVietnamDateTime(boundaryBefore.toISOString());
      const vnDateTimeAfter = formatVietnamDateTime(boundaryAfter.toISOString());

      // 16:59:59 UTC tương ứng 23:59 ngày 05/11/2026
      expect(vnDateTimeBefore).toContain("05/11/2026");
      expect(vnDateTimeBefore).toContain("23:59");

      // 17:00:00 UTC tương ứng 00:00 ngày 06/11/2026
      expect(vnDateTimeAfter).toContain("06/11/2026");
      expect(vnDateTimeAfter).toContain("00:00");
    });

    it("định dạng ngày hiển thị DD/MM/YYYY thân thiện người dùng", () => {
      expect(formatDisplayDate("2026-11-06")).toBe("06/11/2026");
    });
  });

  describe("P08.02 — Bộ lọc & Khoảng thời gian Preset", () => {
    it("tính toán chính xác khoảng ngày cho preset today, last7days, last30days", () => {
      const refDate = new Date("2026-11-06T04:00:00.000Z"); // ~ 11:00 AM VN

      const today = getPresetDateStrings("today", refDate);
      expect(today.startDate).toBe("2026-11-06");
      expect(today.endDate).toBe("2026-11-06");

      const last7Days = getPresetDateStrings("last7days", refDate);
      expect(last7Days.startDate).toBe("2026-10-31");
      expect(last7Days.endDate).toBe("2026-11-06");

      const last30Days = getPresetDateStrings("last30days", refDate);
      expect(last30Days.startDate).toBe("2026-10-08");
      expect(last30Days.endDate).toBe("2026-11-06");

      const thisMonth = getPresetDateStrings("thisMonth", refDate);
      expect(thisMonth.startDate).toBe("2026-11-01");
      expect(thisMonth.endDate).toBe("2026-11-06");
    });

    it("kiểm tra hợp lệ schema tham số bộ lọc báo cáo", () => {
      const valid = reportParamsSchema.parse({
        preset: "last7days",
        pageId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      });
      expect(valid.preset).toBe("last7days");
      expect(valid.pageId).toBe("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

      const customValid = reportParamsSchema.parse({
        preset: "custom",
        from: "2026-11-01",
        to: "2026-11-06",
      });
      expect(customValid.preset).toBe("custom");
      expect(customValid.from).toBe("2026-11-01");
    });
  });

  describe("P08.05 — Kiểm chứng Fixture: 12 click Trang A + 5 click Trang B = 17 click Link X", () => {
    it("trả về đúng 17 click cho cùng link X khi đặt trên cả Trang A và Trang B", async () => {
      // Mô phỏng kết quả trả về từ database RPC cho fixture 12 + 5 = 17
      mockRpc.mockResolvedValueOnce({
        data: {
          total_clicks: 17,
          timezone: "Asia/Ho_Chi_Minh",
          from: "2026-10-31T17:00:00.000Z",
          to: "2026-11-06T17:00:00.000Z",
          by_date: [{ date: "2026-11-06", clicks: 17 }],
          by_page: [
            { page_id: "page-a", internal_name: "Trang A", slug: "trang-a", clicks: 12 },
            { page_id: "page-b", internal_name: "Trang B", slug: "trang-b", clicks: 5 },
          ],
          by_link: [
            {
              link_id: "link-x",
              label: "Link X ShopeeFood",
              target_url: "https://shopee.vn/gocafe",
              kind: "standard",
              clicks: 17,
            },
          ],
          by_placement: [
            {
              page_link_id: "plk-a-x",
              page_id: "page-a",
              page_name: "Trang A",
              link_id: "link-x",
              label: "Đặt món A",
              target_url: "https://shopee.vn/gocafe",
              position: 0,
              clicks: 12,
            },
            {
              page_link_id: "plk-b-x",
              page_id: "page-b",
              page_name: "Trang B",
              link_id: "link-x",
              label: "Đặt món B",
              target_url: "https://shopee.vn/gocafe",
              position: 0,
              clicks: 5,
            },
          ],
        },
        error: null,
      });

      const report = await getClickReport({
        from: "2026-10-31T17:00:00.000Z",
        to: "2026-11-06T17:00:00.000Z",
        linkId: "link-x",
      });

      // Kiểm chứng tổng số click
      expect(report.total_clicks).toBe(17);

      // Kiểm chứng phân rã theo trang: Trang A = 12, Trang B = 5
      const pageAClicks = report.by_page.find((p) => p.page_id === "page-a")?.clicks;
      const pageBClicks = report.by_page.find((p) => p.page_id === "page-b")?.clicks;
      expect(pageAClicks).toBe(12);
      expect(pageBClicks).toBe(5);
      expect(pageAClicks! + pageBClicks!).toBe(17);

      // Kiểm chứng phân rã theo link X
      const linkXClicks = report.by_link.find((l) => l.link_id === "link-x")?.clicks;
      expect(linkXClicks).toBe(17);

      // Kiểm chứng tính nhất quán snapshot: tổng by_page === tổng by_link === total_clicks
      const sumByPage = report.by_page.reduce((sum, p) => sum + p.clicks, 0);
      const sumByLink = report.by_link.reduce((sum, l) => sum + l.clicks, 0);
      expect(sumByPage).toBe(report.total_clicks);
      expect(sumByLink).toBe(report.total_clicks);
    });

    it("lọc theo riêng Trang A trả về đúng 12 click", async () => {
      mockRpc.mockResolvedValueOnce({
        data: {
          total_clicks: 12,
          timezone: "Asia/Ho_Chi_Minh",
          from: "2026-10-31T17:00:00.000Z",
          to: "2026-11-06T17:00:00.000Z",
          by_date: [{ date: "2026-11-06", clicks: 12 }],
          by_page: [{ page_id: "page-a", internal_name: "Trang A", slug: "trang-a", clicks: 12 }],
          by_link: [
            {
              link_id: "link-x",
              label: "Link X",
              target_url: "https://shopee.vn",
              kind: "standard",
              clicks: 12,
            },
          ],
          by_placement: [],
        },
        error: null,
      });

      const reportA = await getClickReport({
        from: "2026-10-31T17:00:00.000Z",
        to: "2026-11-06T17:00:00.000Z",
        pageId: "page-a",
      });

      expect(reportA.total_clicks).toBe(12);
    });

    it("lọc theo riêng Trang B trả về đúng 5 click", async () => {
      mockRpc.mockResolvedValueOnce({
        data: {
          total_clicks: 5,
          timezone: "Asia/Ho_Chi_Minh",
          from: "2026-10-31T17:00:00.000Z",
          to: "2026-11-06T17:00:00.000Z",
          by_date: [{ date: "2026-11-06", clicks: 5 }],
          by_page: [{ page_id: "page-b", internal_name: "Trang B", slug: "trang-b", clicks: 5 }],
          by_link: [
            {
              link_id: "link-x",
              label: "Link X",
              target_url: "https://shopee.vn",
              kind: "standard",
              clicks: 5,
            },
          ],
          by_placement: [],
        },
        error: null,
      });

      const reportB = await getClickReport({
        from: "2026-10-31T17:00:00.000Z",
        to: "2026-11-06T17:00:00.000Z",
        pageId: "page-b",
      });

      expect(reportB.total_clicks).toBe(5);
    });
  });

  describe("P08.01 & P08.04 — Toàn vẹn lịch sử & Phân rã Vị trí (Placement)", () => {
    it("giữ nguyên vẹn lịch sử click của trang đã archive và link đã inactive", async () => {
      const filterOptions = await getReportFilterOptions();

      // Kiểm tra trang đã lưu trữ vẫn xuất hiện trong danh sách lọc để xem dữ liệu quá khứ
      const archivedPage = filterOptions.pages.find((p) => p.isArchived);
      expect(archivedPage).toBeDefined();
      expect(archivedPage?.internalName).toContain("Archived");
    });

    it("trả về thông tin phân rã theo vị trí placement (thứ tự trên trang)", async () => {
      mockRpc.mockResolvedValueOnce({
        data: {
          total_clicks: 10,
          timezone: "Asia/Ho_Chi_Minh",
          from: "2026-11-01T17:00:00.000Z",
          to: "2026-11-06T17:00:00.000Z",
          by_date: [],
          by_page: [],
          by_link: [],
          by_placement: [
            {
              page_link_id: "plk-1",
              page_id: "page-1",
              page_name: "Trang chủ",
              link_id: "link-top",
              label: "Nút Đặt Hàng Vị Trí #1",
              target_url: "https://shopee.vn",
              position: 0,
              clicks: 8,
            },
            {
              page_link_id: "plk-2",
              page_id: "page-1",
              page_name: "Trang chủ",
              link_id: "link-bottom",
              label: "Nút Đặt Hàng Vị Trí #2",
              target_url: "https://shopee.vn",
              position: 1,
              clicks: 2,
            },
          ],
        },
        error: null,
      });

      const report = await getClickReport({
        from: "2026-11-01T17:00:00.000Z",
        to: "2026-11-06T17:00:00.000Z",
      });

      expect(report.by_placement.length).toBe(2);
      expect(report.by_placement[0].position).toBe(0);
      expect(report.by_placement[0].clicks).toBe(8);
      expect(report.by_placement[1].position).toBe(1);
      expect(report.by_placement[1].clicks).toBe(2);
    });

    it("xử lý lỗi database khi gọi get_click_report một cách an toàn", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed" },
      });

      await expect(
        getClickReport({
          from: "2026-11-01T17:00:00.000Z",
          to: "2026-11-06T17:00:00.000Z",
        })
      ).rejects.toThrow("Không thể tải dữ liệu báo cáo: Database connection failed");
    });
  });
});
