import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";

/** Tag cache của danh sách trang công khai — xoá khi xuất bản / ẩn / đổi slug / lưu trữ trang. */
export const PUBLIC_SITEMAP_TAG = "public-sitemap";

export interface PublishedPageEntry {
  slug: string;
  updatedAt: string;
}

/**
 * Danh sách trang đang xuất bản (slug chính hiện tại) cho sitemap.xml.
 * Dùng service role vì bảng pages / page_slugs chỉ cho quản trị viên đọc qua RLS;
 * chỉ trả về slug + thời điểm cập nhật, không có dữ liệu nội bộ.
 */
export async function getPublishedPages(): Promise<PublishedPageEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PUBLIC_SITEMAP_TAG);

  const db = createSupabaseAdminClient();

  // Trang của workspace đã lưu trữ không còn hiển thị công khai (migration 20261117000002)
  const { data: activeWorkspaces } = await db
    .from("workspaces")
    .select("id")
    .is("archived_at", null);
  const activeWorkspaceIds = (activeWorkspaces ?? []).map((w) => w.id);
  if (activeWorkspaceIds.length === 0) return [];

  const { data: pages, error } = await db
    .from("pages")
    .select("id, updated_at")
    .in("workspace_id", activeWorkspaceIds)
    .eq("status", "published")
    .is("archived_at", null)
    .not("published_revision_id", "is", null);

  if (error || !pages || pages.length === 0) {
    if (error) console.error("Không tải được danh sách trang cho sitemap:", error.message);
    return [];
  }

  const { data: slugs } = await db
    .from("page_slugs")
    .select("page_id, slug")
    .eq("is_current", true)
    .in(
      "page_id",
      pages.map((p) => p.id)
    );

  const slugByPage = new Map((slugs ?? []).map((s) => [s.page_id, s.slug]));
  return pages
    .map((p) => ({ slug: slugByPage.get(p.id), updatedAt: p.updated_at }))
    .filter((p): p is PublishedPageEntry => Boolean(p.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
