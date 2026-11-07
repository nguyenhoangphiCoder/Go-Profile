import { z } from "zod";
import { isReservedSlug } from "@/config/reserved-slugs";

// Regex kiểm tra slug: chỉ gồm chữ thường a-z, 0-9 và dấu gạch nối, không có dấu gạch nối liên tiếp hoặc ở đầu/cuối
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const pageSlugSchema = z
  .string()
  .trim()
  .min(2, "Đường dẫn (slug) phải có ít nhất 2 ký tự")
  .max(64, "Đường dẫn (slug) không được vượt quá 64 ký tự")
  .regex(
    SLUG_REGEX,
    "Đường dẫn chỉ được chứa chữ thường (a-z), chữ số (0-9) và dấu gạch nối (-) phân cách"
  )
  .refine((slug) => !isReservedSlug(slug), {
    message: "Đường dẫn này nằm trong danh mục từ khóa hệ thống được bảo lưu",
  });

export const createPageSchema = z.object({
  internalName: z
    .string()
    .trim()
    .min(1, "Tên nội bộ trang không được để trống")
    .max(100, "Tên nội bộ tối đa 100 ký tự"),
  slug: pageSlugSchema,
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề hiển thị không được để trống")
    .max(100, "Tiêu đề hiển thị tối đa 100 ký tự"),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;

// Regex kiểm tra UUID chuẩn PostgreSQL (hỗ trợ cả UUID v4 lẫn UUID seed như a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa)
const PG_UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const pgUuid = (message = "UUID không hợp lệ") => z.string().regex(PG_UUID_REGEX, message);

export const renameSlugSchema = z.object({
  pageId: pgUuid("ID trang không hợp lệ"),
  slug: pageSlugSchema,
  expectedPageVersion: z.number().int().min(1, "Expected page version không hợp lệ"),
});

export type RenameSlugInput = z.infer<typeof renameSlugSchema>;

export const linkPlacementSchema = z.object({
  id: z.string(),
  pageLinkId: pgUuid().optional(),
  linkId: pgUuid("ID link không hợp lệ"),
  position: z.number().int().min(0),
  labelOverride: z.string().trim().max(100).optional().nullable(),
  mediaOverrideId: pgUuid().optional().nullable(),
});

export const blockSchema = z.object({
  id: z.string(),
  type: z.enum([
    "header",
    "image",
    "heading",
    "text",
    "link_list",
    "social_icons",
    "spacer",
    "divider",
  ]),
  position: z.number().int().min(0),
  isVisible: z.boolean().default(true),
  payload: z.record(z.string(), z.any()),
  placements: z.array(linkPlacementSchema).optional(),
});

export const saveDraftSchema = z.object({
  pageId: pgUuid("ID trang không hợp lệ"),
  draftId: pgUuid("ID bản nháp không hợp lệ").optional(),
  expectedDraftVersion: z.number().int().min(1, "Phiên bản nháp không hợp lệ"),
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề trang không được để trống")
    .max(100, "Tiêu đề trang tối đa 100 ký tự"),
  description: z.string().trim().max(300).optional().nullable(),
  theme: z.object({
    preset: z.string().min(1, "Vui lòng chọn giao diện (theme)"),
    custom: z.record(z.string(), z.any()).optional(),
  }),
  seo: z
    .object({
      metaTitle: z.string().trim().max(100).optional().nullable(),
      metaDescription: z.string().trim().max(300).optional().nullable(),
      ogImageMediaId: pgUuid().optional().nullable(),
    })
    .default({}),
  blocks: z.array(blockSchema),
});

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;

export const publishPageSchema = z.object({
  pageId: pgUuid("ID trang không hợp lệ"),
  draftId: pgUuid("ID bản nháp không hợp lệ"),
  expectedPageVersion: z.number().int().min(1, "Expected page version không hợp lệ"),
  expectedDraftVersion: z.number().int().min(1, "Expected draft version không hợp lệ"),
});

export type PublishPageInput = z.infer<typeof publishPageSchema>;

export const unpublishPageSchema = z.object({
  pageId: pgUuid("ID trang không hợp lệ"),
  expectedPageVersion: z.number().int().min(1, "Expected page version không hợp lệ"),
});

export type UnpublishPageInput = z.infer<typeof unpublishPageSchema>;
