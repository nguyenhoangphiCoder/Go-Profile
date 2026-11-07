import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveAdmin } from "@/features/auth/queries";
import { VIETNAM_TIMEZONE } from "./timezone";
import type { ClickReportDTO, ClickReportParams, ReportFilterOptions } from "./types";

export async function getClickReport(params: ClickReportParams): Promise<ClickReportDTO> {
  await requireActiveAdmin();
  const supabase = await createSupabaseServerClient();

  const rpcArgs = {
    p_from: params.from,
    p_to: params.to,
    p_page_id: params.pageId || undefined,
    p_link_id: params.linkId || undefined,
    p_timezone: params.timezone || VIETNAM_TIMEZONE,
  };

  const { data, error } = await supabase.rpc("get_click_report", rpcArgs);

  if (error) {
    console.error("Lỗi khi truy vấn báo cáo get_click_report:", error);
    throw new Error(`Không thể tải dữ liệu báo cáo: ${error.message}`);
  }

  const raw = data as Record<string, unknown> | null;

  return {
    total_clicks: Number(raw?.total_clicks ?? 0),
    timezone: String(raw?.timezone ?? VIETNAM_TIMEZONE),
    from: String(raw?.from ?? params.from),
    to: String(raw?.to ?? params.to),
    by_date: Array.isArray(raw?.by_date)
      ? raw.by_date.map((item) => ({
          date: String(item.date),
          clicks: Number(item.clicks ?? 0),
        }))
      : [],
    by_page: Array.isArray(raw?.by_page)
      ? raw.by_page.map((item) => ({
          page_id: String(item.page_id),
          internal_name: String(item.internal_name ?? "Trang không tên"),
          slug: item.slug ? String(item.slug) : null,
          clicks: Number(item.clicks ?? 0),
        }))
      : [],
    by_link: Array.isArray(raw?.by_link)
      ? raw.by_link.map((item) => ({
          link_id: String(item.link_id),
          label: String(item.label ?? "Liên kết không tên"),
          target_url: String(item.target_url ?? ""),
          kind: String(item.kind ?? "custom"),
          clicks: Number(item.clicks ?? 0),
        }))
      : [],
    by_placement: Array.isArray(raw?.by_placement)
      ? raw.by_placement.map((item) => ({
          page_link_id: String(item.page_link_id),
          page_id: String(item.page_id),
          page_name: String(item.page_name ?? "Trang không tên"),
          link_id: String(item.link_id),
          label: String(item.label ?? "Liên kết"),
          target_url: String(item.target_url ?? ""),
          position:
            item.position !== null && item.position !== undefined ? Number(item.position) : null,
          clicks: Number(item.clicks ?? 0),
        }))
      : [],
  };
}

export async function getReportFilterOptions(): Promise<ReportFilterOptions> {
  await requireActiveAdmin();
  const supabase = await createSupabaseServerClient();

  const [pagesRes, linksRes] = await Promise.all([
    supabase
      .from("pages")
      .select("id, internal_name, archived_at, page_slugs(slug, is_current)")
      .order("internal_name", { ascending: true }),
    supabase
      .from("links")
      .select("id, default_label, target_url, kind, is_active, archived_at")
      .order("default_label", { ascending: true }),
  ]);

  if (pagesRes.error) {
    console.error("Lỗi khi tải danh sách trang cho bộ lọc báo cáo:", pagesRes.error);
    throw new Error("Không thể tải danh sách trang cho bộ lọc");
  }

  if (linksRes.error) {
    console.error("Lỗi khi tải danh sách link cho bộ lọc báo cáo:", linksRes.error);
    throw new Error("Không thể tải danh sách liên kết cho bộ lọc");
  }

  const pages = (pagesRes.data || []).map((p) => {
    const primarySlug = Array.isArray(p.page_slugs)
      ? (p.page_slugs.find((s) => s.is_current)?.slug ?? null)
      : null;
    return {
      id: p.id,
      internalName: p.internal_name,
      slug: primarySlug,
      isArchived: !!p.archived_at,
    };
  });

  const links = (linksRes.data || []).map((l) => ({
    id: l.id,
    label: l.default_label,
    targetUrl: l.target_url,
    kind: l.kind,
    isActive: l.is_active,
  }));

  return { pages, links };
}
