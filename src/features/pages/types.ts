import type { ThemePreset } from "@/config/themes";
import type { FontId, ThemeOverrides } from "@/config/theme-tokens";
import type { PublicSiteShell } from "@/features/public/types";
import type { PublicBranchItem } from "@/features/branches/types";

export type PageStatus = "published" | "unpublished";
export type PageKind = "profile" | "landing";
export type RevisionState = "draft" | "sealed";

export type BlockType =
  | "header"
  | "image"
  | "heading"
  | "text"
  | "link_list"
  | "social_icons"
  | "spacer"
  | "divider"
  | "button"
  | "gallery"
  | "menu_card"
  | "accordion"
  | "video_embed"
  | "map"
  | "hero_section"
  | "toc_bar"
  | "stats_strip"
  | "split_content"
  | "info_cards"
  | "pricing_table"
  | "product_grid"
  | "store_locator"
  | "lead_form"
  | "banner_slider"
  | "testimonials"
  | "cta_banner";

export interface BannerSlideItem {
  mediaId?: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface BannerSliderBlockPayload {
  anchorId?: string;
  autoPlaySec?: number;
  slides?: BannerSlideItem[];
}

export interface TestimonialItem {
  author: string;
  role?: string;
  quote: string;
  rating?: number;
  mediaId?: string;
  avatarUrl?: string;
}

export interface TestimonialsBlockPayload {
  anchorId?: string;
  title?: string;
  subtitle?: string;
  columns?: 2 | 3;
  items?: TestimonialItem[];
}

export interface CtaBannerBlockPayload {
  anchorId?: string;
  tone?: "dark" | "gold" | "cream";
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
}

export interface LeadFormCustomField {
  id: string;
  label: string;
  type: "text" | "select" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface LeadFormBlockPayload {
  anchorId?: string;
  formName?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  successMessage?: string;
  redirectUrl?: string;
  fullNameLabel?: string;
  fullNamePlaceholder?: string;
  phoneLabel?: string;
  phonePlaceholder?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  noteLabel?: string;
  showEmail?: boolean;
  showNote?: boolean;
  notePlaceholder?: string;
  popupDelaySec?: number;
  customFields?: LeadFormCustomField[];
}

export interface StoreLocatorBlockPayload {
  anchorId?: string;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showDistrictFilter?: boolean;
  defaultZoom?: number;
  pinIconUrl?: string;
  mapStyle?: "standard" | "satellite" | "hybrid";
}

export interface HeroSectionBlockPayload {
  layout?: "split" | "centered" | "full-bg";
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  mediaId?: string;
  imageUrl?: string;
  videoUrl?: string;
  overlayOpacity?: number;
  height?: "compact" | "default" | "tall";
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  anchorId?: string;
}

export interface TocBarItem {
  label: string;
  anchorId: string;
}

export interface TocBarBlockPayload {
  title?: string;
  sticky?: boolean;
  items?: TocBarItem[];
}

export interface StatsStripItem {
  value: string;
  label: string;
  sublabel?: string;
}

export interface StatsStripBlockPayload {
  anchorId?: string;
  columns?: 3 | 4;
  items?: StatsStripItem[];
}

export interface SplitContentBlockPayload {
  anchorId?: string;
  imagePosition?: "left" | "right";
  eyebrow?: string;
  title?: string;
  content?: string;
  mediaId?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface InfoCardItem {
  badge?: string;
  title: string;
  description?: string;
}

export interface InfoCardsBlockPayload {
  anchorId?: string;
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  variant?: "card" | "steps";
  items?: InfoCardItem[];
}

export interface PricingTableRow {
  name: string;
  subtitle?: string;
  description?: string;
  prices: string[];
  highlight?: boolean;
}

export interface PricingTableBlockPayload {
  anchorId?: string;
  title?: string;
  effectiveNote?: string;
  columns?: string[];
  rows?: PricingTableRow[];
}

export interface ProductGridItem {
  name: string;
  category?: string;
  price?: string;
  description?: string;
  badge?: string;
  mediaId?: string;
  imageUrl?: string;
  buyUrl?: string;
}

export interface ProductGridBlockPayload {
  anchorId?: string;
  title?: string;
  subtitle?: string;
  categories?: string[];
  items?: ProductGridItem[];
}

/** Style riêng của từng khối, lưu trong `payload.blockStyle` (mọi giá trị đều thuộc whitelist). */
export interface BlockStyle {
  align?: "left" | "center" | "right";
  paddingY?: "none" | "sm" | "md" | "lg";
  paddingTop?: "none" | "sm" | "md" | "lg" | "xl";
  paddingBottom?: "none" | "sm" | "md" | "lg" | "xl";
  maxWidth?: "sm" | "md" | "lg" | "full";
  surface?: "none" | "card" | "cream" | "dark";
  bgColor?: string;
  bgGradientFrom?: string;
  bgGradientTo?: string;
  bgGradientDir?: "to-r" | "to-br" | "to-b";
  bgImageUrl?: string;
  bgOverlayOpacity?: number;
  radius?: "none" | "md" | "xl" | "2xl" | "3xl";
  borderWidth?: 0 | 1 | 2;
  borderColor?: string;
  shadow?: "none" | "sm" | "md" | "lg";
  animation?: "none" | "fade-up" | "fade-in" | "zoom-in" | "slide-left";
  fontSize?: "sm" | "md" | "lg" | "xl";
  titleFontSize?: number;
  bodyFontSize?: number;
  titleFont?: FontId;
  bodyFont?: FontId;
  titleColor?: string;
  bodyColor?: string;
  buttonHeight?: number;
  anchorId?: string;
  hideOn?: ("mobile" | "desktop")[];
}

export interface ButtonBlockPayload {
  subtitle?: string;
  size?: "md" | "lg";
  emphasis?: "accent" | "surface";
  /** Màu nền và màu chữ tuỳ chỉnh riêng cho nút (để trống = theo theme). */
  customBg?: string;
  customText?: string;
  /** Số điện thoại hoặc link zalo.me riêng cho nút SĐT (để trống = dùng chính số tel:). */
  zaloTarget?: string;
}

export interface GalleryImageItem {
  mediaId?: string;
  url?: string;
  alt?: string;
}

export interface GalleryBlockPayload {
  images?: GalleryImageItem[];
  layout?: "grid" | "carousel";
  columns?: 2 | 3;
}

export interface MenuCardItem {
  name: string;
  price?: string;
  description?: string;
  badge?: string;
  mediaId?: string;
  imageUrl?: string;
}

export interface MenuCardBlockPayload {
  title?: string;
  items?: MenuCardItem[];
  layout?: "list" | "grid";
}

export interface AccordionItem {
  title: string;
  content: string;
}

export interface AccordionBlockPayload {
  items?: AccordionItem[];
}

export interface VideoEmbedBlockPayload {
  url?: string;
  caption?: string;
}

export interface MapBlockPayload {
  address?: string;
  label?: string;
  mapsUrl?: string;
  showMap?: boolean;
}

export interface HeaderBlockPayload {
  title: string;
  bio?: string;
  avatarMediaId?: string;
  avatarUrl?: string;
  bannerMediaId?: string;
  bannerUrl?: string;
}

export interface ImageBlockPayload {
  mediaAssetId?: string;
  imageUrl?: string;
  alt?: string;
  caption?: string;
  targetUrl?: string;
}

export interface HeadingBlockPayload {
  text: string;
  level: 1 | 2 | 3;
}

export interface TextBlockPayload {
  content: string;
  align?: "left" | "center" | "right";
}

export interface LinkButtonColorOverride {
  bg?: string;
  text?: string;
}

export interface LinkListBlockPayload {
  layout?: "stack" | "grid" | "split";
  /** Bản đồ targetUrl (`tel:...`) -> số hoặc link zalo.me riêng. */
  zaloByTel?: Record<string, string>;
  /** Bản đồ targetUrl -> màu nền / màu chữ riêng cho từng nút trong khối. */
  buttonColors?: Record<string, LinkButtonColorOverride>;
  /** Bản đồ targetUrl -> chữ hiển thị bên phải (màu nhấn) khi dùng bố cục "split" (Hai bên). */
  rightTextByUrl?: Record<string, string>;
}

export interface SocialIconsBlockPayload {
  style?: "colored" | "monochrome" | "outline";
}

export interface SpacerBlockPayload {
  height: "sm" | "md" | "lg" | "xl";
}

export interface DividerBlockPayload {
  style: "solid" | "dashed" | "dotted";
}

export type BlockPayload =
  | HeaderBlockPayload
  | ImageBlockPayload
  | HeadingBlockPayload
  | TextBlockPayload
  | LinkListBlockPayload
  | SocialIconsBlockPayload
  | SpacerBlockPayload
  | DividerBlockPayload
  | Record<string, unknown>;

export interface LinkPlacementItem {
  id: string; // Placement ID (can be temporary for new items)
  pageLinkId?: string;
  linkId: string;
  position: number;
  labelOverride?: string | null;
  mediaOverrideId?: string | null;
  mediaOverrideUrl?: string | null;
  // Resolved info from default link
  defaultLabel: string;
  defaultUrl: string;
  defaultKind: "standard" | "social" | "contact";
  defaultMediaUrl?: string | null;
}

export interface EditorBlockItem {
  id: string;
  type: BlockType;
  position: number;
  isVisible: boolean;
  payload: BlockPayload;
  placements?: LinkPlacementItem[]; // for link_list and social_icons
}

export interface PageThemeConfig {
  preset: string;
  /** v1: ghi đè dạng phẳng (vẫn được đọc và tự chuyển sang token). */
  custom?: Partial<ThemePreset>;
  /** v2: ghi đè theo nhóm token, xem `src/config/theme-tokens.ts`. */
  version?: 2;
  overrides?: ThemeOverrides;
}

export interface PageSeoConfig {
  metaTitle?: string;
  metaDescription?: string;
  ogImageMediaId?: string;
  ogImageUrl?: string;
  /** Bật/tắt nhãn thương hiệu ở cuối trang (mặc định true). */
  showFooterBadge?: boolean;
  /** Nội dung nhãn thương hiệu ở cuối trang (để trống = mặc định "GỜ CAFÉ"). */
  footerBadgeText?: string;
  /** Riêng Landing Page: bật/tắt thanh Menu & Footer dùng chung của Website (mặc định true). */
  showSiteShell?: boolean;
}

export interface PageListItem {
  id: string;
  internalName: string;
  pageKind: PageKind;
  status: PageStatus;
  lockVersion: number;
  primarySlug: string;
  aliases: string[];
  publishedRevisionNo: number | null;
  hasDraft: boolean;
  linksCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface PageSlugItem {
  id: string;
  slug: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface PageEditorData {
  page: {
    id: string;
    internalName: string;
    pageKind: PageKind;
    siteShellId?: string | null;
    status: PageStatus;
    lockVersion: number;
    publishedRevisionId: string | null;
    updatedAt: string;
  };
  primarySlug: string;
  aliases: string[];
  draftRevision: {
    id: string;
    revisionNo: number;
    state: RevisionState;
    lockVersion: number;
    title: string;
    description: string | null;
    theme: PageThemeConfig;
    seo: PageSeoConfig;
  };
  blocks: EditorBlockItem[];
  availableLinks: {
    id: string;
    defaultLabel: string;
    targetUrl: string;
    kind: "standard" | "social" | "contact";
    defaultMediaId: string | null;
    defaultMediaUrl?: string | null;
    isActive: boolean;
  }[];
  /** false với viewer: editor chỉ xem, không lưu / xuất bản được. */
  canEdit: boolean;
  availableMedia: {
    id: string;
    originalFilename: string | null;
    publicUrl: string | null;
  }[];
  /** Dữ liệu Site Shell (Header/Menu 2 cấp/Footer/Nút nổi) để mô phỏng trực tiếp trong LivePreview của Landing Page. */
  siteShell?: PublicSiteShell | null;
  /** Danh sách các bộ Menu / Site Shell trong workspace để chọn gán riêng cho từng Landing Page. */
  availableShells?: { id: string; name: string; isDefault: boolean }[];
  /** Danh sách chi nhánh đang mở của workspace để mô phỏng khối store_locator trong LivePreview. */
  branches?: PublicBranchItem[];
}
