import { Metadata } from "next";
import { notFound, redirect, RedirectType } from "next/navigation";
import { isReservedSlug } from "@/config/reserved-slugs";
import { fetchPublicPage } from "@/features/public/queries";
import { SLUG_REGEX } from "@/features/pages/schemas";
import { PublicPageView } from "@/features/public/components/public-page-view";

export const instant = false;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const SLUG_ALIASES: Record<string, string> = {
  "gocafe.official": "gocafe",
  "gocafe-official": "gocafe",
  "hophuonganh.gocafe": "hophuonganh-gocafe",
  "gogang.official": "gogang",
  gogang: "gogang",
};

function resolveLookupSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  return SLUG_ALIASES[normalized] || normalized;
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

  const lookupSlug = resolveLookupSlug(slug);
  if (!isLookupableSlug(lookupSlug)) {
    return { title: "Không tìm thấy trang | Gờ Cafe" };
  }
  const page = await fetchPublicPage(lookupSlug);

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

export default async function PublicSlugPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Chặn slug bảo lưu hệ thống
  if (isReservedSlug(slug)) {
    notFound();
  }

  // 2. Tra cứu dữ liệu trang công khai (hỗ trợ alias gocafe.official, hophuonganh.gocafe)
  const lookupSlug = resolveLookupSlug(slug);
  if (!isLookupableSlug(lookupSlug)) {
    notFound();
  }
  const page = await fetchPublicPage(lookupSlug);

  // 3. Nếu là alias cũ, thực hiện chuyển hướng 308 (P07.03)
  if (page.found && page.is_alias && page.canonical_slug) {
    redirect(`/${page.canonical_slug}`, RedirectType.replace);
  }

  // 4. Nếu không tìm thấy hoặc trang chưa xuất bản (P07.03)
  if (!page.found) {
    notFound();
  }

  return <PublicPageView page={page} />;
}
