import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveAdmin } from "@/features/auth/queries";
import { VIETNAM_TIMEZONE } from "./timezone";
import type { ClickReportDTO, ClickReportParams, ReportFilterOptions } from "./types";

function formatToDateStr(isoString: string, timeZone: string = VIETNAM_TIMEZONE): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function queryClickReportDirectly(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  params: ClickReportParams
): Promise<ClickReportDTO> {
  const tz = params.timezone || VIETNAM_TIMEZONE;

  let clicksQuery = supabase
    .from("click_events")
    .select("id, page_id, link_id, page_link_id, revision_id, occurred_at")
    .gte("occurred_at", params.from)
    .lt("occurred_at", params.to);

  if (params.pageId) clicksQuery = clicksQuery.eq("page_id", params.pageId);
  if (params.linkId) clicksQuery = clicksQuery.eq("link_id", params.linkId);

  const [clicksRes, pagesRes, linksRes, placementsRes] = await Promise.all([
    clicksQuery,
    supabase.from("pages").select("id, internal_name, page_slugs(slug, is_current)"),
    supabase.from("links").select("id, default_label, target_url, kind"),
    supabase.from("revision_link_placements").select("revision_id, page_link_id, position, resolved_label"),
  ]);

  if (clicksRes.error) {
    throw new Error(`Không thể tải dữ liệu click: ${clicksRes.error.message}`);
  }

  const clicks = clicksRes.data || [];
  const pages = pagesRes.data || [];
  const links = linksRes.data || [];
  const placements = placementsRes.data || [];

  // 1. by_date
  const dateCounts: Record<string, number> = {};
  for (const c of clicks) {
    const d = formatToDateStr(c.occurred_at, tz);
    dateCounts[d] = (dateCounts[d] || 0) + 1;
  }
  const by_date = Object.entries(dateCounts)
    .map(([date, count]) => ({ date, clicks: count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 2. by_page
  const pageClickCounts: Record<string, number> = {};
  for (const c of clicks) {
    pageClickCounts[c.page_id] = (pageClickCounts[c.page_id] || 0) + 1;
  }
  const filteredPages = params.pageId ? pages.filter((p) => p.id === params.pageId) : pages;
  const by_page = filteredPages
    .map((p) => {
      const slug = Array.isArray(p.page_slugs)
        ? (p.page_slugs.find((s) => s.is_current)?.slug ?? null)
        : null;
      return {
        page_id: p.id,
        internal_name: p.internal_name,
        slug,
        clicks: pageClickCounts[p.id] || 0,
      };
    })
    .sort((a, b) => b.clicks - a.clicks || a.internal_name.localeCompare(b.internal_name));

  // 3. by_link
  const linkClickCounts: Record<string, number> = {};
  for (const c of clicks) {
    linkClickCounts[c.link_id] = (linkClickCounts[c.link_id] || 0) + 1;
  }
  const filteredLinks = params.linkId ? links.filter((l) => l.id === params.linkId) : links;
  const by_link = filteredLinks
    .map((l) => ({
      link_id: l.id,
      label: l.default_label,
      target_url: l.target_url,
      kind: l.kind,
      clicks: linkClickCounts[l.id] || 0,
    }))
    .sort((a, b) => b.clicks - a.clicks || a.label.localeCompare(b.label));

  // 4. by_placement
  const pageMap = new Map(pages.map((p) => [p.id, p]));
  const linkMap = new Map(links.map((l) => [l.id, l]));
  const placementMap = new Map();
  for (const pl of placements) {
    placementMap.set(`${pl.revision_id}_${pl.page_link_id}`, pl);
  }

  const placementClickCounts: Record<string, ClickReportDTO["by_placement"][number]> = {};
  for (const c of clicks) {
    const key = `${c.page_link_id}_${c.page_id}_${c.link_id}`;
    if (!placementClickCounts[key]) {
      const p = pageMap.get(c.page_id);
      const l = linkMap.get(c.link_id);
      const pl = placementMap.get(`${c.revision_id}_${c.page_link_id}`);
      placementClickCounts[key] = {
        page_link_id: c.page_link_id,
        page_id: c.page_id,
        page_name: p?.internal_name || "Trang không tên",
        link_id: c.link_id,
        label: pl?.resolved_label || l?.default_label || "Liên kết",
        target_url: l?.target_url || "",
        position: pl?.position !== undefined ? Number(pl.position) : null,
        clicks: 0,
      };
    }
    placementClickCounts[key].clicks += 1;
  }
  const by_placement = Object.values(placementClickCounts).sort((a, b) => b.clicks - a.clicks);

  return {
    total_clicks: clicks.length,
    timezone: tz,
    from: params.from,
    to: params.to,
    by_date,
    by_page,
    by_link,
    by_placement,
  };
}

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
    console.warn("RPC get_click_report gặp lỗi (chuyển sang query trực tiếp an toàn):", error.message);
    try {
      return await queryClickReportDirectly(supabase, params);
    } catch {
      throw new Error(`Không thể tải dữ liệu báo cáo: ${error.message}`);
    }
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
