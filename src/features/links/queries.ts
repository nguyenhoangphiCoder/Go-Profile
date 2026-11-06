import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveAdmin } from "@/features/auth/queries";
import type { LinkItem, LinkKind } from "./types";

export async function getLinks(
  searchQuery?: string,
  statusFilter: "all" | "active" | "inactive" = "all"
): Promise<LinkItem[]> {
  await requireActiveAdmin();
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("links")
    .select(
      `
      id,
      default_label,
      target_url,
      kind,
      description,
      default_media_id,
      is_active,
      lock_version,
      created_at,
      updated_at,
      archived_at,
      page_links (
        id,
        page_id,
        archived_at,
        pages (
          id,
          internal_name
        )
      )
    `
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (statusFilter === "active") {
    query = query.eq("is_active", true);
  } else if (statusFilter === "inactive") {
    query = query.eq("is_active", false);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const term = `%${searchQuery.trim()}%`;
    query = query.or(`default_label.ilike.${term},target_url.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching links:", error);
    return [];
  }

  return data.map((row) => {
    // Lọc danh sách các trang đang liên kết (chưa archive)
    const validPageLinks = (row.page_links || []).filter(
      (pl) => pl.archived_at === null && pl.pages !== null
    );

    const affectedPages = validPageLinks.map((pl) => ({
      id: pl.pages?.id || pl.page_id,
      internalName: pl.pages?.internal_name || "Trang không tên",
    }));

    // Loại bỏ trang trùng lặp nếu 1 link xuất hiện ở nhiều vị trí trên cùng 1 trang
    const uniquePages = Array.from(new Map(affectedPages.map((p) => [p.id, p])).values());

    return {
      id: row.id,
      defaultLabel: row.default_label,
      targetUrl: row.target_url,
      kind: row.kind as LinkKind,
      description: row.description,
      defaultMediaId: row.default_media_id,
      isActive: row.is_active,
      lockVersion: Number(row.lock_version),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
      usageCount: uniquePages.length,
      affectedPages: uniquePages,
    };
  });
}

export async function getLinkById(id: string): Promise<LinkItem | null> {
  await requireActiveAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: row, error } = await supabase
    .from("links")
    .select(
      `
      id,
      default_label,
      target_url,
      kind,
      description,
      default_media_id,
      is_active,
      lock_version,
      created_at,
      updated_at,
      archived_at,
      page_links (
        id,
        page_id,
        archived_at,
        pages (
          id,
          internal_name
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !row) {
    return null;
  }

  const validPageLinks = (row.page_links || []).filter(
    (pl) => pl.archived_at === null && pl.pages !== null
  );

  const affectedPages = Array.from(
    new Map(
      validPageLinks.map((pl) => [
        pl.pages?.id || pl.page_id,
        {
          id: pl.pages?.id || pl.page_id,
          internalName: pl.pages?.internal_name || "Trang không tên",
        },
      ])
    ).values()
  );

  return {
    id: row.id,
    defaultLabel: row.default_label,
    targetUrl: row.target_url,
    kind: row.kind as LinkKind,
    description: row.description,
    defaultMediaId: row.default_media_id,
    isActive: row.is_active,
    lockVersion: Number(row.lock_version),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    usageCount: affectedPages.length,
    affectedPages,
  };
}
