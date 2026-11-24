import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import { fetchPublicPage } from "@/features/public/queries";
import { fetchPublicBranches } from "@/features/branches/queries";
import { PublicPageView } from "@/features/public/components/public-page-view";
import { resolveTenantHomeSlugByHost } from "@/features/workspace/domains";

export const instant = false;

async function resolveDefaultHomeSlug(): Promise<string | null> {
  try {
    const service = createSupabaseAdminClient();
    const { data } = await service
      .from("site_shells")
      .select("header_config")
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(10);

    for (const row of data || []) {
      const cfg = (row.header_config || {}) as { homePageSlug?: string };
      const slug = cfg.homePageSlug?.trim().toLowerCase();
      if (slug && /^[a-z0-9-]+$/.test(slug)) {
        return slug;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveHomeSlugForCurrentRequest(): Promise<string | null> {
  try {
    const hdrs = await headers();
    const host = hdrs.get("x-forwarded-host") || hdrs.get("host");
    const tenantSlug = await resolveTenantHomeSlugByHost(host);
    if (tenantSlug) return tenantSlug;
  } catch {
    // Fallback an toàn nếu headers() không khả dụng trong môi trường đặc biệt
  }
  return resolveDefaultHomeSlug();
}

export async function generateMetadata(): Promise<Metadata> {
  const homeSlug = await resolveHomeSlugForCurrentRequest();
  if (!homeSlug) {
    return { title: "Gờ Café" };
  }
  const page = await fetchPublicPage(homeSlug);
  if (!page.found || page.is_alias) {
    return { title: "Gờ Café" };
  }
  const title = page.seo?.metaTitle || page.title || "Gờ Café";
  const description =
    page.seo?.metaDescription ||
    page.description ||
    "Hệ thống thông tin và website chính thức của Gờ Café";
  const ogImageUrl = page.seo?.ogImageUrl || undefined;
  const siteBrandName = page.site_shell?.settings?.site_name?.trim() || title;
  const faviconUrl = (
    page.site_shell?.settings?.header_config as { faviconUrl?: string } | undefined
  )?.faviconUrl?.trim();
  return {
    title,
    description,
    icons: faviconUrl ? { icon: faviconUrl } : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      url: "/",
      siteName: siteBrandName,
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
    },
  };
}

export default async function HomePage() {
  const homeSlug = await resolveHomeSlugForCurrentRequest();
  if (homeSlug) {
    const page = await fetchPublicPage(homeSlug);
    if (page.found && !page.is_alias) {
      const hasStoreLocator = (page.blocks || []).some((b) => b.type === "store_locator");
      const branches =
        hasStoreLocator && page.workspace_id
          ? await fetchPublicBranches(page.workspace_id)
          : undefined;
      return <PublicPageView page={page} branches={branches} />;
    }
  }
  redirect("/login");
}
