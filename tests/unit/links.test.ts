import { describe, it, expect } from "vitest";
import { linkSchema } from "@/features/links/schemas";

describe("Links Module: Protocol & URL Validation", () => {
  it("valid http/https links pass validation", () => {
    const validHttp = {
      defaultLabel: "ShopeeFood Gờ Cafe",
      kind: "http" as const,
      targetUrl: "https://shopeefood.vn/thuong-hieu/go-cafe",
    };

    const result = linkSchema.safeParse(validHttp);
    expect(result.success).toBe(true);
  });

  it("valid tel link passes validation", () => {
    const validTel = {
      defaultLabel: "Hotline CSKH",
      kind: "tel" as const,
      targetUrl: "tel:1900123456",
    };

    const result = linkSchema.safeParse(validTel);
    expect(result.success).toBe(true);
  });

  it("valid mailto link passes validation", () => {
    const validMailto = {
      defaultLabel: "Email hỗ trợ",
      kind: "mailto" as const,
      targetUrl: "mailto:cskh@gocafe.vn",
    };

    const result = linkSchema.safeParse(validMailto);
    expect(result.success).toBe(true);
  });

  it("rejects malicious javascript: protocol", () => {
    const malicious = {
      defaultLabel: "Bấm nhận quà",
      kind: "http" as const,
      targetUrl: "javascript:alert(document.cookie)",
    };

    const result = linkSchema.safeParse(malicious);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.targetUrl?.[0]).toContain("không an toàn");
    }
  });

  it("rejects tel link missing tel: prefix", () => {
    const invalidTel = {
      defaultLabel: "Gọi ngay",
      kind: "tel" as const,
      targetUrl: "0901234567",
    };

    const result = linkSchema.safeParse(invalidTel);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.targetUrl?.[0]).toContain("bắt đầu bằng tel:");
    }
  });

  it("rejects mailto link with invalid email format", () => {
    const invalidMailto = {
      defaultLabel: "Gửi thư",
      kind: "mailto" as const,
      targetUrl: "mailto:notanemail",
    };

    const result = linkSchema.safeParse(invalidMailto);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.targetUrl?.[0]).toContain("không đúng định dạng");
    }
  });
});
