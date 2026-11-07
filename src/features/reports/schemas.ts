import { z } from "zod";

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
  pageId: z.string().uuid("ID trang không hợp lệ").optional().or(z.literal("")),
  linkId: z.string().uuid("ID liên kết không hợp lệ").optional().or(z.literal("")),
});

export type ReportParamsInput = z.infer<typeof reportParamsSchema>;
