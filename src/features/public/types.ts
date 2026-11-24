import type { BlockType, PageKind, PageThemeConfig, PageSeoConfig } from "@/features/pages/types";

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
  type: BlockType;
  position: number;
  payload: Record<string, unknown>;
  links: PublicLinkItem[];
}

export interface PublicNavItem {
  id: string;
  parent_id: string | null;
  label: string;
  target_type: "page" | "anchor" | "url";
  target_slug?: string | null;
  target_value?: string | null;
  position: number;
}

export interface PublicSiteSettings {
  site_name?: string | null;
  logo_url?: string | null;
  header_config?: Record<string, unknown>;
  footer_columns?: unknown[];
  floating_contact?: Record<string, unknown>;
}

export interface PublicSiteShell {
  settings: PublicSiteSettings;
  nav_items: PublicNavItem[];
}

export interface PublicPageDTO {
  found: boolean;
  is_alias?: boolean;
  canonical_slug?: string;
  reason?: "SLUG_NOT_FOUND" | "PAGE_UNPUBLISHED" | "REVISION_NOT_SEALED" | string;
  workspace_id?: string;
  page_kind?: PageKind;
  slug?: string;
  title?: string;
  description?: string | null;
  theme?: PageThemeConfig;
  seo?: PageSeoConfig;
  blocks?: PublicBlockItem[];
  site_shell?: PublicSiteShell | null;
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
