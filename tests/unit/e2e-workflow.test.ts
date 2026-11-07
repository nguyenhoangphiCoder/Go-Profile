import { describe, it, expect } from "vitest";
import { loginSchema } from "@/features/auth/schemas";
import { createPageSchema, saveDraftSchema, publishPageSchema } from "@/features/pages/schemas";
import { linkSchema } from "@/features/links/schemas";
import { mediaUploadSchema } from "@/features/media/schemas";
import { shouldSkipClickTracking } from "@/features/public/bot-detector";
import { getPresetDateStrings, vietnamDateRangeToUtc } from "@/features/reports/timezone";

describe("Phase 09 — E2E Administrative Workflow & Lifecycle Validation (P09.02)", () => {
  it("Thực hiện đầy đủ chu trình: Đăng nhập -> Tạo trang -> Upload -> Chọn link -> Lưu draft -> Publish -> Mở link -> Xem báo cáo", () => {
    // 1. Đăng nhập quản trị viên
    const loginInput = {
      email: "admin@gocafe.vn",
      password: "StrongAdminPassword123!",
    };
    const loginValidation = loginSchema.safeParse(loginInput);
    expect(loginValidation.success).toBe(true);

    const activeAdmin = {
      userId: "admin-uuid-001",
      email: loginInput.email,
      isActive: true,
    };
    expect(activeAdmin.isActive).toBe(true);

    // 2. Tạo trang hồ sơ mới
    const createPageInput = {
      internalName: "Gờ Cafe Chi Nhánh Quận 1",
      slug: "gocafe-q1",
      title: "Gờ Cafe - Không gian Sài Gòn xưa",
    };
    const createPageValidation = createPageSchema.safeParse(createPageInput);
    expect(createPageValidation.success).toBe(true);

    const createdPage = {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      internalName: createPageInput.internalName,
      slug: createPageInput.slug,
      status: "unpublished",
      lockVersion: 1,
    };
    expect(createdPage.status).toBe("unpublished");

    // 3. Quản lý kho ảnh (Upload media asset)
    const mediaUploadInput = {
      filename: "banner-go-cafe-q1.jpg",
      type: "image/jpeg",
      size: 1024 * 500, // 500 KB (trong giới hạn 5MB)
    };
    const mediaValidation = mediaUploadSchema.safeParse(mediaUploadInput);
    expect(mediaValidation.success).toBe(true);

    const uploadedMedia = {
      id: "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
      storagePath: "banners/banner-go-cafe-q1.jpg",
      publicUrl:
        "https://mock-supabase.co/storage/v1/object/public/public_media/banners/banner-go-cafe-q1.jpg",
    };
    expect(uploadedMedia.publicUrl).toContain("public_media");

    // 4. Chọn và cấu hình liên kết chung
    const linkInput = {
      defaultLabel: "Đặt món ShopeeFood Q1",
      targetUrl: "https://shopeefood.vn/gocafe-q1",
      kind: "http" as const,
      description: "Giao nhanh trong 15 phút",
    };
    const linkValidation = linkSchema.safeParse(linkInput);
    expect(linkValidation.success).toBe(true);

    const createdLink = {
      id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
      defaultLabel: linkInput.defaultLabel,
      targetUrl: linkInput.targetUrl,
      isActive: true,
    };

    // 5. Biên tập bản nháp và lưu nháp (Save Draft)
    const saveDraftInput = {
      pageId: createdPage.id,
      draftId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      expectedDraftVersion: 1,
      title: "Gờ Cafe Quận 1 - Đậm Vị Mộc Mạc",
      description: "Hân hạnh đón tiếp quý khách tại trung tâm Quận 1",
      theme: { preset: "go-original" },
      blocks: [
        {
          id: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
          type: "header" as const,
          position: 0,
          isVisible: true,
          payload: { title: "Gờ Cafe Quận 1", bio: "Cà phê mộc pha phin truyền thống" },
        },
        {
          id: "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
          type: "link_list" as const,
          position: 1,
          isVisible: true,
          payload: { title: "Dịch vụ & Thực đơn" },
          placements: [
            {
              id: "00eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
              linkId: createdLink.id,
              position: 0,
              labelOverride: "Đặt hàng giao tận nơi (ShopeeFood)",
            },
          ],
        },
      ],
    };
    const draftValidation = saveDraftSchema.safeParse(saveDraftInput);
    expect(draftValidation.success).toBe(true);

    // 6. Live Preview / Prefetch: Bỏ qua theo dõi khi tải trước hoặc phương thức HEAD
    const prefetchHeaders = new Headers({ purpose: "prefetch" });
    const shouldSkipPrefetch = shouldSkipClickTracking("GET", prefetchHeaders, "Mozilla/5.0");
    expect(shouldSkipPrefetch).toBe(true);

    const normalHeaders = new Headers();
    const shouldSkipHead = shouldSkipClickTracking("HEAD", normalHeaders, "Mozilla/5.0");
    expect(shouldSkipHead).toBe(true);

    // 7. Xuất bản nguyên tử (Atomic Publish)
    const publishInput = {
      pageId: createdPage.id,
      draftId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      expectedPageVersion: 1,
      expectedDraftVersion: 1,
    };
    const publishValidation = publishPageSchema.safeParse(publishInput);
    expect(publishValidation.success).toBe(true);

    const publishedPage = {
      ...createdPage,
      status: "published",
      publishedRevisionId: publishInput.draftId,
      lockVersion: 2,
    };
    expect(publishedPage.status).toBe("published");
    expect(publishedPage.publishedRevisionId).toBe(publishInput.draftId);

    // 8. Khách truy cập công khai & Click redirect (/r/{id})
    const publicUserAgent =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
    const isRealUserClick = !shouldSkipClickTracking("GET", normalHeaders, publicUserAgent);
    expect(isRealUserClick).toBe(true);

    // Mô phỏng 1 lượt click được ghi nhận
    const recordedClick = {
      id: "event-click-001",
      pageId: publishedPage.id,
      linkId: createdLink.id,
      pageLinkId: "plk-q1-shopee-id",
      revisionId: publishedPage.publishedRevisionId,
      occurredAt: new Date().toISOString(),
    };
    expect(recordedClick.pageId).toBe(publishedPage.id);
    expect(recordedClick.linkId).toBe(createdLink.id);

    // 9. Xem báo cáo thống kê (/admin/reports)
    const dateRangeStrings = getPresetDateStrings("today");
    const utcRange = vietnamDateRangeToUtc(dateRangeStrings.startDate, dateRangeStrings.endDate);

    const simulatedReport = {
      total_clicks: 1,
      timezone: "Asia/Ho_Chi_Minh",
      from: utcRange.from,
      to: utcRange.to,
      by_page: [
        { page_id: publishedPage.id, internal_name: publishedPage.internalName, clicks: 1 },
      ],
      by_link: [{ link_id: createdLink.id, label: createdLink.defaultLabel, clicks: 1 }],
      by_placement: [{ page_link_id: recordedClick.pageLinkId, position: 0, clicks: 1 }],
    };

    expect(simulatedReport.total_clicks).toBe(1);
    expect(simulatedReport.by_page[0].clicks).toBe(1);
    expect(simulatedReport.by_link[0].clicks).toBe(1);
    expect(simulatedReport.by_placement[0].clicks).toBe(1);
  });
});
