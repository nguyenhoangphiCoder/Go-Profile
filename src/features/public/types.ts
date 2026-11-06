import type { PageThemeConfig, PageSeoConfig } from "@/features/pages/types";

export interface PublicLinkItem {
  page_link_id: string;
  position: number;
  label: string;
  kind: "standard" | "social" | "contact";
  target_url: string;
  media_url?: string | null;
}

export interface PublicBlockItem {
  block_id: string;
  type:
    "header" | "image" | "heading" | "text" | "link_list" | "social_icons" | "spacer" | "divider";
  position: number;
  payload: Record<string, unknown>;
  links: PublicLinkItem[];
}

export interface PublicPageDTO {
  found: boolean;
  is_alias?: boolean;
  canonical_slug?: string;
  reason?: "SLUG_NOT_FOUND" | "PAGE_UNPUBLISHED" | "REVISION_NOT_SEALED" | string;
  slug?: string;
  title?: string;
  description?: string | null;
  theme?: PageThemeConfig;
  seo?: PageSeoConfig;
  blocks?: PublicBlockItem[];
}

export interface ResolveLinkResult {
  valid: boolean;
  reason?: string;
  page_id?: string;
  link_id?: string;
  revision_id?: string;
  target_url?: string;
  kind?: "standard" | "social" | "contact";
}

export interface RecordClickResult {
  success: boolean;
  idempotent?: boolean;
  error?: string;
}
