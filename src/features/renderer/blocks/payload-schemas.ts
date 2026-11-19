import { z } from "zod";
import { FONT_IDS, isSafeColor } from "@/config/theme-tokens";
import type { BlockType } from "@/features/pages/types";
import { isSafeMapsUrl, parseVideoUrl } from "../embeds";

/**
 * Schema payload cho từng loại khối (không phụ thuộc UI, dùng được trong server action).
 *
 * - Khối cũ (v1): kiểm tra kiểu và độ dài, vẫn cho phép trường phụ và giá trị cũ (looseObject)
 *   để không làm hỏng các trang đã lưu trước đây.
 * - Khối mới (v2): kiểm tra chặt hơn — giá trị liệt kê, giới hạn số phần tử, URL whitelist.
 * - Mọi khối đều có thể kèm `blockStyle` (style riêng của khối, whitelist chặt).
 */
const optText = (max: number) => z.string().max(max).nullish();
const optUrl = z.string().max(2048).nullish();
const optId = z.string().max(64).nullish();
const optToken = z.string().max(32).nullish();
const optColor = z
  .string()
  .trim()
  .max(64)
  .refine((v) => v === "" || isSafeColor(v), "Mã màu không hợp lệ")
  .optional();

const buttonColorOverrideSchema = z
  .object({
    bg: optColor,
    text: optColor,
  })
  .strict();

export const blockStyleSchema = z
  .object({
    align: z.enum(["left", "center", "right"]).optional(),
    paddingY: z.enum(["none", "sm", "md", "lg"]).optional(),
    surface: z.enum(["none", "card"]).optional(),
    animation: z.enum(["none", "fade-up"]).optional(),
    fontSize: z.enum(["sm", "md", "lg", "xl"]).optional(),
    titleFontSize: z.number().int().min(10).max(36).optional(),
    bodyFontSize: z.number().int().min(10).max(28).optional(),
    titleFont: z.enum(FONT_IDS).optional(),
    bodyFont: z.enum(FONT_IDS).optional(),
    titleColor: optColor,
    bodyColor: optColor,
    buttonHeight: z.number().int().min(36).max(80).optional(),
    hideOn: z
      .array(z.enum(["mobile", "desktop"]))
      .max(2)
      .optional(),
  })
  .strict();

const styled = <S extends z.core.$ZodLooseShape>(shape: S) =>
  z.looseObject({ ...shape, blockStyle: blockStyleSchema.nullish() });

const galleryImage = z.object({ mediaId: optId, url: optUrl, alt: optText(200) }).strict();

const menuItem = z
  .object({
    name: z.string().max(120),
    price: optText(40),
    description: optText(300),
    badge: optText(30),
    mediaId: optId,
    imageUrl: optUrl,
  })
  .strict();

const accordionItem = z
  .object({ title: z.string().max(200), content: z.string().max(8000) })
  .strict();

export const BLOCK_PAYLOAD_SCHEMAS: Record<BlockType, z.ZodType<Record<string, unknown>>> = {
  header: styled({
    title: optText(200),
    bio: optText(5000),
    avatarMediaId: optId,
    avatarUrl: optUrl,
    bannerMediaId: optId,
    bannerUrl: optUrl,
  }),
  image: styled({
    mediaAssetId: optId,
    imageUrl: optUrl,
    url: optUrl,
    alt: optText(300),
    caption: optText(500),
    targetUrl: optUrl,
  }),
  heading: styled({
    text: optText(300),
    level: z.union([z.number().int().min(1).max(6), z.string().max(2)]).nullish(),
  }),
  text: styled({
    content: optText(25000),
    align: optToken,
  }),
  link_list: styled({
    layout: optToken,
    zaloByTel: z.record(z.string().max(120), z.string().max(200)).nullish(),
    buttonColors: z.record(z.string().max(2048), buttonColorOverrideSchema).nullish(),
  }),
  social_icons: styled({ style: optToken }),
  spacer: styled({
    height: z.union([z.number().min(0).max(2000), z.string().max(16)]).nullish(),
  }),
  divider: styled({ style: optToken }),

  // ---- Khối mới (v2) ----
  button: styled({
    subtitle: optText(120),
    size: z.enum(["md", "lg"]).nullish(),
    emphasis: z.enum(["accent", "surface"]).nullish(),
    customBg: optColor.nullable(),
    customText: optColor.nullable(),
    zaloTarget: optText(200),
  }),
  gallery: styled({
    images: z.array(galleryImage).max(12).nullish(),
    layout: z.enum(["grid", "carousel"]).nullish(),
    columns: z.union([z.literal(2), z.literal(3)]).nullish(),
  }),
  menu_card: styled({
    title: optText(120),
    items: z.array(menuItem).max(30).nullish(),
    layout: z.enum(["list", "grid"]).nullish(),
  }),
  accordion: styled({
    items: z.array(accordionItem).max(20).nullish(),
  }),
  video_embed: styled({
    url: z
      .string()
      .max(500)
      .refine((v) => v.trim() === "" || parseVideoUrl(v) !== null, {
        message: "Chỉ hỗ trợ link video YouTube hoặc TikTok",
      })
      .nullish(),
    caption: optText(300),
  }),
  map: styled({
    address: optText(300),
    label: optText(80),
    mapsUrl: z
      .string()
      .max(500)
      .refine((v) => v.trim() === "" || isSafeMapsUrl(v), {
        message: "Link bản đồ phải là link Google Maps (https)",
      })
      .nullish(),
    showMap: z.boolean().nullish(),
  }),
};

export const BLOCK_TYPES = Object.keys(BLOCK_PAYLOAD_SCHEMAS) as [BlockType, ...BlockType[]];

/** Loại khối gắn danh sách liên kết (placements) — dùng để ghi nhận click qua /r/{id}. */
export const LINK_BLOCK_TYPES: ReadonlySet<BlockType> = new Set([
  "link_list",
  "social_icons",
  "button",
]);

/** Giới hạn kích thước payload sau khi serialize (chặn payload phình to). */
export const MAX_BLOCK_PAYLOAD_BYTES = 32 * 1024;
