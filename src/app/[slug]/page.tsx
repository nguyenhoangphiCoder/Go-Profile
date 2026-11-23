import { Metadata } from "next";
import { notFound, redirect, RedirectType } from "next/navigation";
import { isReservedSlug } from "@/config/reserved-slugs";
import { resolveLookupSlug } from "@/config/slug-aliases";
import { fetchPublicPage } from "@/features/public/queries";
import { SLUG_REGEX } from "@/features/pages/schemas";
import { PublicPageView } from "@/features/public/components/public-page-view";

export const instant = false;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

/** Slug sai định dạng (null byte, emoji, ký tự đặc biệt, quá dài) -> 404 ngay, không truy vấn DB. */
function isLookupableSlug(slug: string): boolean {
  return slug.length <= 80 && SLUG_REGEX.test(slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (isReservedSlug(slug)) {
    return { title: "Không tìm thấy trang" };
  }

  const normalized = slug.trim().toLowerCase();
  let page = isLookupableSlug(normalized)
    ? await fetchPublicPage(normalized)
    : { found: false as const };
  if (!page.found) {
    const aliasSlug = resolveLookupSlug(normalized);
    if (aliasSlug !== normalized && isLookupableSlug(aliasSlug)) {
      page = await fetchPublicPage(aliasSlug);
    }
  }

  if (!page.found || page.is_alias) {
    return { title: "Không tìm thấy trang | Gờ Cafe" };
  }

  const title = page.seo?.metaTitle || page.title || "Gờ Cafe Profile";
  const description =
    page.seo?.metaDescription ||
    page.description ||
    "Hệ thống thông tin liên kết và hồ sơ chính thức của Gờ Cafe";

  const ogImageUrl = page.seo?.ogImageUrl || (page.seo?.ogImageMediaId ? undefined : undefined);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/${page.slug || slug}`,
      siteName: "Gờ Cafe",
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

// Trường hợp không tồn tại / alias thường đã được proxy chặn trước (404 / 308 thật — xem
// src/lib/public-slug-gate.ts). Các nhánh dưới đây là lớp dự phòng khi proxy bỏ qua
// (ví dụ lỗi kết nối database lúc kiểm tra).
export default async function PublicSlugPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Chặn slug bảo lưu hệ thống
  if (isReservedSlug(slug)) {
    notFound();
  }

  // 2. Ưu tiên tra trực tiếp slug trong DB trước, không có mới fallback sang alias cứng
  const normalized = slug.trim().toLowerCase();
  if (isLookupableSlug(normalized)) {
    const directPage = await fetchPublicPage(normalized);
    if (directPage.found) {
      if (
        directPage.is_alias &&
        directPage.canonical_slug &&
        directPage.canonical_slug !== normalized
      ) {
        redirect(`/${directPage.canonical_slug}`, RedirectType.replace);
      }
      return <PublicPageView page={directPage} />;
    }
  }

  const aliasSlug = resolveLookupSlug(normalized);
  if (aliasSlug !== normalized && isLookupableSlug(aliasSlug)) {
    redirect(`/${aliasSlug}`, RedirectType.replace);
  }

  notFound();
}
