import { z } from "zod";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const mediaUploadSchema = z.object({
  filename: z.string().min(1, "Tên tệp không được để trống"),
  size: z.number().max(MAX_FILE_SIZE_BYTES, "Kích thước tệp không được vượt quá 5MB"),
  type: z.string().refine((val) => (ALLOWED_MIME_TYPES as readonly string[]).includes(val), {
    message: "Chỉ hỗ trợ các định dạng ảnh: JPEG, PNG, WebP, GIF, SVG",
  }),
});
