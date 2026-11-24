import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireWorkspace } from "@/features/workspace/context";
import type { LeadItem, LeadStatus } from "./types";

interface LeadQueryRow {
  id: string;
  page_id: string | null;
  form_name: string;
  full_name: string;
  phone: string;
  email: string | null;
  note: string | null;
  status: LeadStatus;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  updated_at: string;
  pages: {
    internal_name: string;
    page_slugs: { slug: string; is_current: boolean }[];
  } | null;
}

export async function getLeadsList(): Promise<LeadItem[]> {
  const { workspace } = await requireWorkspace();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .select(
      `
      id,
      page_id,
      form_name,
      full_name,
      phone,
      email,
      note,
      status,
      utm_source,
      utm_medium,
      utm_campaign,
      created_at,
      updated_at,
      pages (
        internal_name,
        page_slugs (
          slug,
          is_current
        )
      )
    `
    )
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Lỗi tải danh sách leads:", error.message || error);
    return [];
  }

  return ((data || []) as unknown as LeadQueryRow[]).map((row) => {
    const primarySlug =
      (row.pages?.page_slugs || []).find((s) => s.is_current)?.slug ??
      row.pages?.page_slugs?.[0]?.slug ??
      null;
    return {
      id: row.id,
      pageId: row.page_id,
      pageName: row.pages?.internal_name ?? null,
      pageSlug: primarySlug,
      formName: row.form_name,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email,
      note: row.note,
      status: row.status,
      utmSource: row.utm_source,
      utmMedium: row.utm_medium,
      utmCampaign: row.utm_campaign,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export interface LeadsReportSummary {
  total: number;
  byStatus: { new: number; contacted: number; converted: number; spam: number };
  conversionRatePct: number;
  byPage: { pageName: string; pageSlug: string | null; total: number; converted: number }[];
  byForm: { formName: string; total: number; converted: number }[];
}

export async function getLeadsReportSummary(params: {
  from: string;
  to: string;
  pageId?: string;
}): Promise<LeadsReportSummary> {
  const { workspace } = await requireWorkspace();
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("leads")
    .select("status, form_name, page_id, pages(internal_name, page_slugs(slug, is_current))")
    .eq("workspace_id", workspace.id)
    .gte("created_at", params.from)
    .lt("created_at", params.to);

  if (params.pageId) {
    query = query.eq("page_id", params.pageId);
  }

  const { data, error } = await query;
  const empty: LeadsReportSummary = {
    total: 0,
    byStatus: { new: 0, contacted: 0, converted: 0, spam: 0 },
    conversionRatePct: 0,
    byPage: [],
    byForm: [],
  };
  if (error || !data) return empty;

  const byStatus = { new: 0, contacted: 0, converted: 0, spam: 0 };
  const pageMap = new Map<
    string,
    { pageName: string; pageSlug: string | null; total: number; converted: number }
  >();
  const formMap = new Map<string, { formName: string; total: number; converted: number }>();

  for (const raw of data as unknown as LeadQueryRow[]) {
    byStatus[raw.status] += 1;
    const isConv = raw.status === "converted" ? 1 : 0;

    const pKey = raw.page_id || "_unknown";
    const primarySlug =
      (raw.pages?.page_slugs || []).find((s) => s.is_current)?.slug ??
      raw.pages?.page_slugs?.[0]?.slug ??
      null;
    const pEntry = pageMap.get(pKey) || {
      pageName: raw.pages?.internal_name || "Trang không xác định",
      pageSlug: primarySlug,
      total: 0,
      converted: 0,
    };
    pEntry.total += 1;
    pEntry.converted += isConv;
    pageMap.set(pKey, pEntry);

    const fName = raw.form_name || "Form liên hệ";
    const fEntry = formMap.get(fName) || { formName: fName, total: 0, converted: 0 };
    fEntry.total += 1;
    fEntry.converted += isConv;
    formMap.set(fName, fEntry);
  }

  const total = data.length;
  const nonSpam = total - byStatus.spam;
  const conversionRatePct =
    nonSpam > 0 ? Math.round((byStatus.converted / nonSpam) * 1000) / 10 : 0;

  return {
    total,
    byStatus,
    conversionRatePct,
    byPage: Array.from(pageMap.values()).sort((a, b) => b.total - a.total),
    byForm: Array.from(formMap.values()).sort((a, b) => b.total - a.total),
  };
}
