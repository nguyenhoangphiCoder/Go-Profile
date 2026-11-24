import { z } from "zod";

const PG_UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const pgUuid = (message = "UUID không hợp lệ") => z.string().regex(PG_UUID_REGEX, message);

const optionalCoord = (min: number, max: number, label: string) =>
  z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).trim().replace(",", "."));
      return Number.isFinite(n) ? n : NaN;
    })
    .refine((v) => v === null || (Number.isFinite(v) && v >= min && v <= max), {
      message: `${label} phải nằm trong khoảng ${min} đến ${max}`,
    });

export const branchInputSchema = z.object({
  code: z.string().trim().max(40).optional().nullable(),
  name: z
    .string()
    .trim()
    .min(1, "Tên chi nhánh không được để trống")
    .max(120, "Tên chi nhánh tối đa 120 ký tự"),
  address: z
    .string()
    .trim()
    .min(1, "Địa chỉ không được để trống")
    .max(300, "Địa chỉ tối đa 300 ký tự"),
  district: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().max(80).optional().default("TP.HCM"),
  phone: z.string().trim().max(30).optional().nullable(),
  hours: z.string().trim().max(80).optional().nullable(),
  lat: optionalCoord(-90, 90, "Vĩ độ (lat)"),
  lng: optionalCoord(-180, 180, "Kinh độ (lng)"),
  mapsUrl: z
    .string()
    .trim()
    .max(1000)
    .refine(
      (v) => v === "" || /^https?:\/\//i.test(v),
      "Link Google Maps phải bắt đầu bằng https://"
    )
    .optional()
    .nullable(),
  isActive: z.boolean().optional().default(true),
});

export type BranchFormInput = z.input<typeof branchInputSchema>;

export const updateBranchSchema = branchInputSchema.extend({
  id: pgUuid("ID chi nhánh không hợp lệ"),
});

export type UpdateBranchInput = z.input<typeof updateBranchSchema>;

export const importBranchesSchema = z.object({
  rows: z
    .array(branchInputSchema)
    .min(1, "Danh sách import trống")
    .max(300, "Tối đa 300 chi nhánh mỗi lần import"),
});

export type ImportBranchesInput = z.input<typeof importBranchesSchema>;
