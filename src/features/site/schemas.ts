import { z } from "zod";
import { pageSlugSchema } from "@/features/pages/schemas";
import { FONT_IDS, isSafeColor } from "@/config/theme-tokens";

const PG_UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const pgUuid = (message = "UUID không hợp lệ") => z.string().regex(PG_UUID_REGEX, message);

const safeHrefSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) =>
      v === "" ||
      v.startsWith("/") ||
      v.startsWith("#") ||
      /^https?:\/\//i.test(v) ||
      /^tel:/i.test(v) ||
      /^mailto:/i.test(v),
    "Đường dẫn phải bắt đầu bằng /, #, https://, tel: hoặc mailto:"
  );

const optColorSchema = z
  .string()
  .trim()
  .max(64)
  .refine((v) => v === "" || isSafeColor(v), "Mã màu không hợp lệ")
  .optional()
  .default("");

const optHttpUrlSchema = z
  .string()
  .trim()
  .max(400)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Đường dẫn phải bắt đầu bằng https://")
  .optional()
  .default("");

export const siteSocialLinksSchema = z
  .object({
    facebook: optHttpUrlSchema,
    tiktok: optHttpUrlSchema,
    instagram: optHttpUrlSchema,
    shopee: optHttpUrlSchema,
    youtube: optHttpUrlSchema,
  })
  .optional()
  .default({
    facebook: "",
    tiktok: "",
    instagram: "",
    shopee: "",
    youtube: "",
  });

export const siteTrackingSchema = z
  .object({
    ga4Id: z
      .string()
      .trim()
      .max(30)
      .refine((v) => v === "" || /^G-[A-Z0-9]{4,20}$/i.test(v), "Mã GA4 có dạng G-XXXXXXXXXX")
      .optional()
      .default(""),
    fbPixelId: z
      .string()
      .trim()
      .max(30)
      .refine((v) => v === "" || /^[0-9]{5,25}$/.test(v), "Facebook Pixel ID chỉ gồm chữ số")
      .optional()
      .default(""),
    tiktokPixelId: z
      .string()
      .trim()
      .max(40)
      .refine((v) => v === "" || /^[A-Z0-9]{6,30}$/i.test(v), "TikTok Pixel ID chỉ gồm chữ và số")
      .optional()
      .default(""),
  })
  .optional()
  .default({ ga4Id: "", fbPixelId: "", tiktokPixelId: "" });

export const siteFooterStyleSchema = z
  .object({
    layout: z.enum(["columns", "centered"]).optional().default("columns"),
    padding: z.enum(["compact", "default", "spacious"]).optional().default("default"),
    showLogo: z.boolean().optional().default(true),
    bgColor: optColorSchema,
    textColor: optColorSchema,
    accentColor: optColorSchema,
    font: z.enum(FONT_IDS).optional().default("lexend-deca"),
    fontSize: z.number().int().min(12).max(16).optional().default(14),
  })
  .optional()
  .default({
    layout: "columns",
    padding: "default",
    showLogo: true,
    bgColor: "",
    textColor: "",
    accentColor: "",
    font: "lexend-deca",
    fontSize: 14,
  });

export const siteLeadNotificationsSchema = z
  .object({
    telegramBotToken: z.string().trim().max(120).optional().default(""),
    telegramChatId: z.string().trim().max(60).optional().default(""),
    webhookUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || /^https:\/\//i.test(v), "Webhook URL phải bắt đầu bằng https://")
      .optional()
      .default(""),
  })
  .optional()
  .default({ telegramBotToken: "", telegramChatId: "", webhookUrl: "" });

