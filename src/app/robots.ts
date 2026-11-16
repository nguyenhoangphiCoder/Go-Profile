import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env.client";

/**
 * robots.txt: cho phép bot đọc trang công khai, chặn khu vực quản trị, đường chuyển hướng
 * ghi nhận click (/r/ — tránh bot làm sai số liệu click) và trang dữ liệu test.
 */
export default function robots(): MetadataRoute.Robots {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/auth/", "/api/", "/r/", "/e2e-fixtures/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
