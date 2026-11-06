import { describe, it, expect } from "vitest";
import {
  mediaUploadSchema,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/features/media/schemas";

describe("Media Module: File Validation", () => {
  it("valid image upload within 5MB passes validation", () => {
    const valid = {
      filename: "logo-gocafe.png",
      size: 1024 * 500, // 500KB
      type: "image/png",
    };

    const result = mediaUploadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("all allowed image mime types pass validation", () => {
    for (const mime of ALLOWED_MIME_TYPES) {
      const res = mediaUploadSchema.safeParse({
        filename: "test-image",
        size: 1000,
        type: mime,
      });
      expect(res.success).toBe(true);
    }
  });

  it("file exceeding 5MB is rejected", () => {
    const tooLarge = {
      filename: "huge-image.jpg",
      size: MAX_FILE_SIZE_BYTES + 1024,
      type: "image/jpeg",
    };

    const result = mediaUploadSchema.safeParse(tooLarge);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("không được vượt quá 5MB");
    }
  });

  it("disallowed mime types (pdf, exe, zip) are rejected", () => {
    const invalidTypes = ["application/pdf", "application/x-msdownload", "application/zip"];

    for (const type of invalidTypes) {
      const res = mediaUploadSchema.safeParse({
        filename: "document.pdf",
        size: 1024,
        type,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toContain("Chỉ hỗ trợ các định dạng ảnh");
      }
    }
  });
});
