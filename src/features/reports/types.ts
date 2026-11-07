export type DatePresetKey = "today" | "last7days" | "last30days" | "thisMonth" | "custom";

export interface ClickReportParams {
  from: string; // ISO string UTC
  to: string; // ISO string UTC
  pageId?: string | null;
  linkId?: string | null;
  timezone?: string;
}

export interface ClickByDateItem {
  date: string; // YYYY-MM-DD in Vietnam timezone
  clicks: number;
}

export interface ClickByPageItem {
  page_id: string;
  internal_name: string;
  slug: string | null;
  clicks: number;
}

export interface ClickByLinkItem {
  link_id: string;
  label: string;
  target_url: string;
  kind: string;
  clicks: number;
}

export interface ClickByPlacementItem {
  page_link_id: string;
  page_id: string;
  page_name: string;
  link_id: string;
  label: string;
  target_url: string;
  position: number | null;
  clicks: number;
}

export interface ClickReportDTO {
  total_clicks: number;
  timezone: string;
  from: string;
  to: string;
  by_date: ClickByDateItem[];
  by_page: ClickByPageItem[];
  by_link: ClickByLinkItem[];
  by_placement: ClickByPlacementItem[];
}

export interface ReportFilterOptions {
  pages: Array<{
    id: string;
    internalName: string;
    slug: string | null;
    isArchived: boolean;
  }>;
  links: Array<{
    id: string;
    label: string;
    targetUrl: string;
    kind: string;
    isActive: boolean;
  }>;
}
