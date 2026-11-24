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

const optSafeImageUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) => v === "" || /^https?:\/\/[^\s"'<>]+$/i.test(v) || /^\/[^\s"'<>]*$/.test(v),
    "URL ảnh nền không hợp lệ"
  )
  .optional();

const optAnchorId = z
  .string()
  .trim()
  .max(60)
  .refine((v) => v === "" || /^[a-z0-9-]+$/.test(v), "ID neo chỉ gồm chữ thường, số và dấu gạch ngang")
  .optional();

export const blockStyleSchema = z
  .object({
    align: z.enum(["left", "center", "right"]).optional(),
    paddingY: z.enum(["none", "sm", "md", "lg"]).optional(),
    paddingTop: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
    paddingBottom: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
    maxWidth: z.enum(["sm", "md", "lg", "full"]).optional(),
    surface: z.enum(["none", "card", "cream", "dark"]).optional(),
    bgColor: optColor,
    bgGradientFrom: optColor,
    bgGradientTo: optColor,
    bgGradientDir: z.enum(["to-r", "to-br", "to-b"]).optional(),
    bgImageUrl: optSafeImageUrl,
    bgOverlayOpacity: z.number().int().min(0).max(90).optional(),
    radius: z.enum(["none", "md", "xl", "2xl", "3xl"]).optional(),
    borderWidth: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
    borderColor: optColor,
    shadow: z.enum(["none", "sm", "md", "lg"]).optional(),
    animation: z.enum(["none", "fade-up", "fade-in", "zoom-in", "slide-left"]).optional(),
    fontSize: z.enum(["sm", "md", "lg", "xl"]).optional(),
    titleFontSize: z.number().int().min(10).max(72).optional(),
    bodyFontSize: z.number().int().min(10).max(28).optional(),
    titleFont: z.enum(FONT_IDS).optional(),
    bodyFont: z.enum(FONT_IDS).optional(),
    titleColor: optColor,
    bodyColor: optColor,
    buttonHeight: z.number().int().min(36).max(80).optional(),
    anchorId: optAnchorId,
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
    rightTextByUrl: z.record(z.string().max(2048), z.string().max(80)).nullish(),
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

  // ---- Khối Landing Page (Platform CMS) ----
  hero_section: styled({
    layout: z.enum(["split", "centered", "full-bg"]).nullish(),
    eyebrow: optText(100),
    title: optText(200),
    subtitle: optText(600),
    mediaId: optId,
    imageUrl: optUrl,
    videoUrl: optUrl,
    overlayOpacity: z.number().int().min(0).max(85).nullish(),
    height: z.enum(["compact", "default", "tall"]).nullish(),
    primaryCtaLabel: optText(60),
    primaryCtaHref: optUrl,
    secondaryCtaLabel: optText(60),
    secondaryCtaHref: optUrl,
    anchorId: optId,
  }),
  toc_bar: styled({
    title: optText(100),
    sticky: z.boolean().nullish(),
    items: z
      .array(
        z
          .object({
            label: z.string().max(80),
            anchorId: z.string().max(64),
          })
          .strict()
      )
      .max(15)
      .nullish(),
  }),
  stats_strip: styled({
    anchorId: optId,
    columns: z.union([z.literal(3), z.literal(4)]).nullish(),
    items: z
      .array(
        z
          .object({
            value: z.string().max(40),
            label: z.string().max(100),
            sublabel: optText(120),
          })
          .strict()
      )
      .max(8)
      .nullish(),
  }),
  split_content: styled({
    anchorId: optId,
    imagePosition: z.enum(["left", "right"]).nullish(),
    eyebrow: optText(100),
    title: optText(200),
    content: optText(25000),
    mediaId: optId,
    imageUrl: optUrl,
    ctaLabel: optText(60),
    ctaHref: optUrl,
  }),
  info_cards: styled({
    anchorId: optId,
    title: optText(200),
    subtitle: optText(400),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).nullish(),
    variant: z.enum(["card", "steps"]).nullish(),
    items: z
      .array(
        z
          .object({
            badge: optText(40),
            title: z.string().max(140),
            description: optText(600),
          })
          .strict()
      )
      .max(16)
      .nullish(),
  }),
  pricing_table: styled({
    anchorId: optId,
    title: optText(200),
    effectiveNote: optText(200),
    columns: z.array(z.string().max(60)).max(6).nullish(),
    rows: z
      .array(
        z
          .object({
            name: z.string().max(140),
            subtitle: optText(140),
            description: optText(300),
            prices: z.array(z.string().max(60)).max(6),
            highlight: z.boolean().nullish(),
          })
          .strict()
      )
      .max(30)
      .nullish(),
  }),
  product_grid: styled({
    anchorId: optId,
    title: optText(200),
    subtitle: optText(400),
    categories: z.array(z.string().max(60)).max(12).nullish(),
    items: z
      .array(
        z
          .object({
            name: z.string().max(140),
            category: optText(60),
            price: optText(40),
            description: optText(300),
            badge: optText(40),
            mediaId: optId,
            imageUrl: optUrl,
            buyUrl: optUrl,
          })
          .strict()
      )
      .max(40)
      .nullish(),
  }),
  store_locator: styled({
    anchorId: optId,
    title: optText(200),
    subtitle: optText(400),
    showSearch: z.boolean().nullish(),
    showDistrictFilter: z.boolean().nullish(),
    defaultZoom: z.number().int().min(8).max(18).nullish(),
    pinIconUrl: optSafeImageUrl.nullish(),
    mapStyle: z.enum(["standard", "satellite", "hybrid"]).nullish(),
  }),
  lead_form: styled({
    anchorId: optId,
    formName: optText(120),
    eyebrow: optText(80),
    title: optText(200),
    subtitle: optText(400),
    submitLabel: optText(80),
    successMessage: optText(400),
    redirectUrl: optSafeImageUrl.nullish(),
    fullNameLabel: optText(80),
    fullNamePlaceholder: optText(120),
    phoneLabel: optText(80),
    phonePlaceholder: optText(120),
    emailLabel: optText(80),
    emailPlaceholder: optText(120),
    noteLabel: optText(80),
    showEmail: z.boolean().nullish(),
    showNote: z.boolean().nullish(),
    notePlaceholder: optText(200),
    popupDelaySec: z.number().int().min(0).max(120).nullish(),
    customFields: z
      .array(
        z
          .object({
            id: z.string().min(1).max(64),
            label: z.string().max(120),
            type: z.enum(["text", "select", "checkbox"]),
            required: z.boolean().optional(),
            placeholder: optText(160),
            options: z.array(z.string().max(100)).max(20).optional(),
          })
          .strict()
      )
      .max(8)
      .nullish(),
  }),
  banner_slider: styled({
    anchorId: optId,
    autoPlaySec: z.number().int().min(0).max(30).nullish(),
    slides: z
      .array(
        z
          .object({
            mediaId: optId,
            imageUrl: optUrl,
            title: optText(160),
            subtitle: optText(300),
            ctaLabel: optText(60),
            ctaHref: optUrl,
          })
          .strict()
      )
      .max(10)
      .nullish(),
  }),
  testimonials: styled({
    anchorId: optId,
    title: optText(200),
    subtitle: optText(400),
    columns: z.union([z.literal(2), z.literal(3)]).nullish(),
    items: z
      .array(
        z
          .object({
            author: z.string().max(100),
            role: optText(100),
            quote: z.string().max(600),
            rating: z.number().int().min(1).max(5).nullish(),
            mediaId: optId,
            avatarUrl: optUrl,
          })
          .strict()
      )
      .max(12)
      .nullish(),
  }),
  cta_banner: styled({
    anchorId: optId,
    tone: z.enum(["dark", "gold", "cream"]).nullish(),
    eyebrow: optText(100),
    title: optText(200),
    subtitle: optText(400),
    primaryCtaLabel: optText(60),
    primaryCtaHref: optUrl,
    secondaryCtaLabel: optText(60),
    secondaryCtaHref: optUrl,
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
