import type { FontId } from "@/config/theme-tokens";

export type SiteNavTargetType = "page" | "anchor" | "url";

export interface SiteSocialLinks {
  facebook?: string;
  tiktok?: string;
  instagram?: string;
  shopee?: string;
  youtube?: string;
}

export interface SiteTrackingConfig {
  ga4Id?: string;
  fbPixelId?: string;
  tiktokPixelId?: string;
}

export interface SiteLeadNotificationsConfig {
  telegramBotToken?: string;
  telegramChatId?: string;
  webhookUrl?: string;
}

export type SiteNavLayout = "classic" | "left" | "centered-logo" | "floating-pill";
export type SiteNavHeight = "compact" | "default" | "tall";
export type SiteNavGap = "compact" | "normal" | "wide";
export type SiteNavWeight = "500" | "600" | "700";
export type SiteNavActiveStyle = "text" | "underline" | "pill";
export type SiteNavBackdrop = "glass" | "solid" | "transparent-top";
export type SiteNavShadow = "none" | "sm" | "md";
export type SiteCtaRadius = "md" | "xl" | "full";

export type SiteFooterLayout = "columns" | "centered";
export type SiteFooterPadding = "compact" | "default" | "spacious";

export interface SiteFooterStyle {
  layout?: SiteFooterLayout;
  padding?: SiteFooterPadding;
  showLogo?: boolean;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  font?: FontId;
  fontSize?: number;
}

export interface SiteHeaderConfig {
  sticky?: boolean;
  hideSiteName?: boolean;
  homePageSlug?: string;
  // Bố cục & Kích thước
  navLayout?: SiteNavLayout;
  navHeight?: SiteNavHeight;
  logoHeight?: number;
  navGap?: SiteNavGap;
  // Kiểu chữ, Hiệu ứng & Active
  navFont?: FontId;
  navFontSize?: number;
  navUppercase?: boolean;
  navWeight?: SiteNavWeight;
  navActiveStyle?: SiteNavActiveStyle;
  navBackdrop?: SiteNavBackdrop;
  navShadow?: SiteNavShadow;
  navBorder?: boolean;
  navBgColor?: string;
  navTextColor?: string;
  navActiveColor?: string;
  // Nút CTA phải
  ctaEnabled?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  ctaBgColor?: string;
  ctaTextColor?: string;
  ctaRadius?: SiteCtaRadius;
  ctaShowOnMobile?: boolean;
  // Thanh thông báo trên cùng (Announcement Bar)
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementHref?: string;
  announcementBgColor?: string;
  announcementTextColor?: string;
  // Nhận diện Favicon, Bản quyền & Pháp lý
  faviconUrl?: string;
  copyrightText?: string;
  legalLinks?: SiteFooterLink[];
  // Footer style, socials, Marketing Tracking & Lead Notifications
  footerStyle?: SiteFooterStyle;
  socialLinks?: SiteSocialLinks;
  tracking?: SiteTrackingConfig;
  leadNotifications?: SiteLeadNotificationsConfig;
}

export interface SiteFooterLink {
  label: string;
  href: string;
}

export interface SiteFooterColumn {
  title: string;
  description?: string;
  links?: SiteFooterLink[];
}

export type SiteFloatingButtonIcon = "phone" | "zalo" | "messenger" | "tiktok" | "maps" | "link";

export interface SiteFloatingCustomButton {
  id: string;
  label: string;
  href: string;
  icon: SiteFloatingButtonIcon;
  bgColor?: string;
  textColor?: string;
}

export interface SiteFloatingContactConfig {
  enabled?: boolean;
  position?: "right" | "left";
  showBackToTop?: boolean;
  showCall?: boolean;
  phone?: string;
  showZalo?: boolean;
  zaloUrl?: string;
  customButtons?: SiteFloatingCustomButton[];
}

export interface SiteSettingsData {
  siteName: string;
  logoMediaId: string | null;
  logoUrl: string | null;
  headerConfig: SiteHeaderConfig;
  footerColumns: SiteFooterColumn[];
  floatingContact: SiteFloatingContactConfig;
  copyrightText?: string;
}

export interface SiteNavItemData {
  id: string;
  parentId: string | null;
  label: string;
  targetType: SiteNavTargetType;
  targetPageId: string | null;
  targetPageSlug: string | null;
  targetPageStatus: "published" | "unpublished" | null;
  targetValue: string | null;
  position: number;
  isVisible: boolean;
}

export interface SiteShellSummary {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface SiteConfigEditorData {
  workspaceName: string;
  canEdit: boolean;
  shells: SiteShellSummary[];
  activeShellId: string;
  activeShellName: string;
  activeShellIsDefault: boolean;
  settings: SiteSettingsData;
  navItems: SiteNavItemData[];
  availablePages: {
    id: string;
    internalName: string;
    primarySlug: string;
    pageKind: "profile" | "landing";
    status: "published" | "unpublished";
  }[];
  availableMedia: {
    id: string;
    originalFilename: string | null;
    publicUrl: string | null;
  }[];
}
