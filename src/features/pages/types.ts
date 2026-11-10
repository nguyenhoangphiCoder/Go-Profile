import type { ThemePreset } from "@/config/themes";

export type PageStatus = "published" | "unpublished";
export type RevisionState = "draft" | "sealed";

export type BlockType =
  "header" | "image" | "heading" | "text" | "link_list" | "social_icons" | "spacer" | "divider";

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

export interface LinkListBlockPayload {
  layout?: "stack" | "grid";
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
  custom?: Partial<ThemePreset>;
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
  availableMedia: {
    id: string;
    originalFilename: string | null;
    publicUrl: string | null;
  }[];
}