export const siteHeaderConfigSchema = z.object({
  sticky: z.boolean().optional().default(true),
  hideSiteName: z.boolean().optional().default(false),
  homePageSlug: z
    .string()
    .trim()
    .max(80)
    .refine((v) => v === "" || /^[a-z0-9-]+$/.test(v), "Slug trang chủ không hợp lệ")
    .optional()
    .default(""),
  navLayout: z
    .enum(["classic", "left", "centered-logo", "floating-pill"])
    .optional()
    .default("classic"),
  navHeight: z.enum(["compact", "default", "tall"]).optional().default("default"),
  logoHeight: z.number().int().min(24).max(56).optional().default(36),
  navGap: z.enum(["compact", "normal", "wide"]).optional().default("normal"),
  navFont: z.enum(FONT_IDS).optional().default("lexend-deca"),
  navFontSize: z.number().int().min(11).max(20).optional().default(13),
  navUppercase: z.boolean().optional().default(false),
  navWeight: z.enum(["500", "600", "700"]).optional().default("500"),
  navActiveStyle: z.enum(["text", "underline", "pill"]).optional().default("text"),
  navBackdrop: z.enum(["glass", "solid", "transparent-top"]).optional().default("glass"),
  navShadow: z.enum(["none", "sm", "md"]).optional().default("none"),
  navBorder: z.boolean().optional().default(true),
  navBgColor: optColorSchema,
  navTextColor: optColorSchema,
  navActiveColor: optColorSchema,
  ctaEnabled: z.boolean().optional().default(false),
  ctaLabel: z.string().trim().max(40).optional().default(""),
  ctaHref: safeHrefSchema.optional().default(""),
  ctaBgColor: optColorSchema,
  ctaTextColor: optColorSchema,
  ctaRadius: z.enum(["md", "xl", "full"]).optional().default("xl"),
  ctaShowOnMobile: z.boolean().optional().default(false),
  announcementEnabled: z.boolean().optional().default(false),
  announcementText: z.string().trim().max(180).optional().default(""),
  announcementHref: safeHrefSchema.optional().default(""),
  announcementBgColor: optColorSchema,
  announcementTextColor: optColorSchema,
  faviconUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => v === "" || /^https?:\/\/[^\s"'<>]+$/i.test(v) || /^\/[^\s"'<>]*$/.test(v),
      "URL Favicon phải bắt đầu bằng https:// hoặc /"
    )
    .optional()
    .default(""),
  copyrightText: z.string().trim().max(160).optional().default(""),
  legalLinks: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Nhãn liên kết không được để trống").max(60),
        href: safeHrefSchema.refine((v) => v.length > 0, "Đường dẫn không được để trống"),
      })
    )
    .max(6)
    .optional()
    .default([]),
  footerStyle: siteFooterStyleSchema,
  socialLinks: siteSocialLinksSchema,
  tracking: siteTrackingSchema,
  leadNotifications: siteLeadNotificationsSchema,
});

export const siteFooterLinkSchema = z.object({
  label: z.string().trim().min(1, "Nhãn liên kết không được để trống").max(80),
  href: safeHrefSchema.refine((v) => v.length > 0, "Đường dẫn không được để trống"),
});

export const siteFooterColumnSchema = z.object({
  title: z.string().trim().min(1, "Tiêu đề cột không được để trống").max(80),
  description: z.string().trim().max(400).optional().default(""),
  links: z.array(siteFooterLinkSchema).max(12).optional().default([]),
});

export const siteFloatingCustomButtonSchema = z.object({
  id: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1, "Nhập tên nút nổi").max(40),
  href: safeHrefSchema.refine((v) => v.length > 0, "Nhập đường dẫn cho nút nổi"),
  icon: z.enum(["phone", "zalo", "messenger", "tiktok", "maps", "link"]).default("link"),
  bgColor: optColorSchema,
  textColor: optColorSchema,
});

export const siteFloatingContactSchema = z.object({
  enabled: z.boolean().optional().default(false),
  position: z.enum(["right", "left"]).optional().default("right"),
  showBackToTop: z.boolean().optional().default(false),
  showCall: z.boolean().optional().default(true),
  phone: z.string().trim().max(30).optional().default(""),
  showZalo: z.boolean().optional().default(true),
  zaloUrl: z
    .string()
    .trim()
    .max(300)
    .refine(
      (v) => v === "" || /^https?:\/\//i.test(v) || /^[0-9+\s.-]{8,20}$/.test(v),
      "Nhập số Zalo hoặc đường dẫn https://zalo.me/..."
    )
    .optional()
    .default(""),
  customButtons: z.array(siteFloatingCustomButtonSchema).max(6).optional().default([]),
});

export const createSiteShellSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên bộ Menu / Website không được để trống")
    .max(120, "Tên bộ tối đa 120 ký tự"),
});

export const renameSiteShellSchema = z.object({
  shellId: pgUuid("ID bộ Menu không hợp lệ"),
  name: z
    .string()
    .trim()
    .min(1, "Tên bộ Menu / Website không được để trống")
    .max(120, "Tên bộ tối đa 120 ký tự"),
});

