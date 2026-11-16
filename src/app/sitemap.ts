import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env.client";
import { getPublishedPages } from "@/features/public/sitemap-data";

/** sitemap.xml: các trang công khai đang xuất bản (slug chính, không gồm alias). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const pages = await getPublishedPages();

  return pages.map((page) => ({
    url: `${base}/${encodeURIComponent(page.slug)}`,
    lastModified: new Date(page.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));
}
