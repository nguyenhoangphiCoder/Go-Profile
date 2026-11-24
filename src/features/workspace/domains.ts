import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import { getDomainLookupCandidates } from "./domain-utils";

export interface WorkspaceDomainItem {
  id: string;
  workspaceId: string;
  workspaceName: string;
  domain: string;
  homePageId: string | null;
  homePageName: string | null;
  homePageSlug: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface WorkspacePageOption {
  id: string;
  workspaceId: string;
  name: string;
  slug: string | null;
  status: string;
}

/**
 * Danh sách toàn bộ Custom Domains + các trang đang hoạt động để SuperAdmin gán trang chủ.
 * Chỉ gọi SAU khi đã kiểm tra isPlatformAdmin.
 */
export async function getPlatformDomainsOverview(): Promise<{
  domains: WorkspaceDomainItem[];
  pages: WorkspacePageOption[];
}> {
  const db = createSupabaseAdminClient();
  const [domainsRes, wsRes, pagesRes, slugsRes] = await Promise.all([
    db
      .from("workspace_domains")
      .select("id, workspace_id, domain, home_page_id, is_active, created_at")
      .order("created_at", { ascending: false }),
    db.from("workspaces").select("id, name"),
    db
      .from("pages")
      .select("id, workspace_id, internal_name, status")
      .is("archived_at", null)
      .order("internal_name"),
    db.from("page_slugs").select("page_id, slug").eq("is_current", true),
  ]);

  const wsMap = new Map<string, string>((wsRes.data ?? []).map((w) => [w.id, w.name]));
  const slugByPage = new Map<string, string>((slugsRes.data ?? []).map((s) => [s.page_id, s.slug]));
  const pageMap = new Map<string, { name: string; slug: string | null }>();

  const pages: WorkspacePageOption[] = (pagesRes.data ?? []).map((p) => {
    const slug = slugByPage.get(p.id) ?? null;
    pageMap.set(p.id, { name: p.internal_name, slug });
    return {
      id: p.id,
      workspaceId: p.workspace_id,
      name: p.internal_name,
      slug,
      status: p.status,
    };
  });

  const domains: WorkspaceDomainItem[] = (domainsRes.data ?? []).map((d) => {
    const pageInfo = d.home_page_id ? pageMap.get(d.home_page_id) : undefined;
    return {
      id: d.id,
      workspaceId: d.workspace_id,
      workspaceName: wsMap.get(d.workspace_id) ?? "(Workspace đã xóa)",
      domain: d.domain,
      homePageId: d.home_page_id,
      homePageName: pageInfo?.name ?? null,
      homePageSlug: pageInfo?.slug ?? null,
      isActive: d.is_active,
      createdAt: d.created_at,
    };
  });

  return { domains, pages };
}

/**
 * Tra cứu slug trang chủ công khai theo Host header của request.
 * Trả về null nếu tên miền không nằm trong bảng workspace_domains (sẽ dùng fallback mặc định).
 */
export async function resolveTenantHomeSlugByHost(
  rawHost: string | null | undefined
): Promise<string | null> {
  const candidates = getDomainLookupCandidates(rawHost);
  if (candidates.length === 0) return null;

  try {
    const db = createSupabaseAdminClient();
    const { data: rows } = await db
      .from("workspace_domains")
      .select("workspace_id, domain, home_page_id")
      .in("domain", candidates)
      .eq("is_active", true);

    if (!rows || rows.length === 0) return null;

    // Ưu tiên khớp chính xác ứng viên đầu tiên
    const matched =
      candidates.map((c) => rows.find((r) => r.domain === c)).find(Boolean) ?? rows[0];

    // 1. Nếu đã gán cụ thể home_page_id -> lấy current slug của trang đó
    if (matched.home_page_id) {
      const { data: slugRow } = await db
        .from("page_slugs")
        .select("slug")
        .eq("page_id", matched.home_page_id)
        .eq("is_current", true)
        .maybeSingle();
      if (slugRow?.slug) return slugRow.slug;
    }

    // 2. Fallback sang homePageSlug trong Site Shell mặc định của workspace đó
    const { data: shells } = await db
      .from("site_shells")
      .select("header_config")
      .eq("workspace_id", matched.workspace_id)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(5);

    for (const sh of shells ?? []) {
      const cfg = (sh.header_config || {}) as { homePageSlug?: string };
      const slug = cfg.homePageSlug?.trim().toLowerCase();
      if (slug && /^[a-z0-9-]+$/.test(slug)) {
        return slug;
      }
    }

    // 3. Fallback cuối: trang published đầu tiên của workspace đó
    const { data: pubPage } = await db
      .from("pages")
      .select("id")
      .eq("workspace_id", matched.workspace_id)
      .eq("status", "published")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pubPage?.id) {
      const { data: slugRow } = await db
        .from("page_slugs")
        .select("slug")
        .eq("page_id", pubPage.id)
        .eq("is_current", true)
        .maybeSingle();
      if (slugRow?.slug) return slugRow.slug;
    }

    return null;
  } catch (err) {
    console.error("[domains] Lỗi tra cứu tenant theo host:", err);
    return null;
  }
}
