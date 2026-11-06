import { describe, it, expect } from "vitest";
import {
  pageSlugSchema,
  createPageSchema,
  renameSlugSchema,
  saveDraftSchema,
  publishPageSchema,
  unpublishPageSchema,
} from "@/features/pages/schemas";

describe("Pages Schema Validation", () => {
  describe("pageSlugSchema", () => {
    it("chấp nhận slug hợp lệ chỉ chứa chữ thường, số và dấu gạch nối", () => {
      const validSlugs = ["menu", "menu-chinh", "tuyen-dung-2026", "go-cafe-q1"];
      for (const slug of validSlugs) {
        const result = pageSlugSchema.safeParse(slug);
        expect(result.success).toBe(true);
      }
    });

    it("chặn slug chứa ký tự hoa, ký tự đặc biệt hoặc khoảng trắng", () => {
      const invalidSlugs = ["Menu", "menu chinh", "menu_chinh", "menu@2026", "menu--chinh"];
      for (const slug of invalidSlugs) {
        const result = pageSlugSchema.safeParse(slug);
        expect(result.success).toBe(false);
      }
    });

    it("chặn slug bắt đầu hoặc kết thúc bằng dấu gạch nối", () => {
      expect(pageSlugSchema.safeParse("-menu").success).toBe(false);
      expect(pageSlugSchema.safeParse("menu-").success).toBe(false);
    });

    it("chặn các từ khóa slug hệ thống được bảo lưu (reserved slugs)", () => {
      const reserved = ["admin", "api", "login", "auth", "static", "dashboard", "settings"];
      for (const slug of reserved) {
        const result = pageSlugSchema.safeParse(slug);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain("bảo lưu");
        }
      }
    });

    it("chặn slug có độ dài dưới 2 ký tự hoặc trên 64 ký tự", () => {
      expect(pageSlugSchema.safeParse("a").success).toBe(false);
      const longSlug = "a".repeat(65);
      expect(pageSlugSchema.safeParse(longSlug).success).toBe(false);
    });
  });

  describe("createPageSchema", () => {
    it("chấp nhận dữ liệu tạo trang hợp lệ", () => {
      const res = createPageSchema.safeParse({
        internalName: "Menu Cà Phê Tháng 11",
        slug: "menu-thang-11",
        title: "Gờ Cafe - Menu Đặc Biệt",
      });
      expect(res.success).toBe(true);
    });

    it("chặn khi để trống internalName hoặc title", () => {
      expect(
        createPageSchema.safeParse({
          internalName: "",
          slug: "menu-thang-11",
          title: "Tiêu đề",
        }).success
      ).toBe(false);

      expect(
        createPageSchema.safeParse({
          internalName: "Tên trang",
          slug: "menu-thang-11",
          title: "",
        }).success
      ).toBe(false);
    });
  });

  describe("renameSlugSchema", () => {
    it("chấp nhận dữ liệu đổi slug hợp lệ", () => {
      const res = renameSlugSchema.safeParse({
        pageId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        slug: "menu-moi",
        expectedPageVersion: 2,
      });
      expect(res.success).toBe(true);
    });

    it("chặn khi version <= 0", () => {
      const res = renameSlugSchema.safeParse({
        pageId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        slug: "menu-moi",
        expectedPageVersion: 0,
      });
      expect(res.success).toBe(false);
    });
  });

  describe("saveDraftSchema", () => {
    it("chấp nhận cấu trúc bản nháp với theme và blocks hợp lệ", () => {
      const res = saveDraftSchema.safeParse({
        pageId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        expectedDraftVersion: 1,
        title: "Trang tuyển dụng",
        theme: {
          preset: "go-original",
        },
        seo: {
          metaTitle: "Tuyển dụng Gờ Cafe",
        },
        blocks: [
          {
            id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
            type: "header",
            position: 0,
            isVisible: true,
            payload: { title: "Tuyển dụng", bio: "Gia nhập gia đình Gờ" },
          },
          {
            id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
            type: "link_list",
            position: 1,
            isVisible: true,
            payload: { layout: "stack" },
            placements: [
              {
                id: "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
                linkId: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
                position: 0,
                labelOverride: "Ứng tuyển Barista",
              },
            ],
          },
        ],
      });
      expect(res.success).toBe(true);
    });

    it("chặn khi block chứa loại (type) không hợp lệ", () => {
      const res = saveDraftSchema.safeParse({
        pageId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        expectedDraftVersion: 1,
        title: "Tiêu đề",
        theme: { preset: "go-original" },
        blocks: [
          {
            id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
            type: "custom_html_hack", // type bất hợp pháp
            position: 0,
            isVisible: true,
            payload: {},
          },
        ],
      });
      expect(res.success).toBe(false);
    });
  });

  describe("publishPageSchema & unpublishPageSchema", () => {
    it("chấp nhận thông tin publish hợp lệ", () => {
      const res = publishPageSchema.safeParse({
        pageId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        draftId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        expectedPageVersion: 1,
        expectedDraftVersion: 2,
      });
      expect(res.success).toBe(true);
    });

    it("chặn khi version <= 0", () => {
      const res = publishPageSchema.safeParse({
        pageId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        draftId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        expectedPageVersion: 0,
        expectedDraftVersion: 1,
      });
      expect(res.success).toBe(false);
    });

    it("chấp nhận thông tin unpublish hợp lệ", () => {
      const res = unpublishPageSchema.safeParse({
        pageId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        expectedPageVersion: 3,
      });
      expect(res.success).toBe(true);
    });
  });
});
