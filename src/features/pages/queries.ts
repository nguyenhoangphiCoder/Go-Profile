import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicMediaUrl } from "@/features/media/queries";
import type {
  PageListItem,
  PageEditorData,
  EditorBlockItem,
  LinkPlacementItem,
  BlockType,
  PageThemeConfig,
  PageSeoConfig,
} from "./types";

interface PageListQueryRow {
  id: string;
  internal_name: string;
  status: string;
  lock_version: number;
  published_revision_id: string | null;
  created_at: string;
  updated_at: string;
  page_slugs: {
    id: string;
    slug: string;
    is_current: boolean;
  }[];
  page_revisions: {
    id: string;
    revision_no: number;
    state: string;
  }[];
  page_links: {
    id: string;
    archived_at: string | null;
  }[];
}

interface PlacementJoinRow {
  id: string;
  block_id: string;
  page_link_id: string;
  position: number;
  label_override: string | null;
  media_override_id: string | null;
  page_links: {
    id: string;
    link_id: string;
    links: {
      id: string;
      default_label: string;
      target_url: string;
      kind: string;
      default_media_id: string | null;
      media_assets: {
        object_path: string;
      } | null;
    } | null;
  } | null;
  media_assets: {
    object_path: string;
  } | null;
}

interface LinkQueryRow {
  id: string;
  default_label: string;
  target_url: string;
  kind: string;
  default_media_id: string | null;
  is_active: boolean;
  media_assets: {
    object_path: string;
  } | null;
}

interface SlugQueryRow {
  id: string;
  slug: string;
  is_current: boolean;
}

interface RevisionQueryRow {
  id: string;
  revision_no: number;
  state: string;
  lock_version: number;
  title: string;
  description: string | null;
  theme: unknown;
  seo: unknown;
}

interface BlockQueryRow {
  id: string;
  type: string;
  position: number;
  is_visible: boolean;
  payload: unknown;
}

interface MediaAssetQueryRow {
  id: string;
  original_filename: string | null;
  object_path: string;
}

export async function getPagesList(): Promise<PageListItem[]> {
  const supabase = await createSupabaseServerClient();

  const { data: pages, error } = await supabase
    .from("pages")
    .select(
      `
      id,
      internal_name,
      status,
      lock_version,
      published_revision_id,
      created_at,
      updated_at,
      page_slugs (
        id,
        slug,
        is_current
      ),
      page_revisions!page_revisions_page_id_fkey (
        id,
        revision_no,
        state
      ),
      page_links (
        id,
        archived_at
      )
    `
    )
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Lỗi khi tải danh sách trang:", error.message || error);
    return [];
  }

  const typedPages = (pages || []) as unknown as PageListQueryRow[];

  return typedPages.map((p) => {
    const slugs = p.page_slugs || [];
    const currentSlug = slugs.find((s) => s.is_current)?.slug || "chua-co-slug";
    const aliases = slugs.filter((s) => !s.is_current).map((s) => s.slug);

    const revisions = p.page_revisions || [];
    const publishedRev = revisions.find((r) => r.id === p.published_revision_id);
    const hasDraft = revisions.some((r) => r.state === "draft");

    const activeLinksCount = (p.page_links || []).filter((l) => !l.archived_at).length;

    return {
      id: p.id,
      internalName: p.internal_name,
      status: p.status as "published" | "unpublished",
      lockVersion: Number(p.lock_version),
      primarySlug: currentSlug,
      aliases,
      publishedRevisionNo: publishedRev ? publishedRev.revision_no : null,
      hasDraft,
      linksCount: activeLinksCount,
      updatedAt: p.updated_at,
      createdAt: p.created_at,
    };
  });
}

