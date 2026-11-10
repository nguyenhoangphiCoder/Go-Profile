import { z } from "zod";

const PG_UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const reportParamsSchema = z.object({
  preset: z.enum(["today", "last7days", "last30days", "thisMonth", "custom"]).default("last7days"),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày bắt đầu phải là YYYY-MM-DD")
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày kết thúc phải là YYYY-MM-DD")
    .optional(),
  pageId: z.string().regex(PG_UUID_REGEX, "ID trang không hợp lệ").optional().or(z.literal("")),
  linkId: z.string().regex(PG_UUID_REGEX, "ID liên kết không hợp lệ").optional().or(z.literal("")),
});

export type ReportParamsInput = z.infer<typeof reportParamsSchema>;
