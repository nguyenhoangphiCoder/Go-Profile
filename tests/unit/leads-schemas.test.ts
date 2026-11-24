import { describe, it, expect } from "vitest";
import { isValidVnPhone, normalizeVnPhone, submitLeadSchema } from "@/features/leads/schemas";

describe("Leads phone normalization & anti-spam schema (Phase 5A)", () => {
  it("chuẩn hóa đúng các định dạng số điện thoại Việt Nam", () => {
    expect(normalizeVnPhone("+84 779.20.00.20")).toBe("0779200020");
    expect(normalizeVnPhone("84901234567")).toBe("0901234567");
    expect(normalizeVnPhone("0901-234-567")).toBe("0901234567");

    expect(isValidVnPhone("0779.20.00.20")).toBe(true);
    expect(isValidVnPhone("+84 901 234 567")).toBe(true);
    expect(isValidVnPhone("1900 9246")).toBe(true);
    expect(isValidVnPhone("0123456")).toBe(false);
    expect(isValidVnPhone("abcdefghi")).toBe(false);
  });

  it("submitLeadSchema chấp nhận form hợp lệ và chuẩn hóa SĐT", () => {
    const res = submitLeadSchema.safeParse({
      pageSlug: "nhuong-quyen",
      formName: "Tư vấn nhượng quyền",
      fullName: "Nguyễn Văn A",
      phone: "+84 779.20.00.20",
      email: "a@example.com",
      note: "Muốn mở quán tại Tân Bình",
      utmSource: "tiktok",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.phone).toBe("0779200020");
      expect(res.data.utmSource).toBe("tiktok");
    }
  });

  it("submitLeadSchema từ chối SĐT hoặc email sai định dạng", () => {
    const badPhone = submitLeadSchema.safeParse({
      pageSlug: "nhuong-quyen",
      formName: "Form",
      fullName: "Nguyễn Văn B",
      phone: "12345",
    });
    expect(badPhone.success).toBe(false);

    const badEmail = submitLeadSchema.safeParse({
      pageSlug: "nhuong-quyen",
      formName: "Form",
      fullName: "Nguyễn Văn B",
      phone: "0901234567",
      email: "khong-phai-email",
    });
    expect(badEmail.success).toBe(false);
  });
});