export async function getPageEditorData(pageId: string): Promise<PageEditorData | null> {
  const supabase = await createSupabaseServerClient();

  // 1. Tải thông tin trang
  const { data: page, error: pageErr } = await supabase
    .from("pages")
    .select("id, internal_name, status, lock_version, published_revision_id, updated_at")
    .eq("id", pageId)
    .is("archived_at", null)
    .single();

  if (pageErr || !page) {
    console.error("Không tìm thấy trang:", pageErr);
    return null;
  }

  // 2. Tải danh sách slugs
  const { data: slugsData } = await supabase
    .from("page_slugs")
    .select("id, slug, is_current")
    .eq("page_id", pageId);

  const slugs = (slugsData || []) as unknown as SlugQueryRow[];
  const primarySlug = slugs.find((s) => s.is_current)?.slug || "";
  const aliases = slugs.filter((s) => !s.is_current).map((s) => s.slug);

  // 3. Tải revision: ưu tiên draft revision, nếu không có thì lấy revision sealed mới nhất
  const { data: revisions } = await supabase
    .from("page_revisions")
    .select("id, revision_no, state, lock_version, title, description, theme, seo")
    .eq("page_id", pageId)
    .order("revision_no", { ascending: false });

  const allRevisions = (revisions || []) as unknown as RevisionQueryRow[];
  const draftRev = allRevisions.find((r) => r.state === "draft");
  const targetRev = draftRev || allRevisions[0];

  if (!targetRev) {
    console.error("Trang chưa có bất kỳ revision nào");
    return null;
  }

  // 4. Tải các khối (page_blocks) của revision mục tiêu
  const { data: blocksData } = await supabase
    .from("page_blocks")
    .select("id, type, position, is_visible, payload")
    .eq("revision_id", targetRev.id)
    .order("position", { ascending: true });

  const rawBlocks = (blocksData || []) as unknown as BlockQueryRow[];

  // 5. Tải placements của revision mục tiêu kèm chi tiết link và media
  const { data: placementsData } = await supabase
    .from("revision_link_placements")
    .select(
      `
      id,
      block_id,
      page_link_id,
      position,
      label_override,
      media_override_id,
      page_links (
        id,
        link_id,
        links (
          id,
          default_label,
          target_url,
          kind,
          default_media_id,
          media_assets (
            object_path
          )
        )
      ),
      media_assets!revision_link_placements_media_override_id_fkey (
        object_path
      )
    `
    )
    .eq("revision_id", targetRev.id)
    .order("position", { ascending: true });

  // Gom placements theo block_id
  const placementsByBlock: Record<string, LinkPlacementItem[]> = {};

  ((placementsData || []) as unknown as PlacementJoinRow[]).forEach((p) => {
    const pageLink = p.page_links;
    const link = pageLink?.links;
    if (!link) return;

    const mediaOverrideUrl = p.media_assets?.object_path
      ? getPublicMediaUrl(p.media_assets.object_path)
      : null;

    const defaultMediaUrl = link.media_assets?.object_path
      ? getPublicMediaUrl(link.media_assets.object_path)
      : null;

    const item: LinkPlacementItem = {
      id: p.id,
      pageLinkId: p.page_link_id,
      linkId: link.id,
      position: p.position,
      labelOverride: p.label_override,
      mediaOverrideId: p.media_override_id,
      mediaOverrideUrl,
      defaultLabel: link.default_label,
      defaultUrl: link.target_url,
      defaultKind: link.kind as "standard" | "social" | "contact",
      defaultMediaUrl,
    };

    if (!placementsByBlock[p.block_id]) {
      placementsByBlock[p.block_id] = [];
    }
    placementsByBlock[p.block_id].push(item);
  });

  const editorBlocks: EditorBlockItem[] = rawBlocks.map((b) => ({
    id: b.id,
    type: b.type as BlockType,
    position: b.position,
    isVisible: b.is_visible,
    payload: (b.payload as Record<string, unknown>) || {},
    placements: placementsByBlock[b.id] || [],
  }));

  // 6. Tải danh mục link chung đang hoạt động
  const { data: linksData } = await supabase
    .from("links")
    .select(
      "id, default_label, target_url, kind, default_media_id, is_active, media_assets(object_path)"
    )
    .is("archived_at", null)
    .order("default_label", { ascending: true });

  const availableLinks = ((linksData || []) as unknown as LinkQueryRow[]).map((l) => ({
    id: l.id,
    defaultLabel: l.default_label,
    targetUrl: l.target_url,
    kind: l.kind as "standard" | "social" | "contact",
    defaultMediaId: l.default_media_id,
    defaultMediaUrl: l.media_assets?.object_path
      ? getPublicMediaUrl(l.media_assets.object_path)
      : null,
    isActive: l.is_active,
  }));

  // 7. Tải danh mục media sẵn sàng
  const { data: mediaData } = await supabase
    .from("media_assets")
    .select("id, original_filename, object_path")
    .eq("status", "ready")
    .order("created_at", { ascending: false });

  const availableMedia = ((mediaData || []) as unknown as MediaAssetQueryRow[]).map((m) => ({
    id: m.id,
    originalFilename: m.original_filename,
    publicUrl: getPublicMediaUrl(m.object_path),
  }));

  return {
    page: {
      id: page.id,
      internalName: page.internal_name,
      status: page.status as "published" | "unpublished",
      lockVersion: Number(page.lock_version),
      publishedRevisionId: page.published_revision_id,
      updatedAt: page.updated_at,
    },
    primarySlug,
    aliases,
    draftRevision: {
      id: targetRev.id,
      revisionNo: targetRev.revision_no,
      state: targetRev.state as "draft" | "sealed",
      lockVersion: Number(targetRev.lock_version),
      title: targetRev.title,
      description: targetRev.description,
      theme: (targetRev.theme as unknown as PageThemeConfig) || { preset: "go-original" },
      seo: (targetRev.seo as unknown as PageSeoConfig) || {},
    },
    blocks: editorBlocks,
    availableLinks,
    availableMedia,
  };
}
