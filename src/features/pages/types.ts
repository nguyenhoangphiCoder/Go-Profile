import type { ThemePreset } from "@/config/themes";
import type { FontId, ThemeOverrides } from "@/config/theme-tokens";

export type PageStatus = "published" | "unpublished";
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
  | "map";

/** Style riêng của từng khối, lưu trong `payload.blockStyle` (mọi giá trị đều thuộc whitelist). */
export interface BlockStyle {
  align?: "left" | "center" | "right";
  paddingY?: "none" | "sm" | "md" | "lg";
  surface?: "none" | "card";
  animation?: "none" | "fade-up";
  fontSize?: "sm" | "md" | "lg" | "xl";
  titleFontSize?: number;
  bodyFontSize?: number;
  titleFont?: FontId;
  bodyFont?: FontId;
  titleColor?: string;
  bodyColor?: string;
  buttonHeight?: number;
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
}

export interface PageListItem {
  id: string;
  internalName: string;
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
}
