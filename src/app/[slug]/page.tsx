import { Metadata } from "next";
import { notFound, redirect, RedirectType } from "next/navigation";
import { isReservedSlug } from "@/config/reserved-slugs";
import { fetchPublicPage } from "@/features/public/queries";
import { PublicPageView } from "@/features/public/components/public-page-view";

export const instant = false;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (isReservedSlug(slug)) {
    return { title: "Không tìm thấy trang" };
  }

  const page = await fetchPublicPage(slug);

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

  // 2. Tra cứu dữ liệu trang công khai
  const page = await fetchPublicPage(slug);

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
