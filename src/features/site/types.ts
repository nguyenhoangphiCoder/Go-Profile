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
export type SiteNavMaxWidth = "compact" | "default" | "wide" | "full";
export type SiteNavBgMode = "solid-color" | "gradient";
export type SiteNavBlur = "none" | "sm" | "md" | "lg";
export type SiteNavLetterSpacing = "normal" | "wide" | "wider";
export type SiteDropdownRadius = "md" | "xl" | "2xl";
export type SiteMobileDrawerSide = "right" | "left" | "full";
export type SiteCtaRadius = "md" | "xl" | "full";
export type SiteCtaIcon =
  "none" | "arrow-right" | "phone" | "sparkles" | "calendar" | "shopping-bag" | "message";
export type SiteCtaSize = "sm" | "md" | "lg";
export type SiteCtaSecondaryStyle = "outline" | "ghost" | "soft";
export type SiteAnnouncementMode = "static" | "marquee";

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
  navMaxWidth?: SiteNavMaxWidth;
  navHeight?: SiteNavHeight;
  logoHeight?: number;
  navGap?: SiteNavGap;
  // Kiểu chữ, Hiệu ứng & Active
  navFont?: FontId;
  navFontSize?: number;
  navUppercase?: boolean;
  navLetterSpacing?: SiteNavLetterSpacing;
  navWeight?: SiteNavWeight;
  navActiveStyle?: SiteNavActiveStyle;
  navBackdrop?: SiteNavBackdrop;
  navBgMode?: SiteNavBgMode;
  navBgGradientEnd?: string;
  navBgGradientAngle?: 90 | 135 | 180;
  navBgOpacity?: number;
  navBlur?: SiteNavBlur;
  navShadow?: SiteNavShadow;
  navBorder?: boolean;
  navBgColor?: string;
  navTextColor?: string;
  navActiveColor?: string;
  navHoverColor?: string;
  dropdownRadius?: SiteDropdownRadius;
  mobileDrawerSide?: SiteMobileDrawerSide;
  mobileDrawerShowContact?: boolean;
  // Nút CTA phải (Chính + Phụ)
  ctaEnabled?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  ctaBgColor?: string;
  ctaTextColor?: string;
  ctaRadius?: SiteCtaRadius;
  ctaIcon?: SiteCtaIcon;
  ctaSize?: SiteCtaSize;
  ctaShowOnMobile?: boolean;
  ctaSecondaryEnabled?: boolean;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  ctaSecondaryStyle?: SiteCtaSecondaryStyle;
  // Thanh thông báo trên cùng (Announcement Bar)
  announcementEnabled?: boolean;
  announcementBadge?: string;
  announcementText?: string;
  announcementHref?: string;
  announcementBgColor?: string;
  announcementBgGradientEnd?: string;
  announcementTextColor?: string;
  announcementFontSize?: number;
  announcementDismissible?: boolean;
  announcementMode?: SiteAnnouncementMode;
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

export type SiteFloatingButtonIcon =
  | "phone"
  | "zalo"
  | "messenger"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "shopee"
  | "youtube"
  | "maps"
  | "calendar"
  | "shopping-bag"
  | "link";

export interface SiteFloatingCustomButton {
  id: string;
  label: string;
  href: string;
  icon: SiteFloatingButtonIcon;
  imageUrl?: string;
  bgColor?: string;
  textColor?: string;
}

export type SiteFloatingStyle = "icon" | "pill" | "bottom-bar" | "speed-dial";
export type SiteFloatingSize = "sm" | "md" | "lg";
export type SiteFloatingVisibility = "all" | "mobile-only" | "desktop-only";

export interface SiteFloatingContactConfig {
  enabled?: boolean;
  position?: "right" | "left";
  style?: SiteFloatingStyle;
  size?: SiteFloatingSize;
  visibility?: SiteFloatingVisibility;
  bottomOffset?: number;
  sideOffset?: number;
  pulseCall?: boolean;
  showBackToTop?: boolean;
  showCall?: boolean;
  phone?: string;
  callLabel?: string;
  callIconUrl?: string;
  callBgColor?: string;
  callTextColor?: string;
  showZalo?: boolean;
  zaloUrl?: string;
  zaloLabel?: string;
  zaloIconUrl?: string;
  zaloBgColor?: string;
  zaloTextColor?: string;
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
