import { z } from "zod";
import { isReservedSlug } from "@/config/reserved-slugs";
import {
  BLOCK_PAYLOAD_SCHEMAS,
  BLOCK_TYPES,
  MAX_BLOCK_PAYLOAD_BYTES,
} from "@/features/renderer/blocks/payload-schemas";
import {
  isSafeColor,
  isSafeImageUrl,
  parseLegacyGradient,
  themeOverridesSchema,
} from "@/config/theme-tokens";

// Regex kiểm tra slug: chỉ gồm chữ thường a-z, 0-9, dấu chấm (.) và dấu gạch nối (-), không có ký tự phân cách liên tiếp hoặc ở đầu/cuối
export const SLUG_REGEX = /^[a-z0-9]+([.-][a-z0-9]+)*$/;

export const pageSlugSchema = z
  .string()
  .trim()
  .min(2, "Đường dẫn (slug) phải có ít nhất 2 ký tự")
  .max(64, "Đường dẫn (slug) không được vượt quá 64 ký tự")
  .regex(
    SLUG_REGEX,
    "Đường dẫn chỉ được chứa chữ thường (a-z), chữ số (0-9), dấu chấm (.) và dấu gạch nối (-) phân cách"
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
const PG_UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const pgUuid = (message = "UUID không hợp lệ") => z.string().regex(PG_UUID_REGEX, message);

export const pageIdSchema = pgUuid("ID trang không hợp lệ");

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

export const blockSchema = z
  .object({
    id: z.string(),
    type: z.enum(BLOCK_TYPES),
    position: z.number().int().min(0),
    isVisible: z.boolean().default(true),
    payload: z.record(z.string(), z.any()),
    placements: z.array(linkPlacementSchema).optional(),
  })
  .superRefine((block, ctx) => {
    // Kiểm tra payload theo đúng loại khối (khai báo trong renderer/blocks/payload-schemas.ts)
    const payloadSchema = BLOCK_PAYLOAD_SCHEMAS[block.type];
    if (!payloadSchema || !block.payload) return;
    const result = payloadSchema.safeParse(block.payload);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: "custom",
          path: ["payload", ...issue.path.map((p) => (typeof p === "symbol" ? String(p) : p))],
          message: `Dữ liệu khối "${block.type}" không hợp lệ: ${issue.message}`,
        });
      }
    }
    if (JSON.stringify(block.payload).length > MAX_BLOCK_PAYLOAD_BYTES) {
      ctx.addIssue({
        code: "custom",
        path: ["payload"],
        message: "Nội dung khối quá lớn",
      });
    }
  });

/**
 * Theme v1 (`custom`): giá trị màu/ảnh/gradient không hợp lệ (ví dụ mã màu đang gõ dở) được
 * bỏ đi thay vì làm hỏng cả lần lưu; giá trị hợp lệ được giữ nguyên.
 */
const dropInvalid = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);
const legacyColor = dropInvalid(z.string().refine(isSafeColor));

const legacyThemeCustomSchema = z
  .object({
    accentColor: legacyColor,
    backgroundColor: legacyColor,
    textColor: legacyColor,
    cardBackground: legacyColor,
    cardTextColor: legacyColor,
    cardBorderColor: legacyColor,
    backgroundGradient: dropInvalid(z.string().refine((v) => parseLegacyGradient(v) !== null)),
    backgroundImage: dropInvalid(z.string().refine(isSafeImageUrl)),
    backgroundBlur: dropInvalid(z.union([z.boolean(), z.string().max(16)])),
    backgroundVariant: dropInvalid(
      z.enum(["glass", "frosted-dark", "frosted-warm", "frosted-light", "default"])
    ),
    cardBackdropBlur: dropInvalid(z.boolean()),
    borderRadius: dropInvalid(z.enum(["none", "sm", "md", "full"])),
    fontFamily: dropInvalid(z.enum(["inter", "be-vietnam-pro", "montserrat"])),
  })
  .strip()
  .transform((obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)));

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
    preset: z.string().min(1, "Vui lòng chọn giao diện (theme)").max(64),
    custom: legacyThemeCustomSchema.optional(),
    version: z.literal(2).optional(),
    overrides: themeOverridesSchema.optional(),
  }),
  seo: z
    .object({
      metaTitle: z.string().trim().max(100).optional().nullable(),
      metaDescription: z.string().trim().max(300).optional().nullable(),
      ogImageMediaId: pgUuid().optional().nullable(),
    })
    .default({}),
  blocks: z.array(blockSchema).max(200, "Một trang tối đa 200 khối nội dung"),
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