export const saveSiteSettingsSchema = z.object({
  shellId: pgUuid("ID bộ Menu không hợp lệ").optional(),
  siteName: z.string().trim().max(120).optional().default(""),
  logoMediaId: pgUuid("ID ảnh logo không hợp lệ").nullable().optional(),
  headerConfig: siteHeaderConfigSchema.default({
    sticky: true,
    hideSiteName: false,
    homePageSlug: "",
    navLayout: "classic",
    navHeight: "default",
    logoHeight: 36,
    navGap: "normal",
    navFont: "lexend-deca",
    navFontSize: 13,
    navUppercase: false,
    navWeight: "500",
    navActiveStyle: "text",
    navBackdrop: "glass",
    navShadow: "none",
    navBorder: true,
    navBgColor: "",
    navTextColor: "",
    navActiveColor: "",
    ctaEnabled: false,
    ctaLabel: "",
    ctaHref: "",
    ctaBgColor: "",
    ctaTextColor: "",
    ctaRadius: "xl",
    ctaShowOnMobile: false,
    announcementEnabled: false,
    announcementText: "",
    announcementHref: "",
    announcementBgColor: "",
    announcementTextColor: "",
    faviconUrl: "",
    copyrightText: "",
    legalLinks: [],
    footerStyle: {
      layout: "columns",
      padding: "default",
      showLogo: true,
      bgColor: "",
      textColor: "",
      accentColor: "",
      font: "lexend-deca",
      fontSize: 14,
    },
    socialLinks: {
      facebook: "",
      tiktok: "",
      instagram: "",
      shopee: "",
      youtube: "",
    },
    tracking: {
      ga4Id: "",
      fbPixelId: "",
      tiktokPixelId: "",
    },
    leadNotifications: {
      telegramBotToken: "",
      telegramChatId: "",
      webhookUrl: "",
    },
  }),
  footerColumns: z.array(siteFooterColumnSchema).max(4, "Footer tối đa 4 cột").default([]),
  floatingContact: siteFloatingContactSchema.default({
    enabled: false,
    position: "right",
    showBackToTop: false,
    showCall: true,
    phone: "",
    showZalo: true,
    zaloUrl: "",
    customButtons: [],
  }),
});

export type SaveSiteSettingsInput = z.input<typeof saveSiteSettingsSchema>;

const navTargetRefine = (
  data: {
    targetType: "page" | "anchor" | "url";
    targetPageId?: string | null;
    targetValue?: string | null;
  },
  ctx: z.RefinementCtx
) => {
  if (data.targetType === "page" && !data.targetPageId) {
    ctx.addIssue({
      code: "custom",
      path: ["targetPageId"],
      message: "Vui lòng chọn trang đích cho tab này",
    });
  }
  if (data.targetType === "anchor") {
    const v = (data.targetValue || "").trim();
    if (!v || !/^#?[a-zA-Z0-9_-]{1,64}$/.test(v)) {
      ctx.addIssue({
        code: "custom",
        path: ["targetValue"],
        message: "Neo mục lục chỉ gồm chữ, số, gạch nối (VD: #bang-gia)",
      });
    }
  }
  if (data.targetType === "url") {
    const v = (data.targetValue || "").trim();
    if (!v || !(v.startsWith("/") || /^https?:\/\//i.test(v) || /^tel:/i.test(v))) {
      ctx.addIssue({
        code: "custom",
        path: ["targetValue"],
        message: "Đường dẫn phải bắt đầu bằng https://, / hoặc tel:",
      });
    }
  }
};

export const createNavItemSchema = z
  .object({
    shellId: pgUuid("ID bộ Menu không hợp lệ").optional(),
    parentId: pgUuid("ID mục cha không hợp lệ").nullable().optional(),
    label: z
      .string()
      .trim()
      .min(1, "Tên tab không được để trống")
      .max(60, "Tên tab tối đa 60 ký tự"),
    targetType: z.enum(["page", "anchor", "url"]),
    targetPageId: pgUuid("ID trang đích không hợp lệ").nullable().optional(),
    targetValue: z.string().trim().max(500).nullable().optional(),
    isVisible: z.boolean().optional().default(true),
  })
  .superRefine(navTargetRefine);

export type CreateNavItemInput = z.input<typeof createNavItemSchema>;

export const updateNavItemSchema = z
  .object({
    id: pgUuid("ID mục menu không hợp lệ"),
    parentId: pgUuid("ID mục cha không hợp lệ").nullable().optional(),
    label: z
      .string()
      .trim()
      .min(1, "Tên tab không được để trống")
      .max(60, "Tên tab tối đa 60 ký tự"),
    targetType: z.enum(["page", "anchor", "url"]),
    targetPageId: pgUuid("ID trang đích không hợp lệ").nullable().optional(),
    targetValue: z.string().trim().max(500).nullable().optional(),
    isVisible: z.boolean().optional(),
  })
  .superRefine(navTargetRefine);

export type UpdateNavItemInput = z.input<typeof updateNavItemSchema>;

export const reorderNavItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: pgUuid(),
        parentId: pgUuid().nullable(),
        position: z.number().int().min(0),
      })
    )
    .min(1)
    .max(100),
});

export type ReorderNavItemsInput = z.infer<typeof reorderNavItemsSchema>;

export const createPageForNavSchema = z.object({
  shellId: pgUuid("ID bộ Menu không hợp lệ").optional(),
  parentId: pgUuid("ID mục cha không hợp lệ").nullable().optional(),
  label: z.string().trim().min(1, "Tên tab không được để trống").max(60, "Tên tab tối đa 60 ký tự"),
  slug: pageSlugSchema,
  title: z.string().trim().min(1).max(100).optional(),
});

export type CreatePageForNavInput = z.input<typeof createPageForNavSchema>;
