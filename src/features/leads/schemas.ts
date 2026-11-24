import { z } from "zod";

const PG_UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const pgUuid = (message = "UUID không hợp lệ") => z.string().regex(PG_UUID_REGEX, message);

/**
 * Chuẩn hóa số điện thoại Việt Nam:
 * - Bỏ dấu chấm, gạch nối, khoảng trắng, dấu ngoặc.
 * - Đổi +84 / 84 ở đầu thành 0 (VD: +84 779.20.00.20 -> 0779200020).
 */
export function normalizeVnPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 10 && digits.length <= 11) {
    return `0${digits.slice(2)}`;
  }
  return digits;
}

const VN_PHONE_REGEX = /^(?:0[35789]\d{8}|02\d{8,9}|1[89]00\d{4,6})$/;

export function isValidVnPhone(raw: string): boolean {
  const normalized = normalizeVnPhone(raw);
  return VN_PHONE_REGEX.test(normalized);
}

export const leadStatusSchema = z.enum(["new", "contacted", "converted", "spam"]);

export const submitLeadSchema = z.object({
  pageSlug: z
    .string({ error: "Thiếu thông tin trang nguồn" })
    .trim()
    .min(1, "Thiếu thông tin trang nguồn")
    .max(80),
  formName: z
    .string({ error: "Thiếu tên form đăng ký" })
    .trim()
    .min(1, "Thiếu tên form đăng ký")
    .max(80),
  fullName: z
    .string({ error: "Vui lòng nhập họ tên" })
    .trim()
    .min(2, "Vui lòng nhập họ tên (ít nhất 2 ký tự)")
    .max(120, "Họ tên tối đa 120 ký tự"),
  phone: z
    .string({ error: "Vui lòng nhập số điện thoại" })
    .trim()
    .min(8, "Vui lòng nhập số điện thoại hợp lệ")
    .max(25, "Số điện thoại quá dài")
    .refine(isValidVnPhone, "Số điện thoại Việt Nam không hợp lệ (VD: 0901234567)")
    .transform(normalizeVnPhone),
  email: z
    .string()
    .trim()
    .max(160)
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Email không hợp lệ")
    .optional()
    .default(""),
  note: z.string().trim().max(2000, "Ghi chú tối đa 2000 ký tự").optional().default(""),
  utmSource: z.string().trim().max(100).optional().default(""),
  utmMedium: z.string().trim().max(100).optional().default(""),
  utmCampaign: z.string().trim().max(120).optional().default(""),
  /** Honeypot chống spam: người dùng thật không thấy trường này; bot điền vào sẽ bị loại bỏ im lặng. */
  website: z.string().max(200).optional().default(""),
});

export type SubmitLeadInput = z.input<typeof submitLeadSchema>;

export const updateLeadStatusSchema = z.object({
  id: pgUuid("ID khách hàng không hợp lệ"),
  status: leadStatusSchema,
});
