import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface DashboardSummary {
  publishedPagesCount: number;
  pagesSummaryText: string;
  totalLinksCount: number;
  linksSummaryText: string;
  totalClicksCount: number;
  clicksSummaryText: string;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createSupabaseServerClient();

  const [pagesRes, linksRes, clicksCountRes, clickEventsRes] = await Promise.all([
    supabase
      .from("pages")
      .select("id, internal_name, status, page_slugs(slug, is_current)")
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("links")
      .select("id, default_label, is_active")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("click_events")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("click_events")
      .select("page_id")
      .limit(200),
  ]);

  const pages = pagesRes.data || [];
  const links = linksRes.data || [];
  const totalClicks = clicksCountRes.count ?? 0;
  const clickEvents = clickEventsRes.data || [];

  // 1. Pages summary
  const publishedPages = pages.filter((p) => p.status === "published");
  const publishedPagesCount = publishedPages.length;

  let pagesSummaryText = "Chưa có trang nào được xuất bản";
  if (publishedPagesCount > 0) {
    const slugLabels = publishedPages.map((p) => {
      const slugs = Array.isArray(p.page_slugs) ? p.page_slugs : [];
      const cur = slugs.find((s) => s.is_current)?.slug || slugs[0]?.slug;
      return cur ? `/${cur}` : p.internal_name;
    });
    pagesSummaryText = slugLabels.slice(0, 3).join(", ") + (slugLabels.length > 3 ? "..." : "");
  } else if (pages.length > 0) {
    pagesSummaryText = `${pages.length} trang nháp (chưa xuất bản)`;
  }

  // 2. Links summary
  const totalLinksCount = links.length;
  let linksSummaryText = "Kho liên kết đang trống";
  if (totalLinksCount > 0) {
    const labels = links.slice(0, 4).map((l) => l.default_label);
    linksSummaryText = labels.join(", ") + (totalLinksCount > 4 ? "..." : "");
  }

  // 3. Clicks summary
  const totalClicksCount = totalClicks;
  let clicksSummaryText = "Chưa ghi nhận lượt click nào";
  if (totalClicksCount > 0) {
    const countByPage: Record<string, number> = {};
    for (const c of clickEvents) {
      if (c.page_id) {
        countByPage[c.page_id] = (countByPage[c.page_id] || 0) + 1;
      }
    }
    const pageEntries = Object.entries(countByPage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    if (pageEntries.length > 0) {
      const pageSlugMap = new Map<string, string>();
      for (const p of pages) {
        const slugs = Array.isArray(p.page_slugs) ? p.page_slugs : [];
        const cur = slugs.find((s) => s.is_current)?.slug || slugs[0]?.slug;
        pageSlugMap.set(p.id, cur ? `/${cur}` : p.internal_name);
      }

      const breakdown = pageEntries
        .map(([pid, cnt]) => `${cnt} click (${pageSlugMap.get(pid) || "trang"})`)
        .join(" + ");

      clicksSummaryText = breakdown || `${totalClicksCount.toLocaleString("vi-VN")} lượt click hợp lệ`;
    } else {
      clicksSummaryText = `${totalClicksCount.toLocaleString("vi-VN")} lượt click hợp lệ`;
    }
  }

  return {
    publishedPagesCount,
    pagesSummaryText,
    totalLinksCount,
    linksSummaryText,
    totalClicksCount,
    clicksSummaryText,
  };
}

export async function getPrimaryPublicSlug(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("pages")
    .select("page_slugs(slug, is_current)")
    .eq("status", "published")
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.page_slugs) return null;
  const slugs = Array.isArray(data.page_slugs) ? data.page_slugs : [data.page_slugs];
  const cur = slugs.find((s) => s.is_current)?.slug || slugs[0]?.slug;
  return cur ? cur : null;
}
