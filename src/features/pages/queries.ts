import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicMediaUrl } from "@/features/media/queries";
import { requireWorkspace } from "@/features/workspace/context";
import { hasRole } from "@/features/workspace/types";
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
  const { workspace } = await requireWorkspace();
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
    .eq("workspace_id", workspace.id)
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
  const { workspace, role } = await requireWorkspace();
  const supabase = await createSupabaseServerClient();

  // Đợt 1 (chạy song song 5 truy vấn độc lập thay vì nối đuôi nhau):
  // pages, page_slugs, page_revisions (chỉ lấy 5 bản mới nhất), links, media_assets
  const [
    { data: page, error: pageErr },
    { data: slugsData },
    { data: revisions },
    { data: linksData },
    { data: mediaData },
  ] = await Promise.all([
    supabase
      .from("pages")
      .select("id, internal_name, status, lock_version, published_revision_id, updated_at")
      .eq("id", pageId)
      .eq("workspace_id", workspace.id)
      .is("archived_at", null)
      .single(),
    supabase.from("page_slugs").select("id, slug, is_current").eq("page_id", pageId),
    supabase
      .from("page_revisions")
      .select("id, revision_no, state, lock_version, title, description, theme, seo")
      .eq("page_id", pageId)
      .order("revision_no", { ascending: false })
      .limit(5),
    supabase
      .from("links")
      .select(
        "id, default_label, target_url, kind, default_media_id, is_active, media_assets(object_path)"
      )
      .eq("workspace_id", workspace.id)
      .is("archived_at", null)
      .order("default_label", { ascending: true }),
    supabase
      .from("media_assets")
      .select("id, original_filename, object_path")
      .eq("workspace_id", workspace.id)
      .eq("status", "ready")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
  ]);

  if (pageErr || !page) {
    console.error("Không tìm thấy trang:", pageErr);
    return null;
  }

  const slugs = (slugsData || []) as unknown as SlugQueryRow[];
  const primarySlug = slugs.find((s) => s.is_current)?.slug || "";
  const aliases = slugs.filter((s) => !s.is_current).map((s) => s.slug);

  const allRevisions = (revisions || []) as unknown as RevisionQueryRow[];
  const draftRev = allRevisions.find((r) => r.state === "draft");
  const targetRev = draftRev || allRevisions[0];

  if (!targetRev) {
    console.error("Trang chưa có bất kỳ revision nào");
    return null;
  }

  // Đợt 2 (chạy song song 2 truy vấn phụ thuộc targetRev.id): page_blocks & placements
  const [{ data: blocksData }, { data: placementsData }] = await Promise.all([
    supabase
      .from("page_blocks")
      .select("id, type, position, is_visible, payload")
      .eq("revision_id", targetRev.id)
      .order("position", { ascending: true }),
    supabase
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
      .order("position", { ascending: true }),
  ]);

  const rawBlocks = (blocksData || []) as unknown as BlockQueryRow[];

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
    canEdit: hasRole(role, "editor"),
  };
}

export async function getNewPageEditorData(): Promise<PageEditorData> {
  const { workspace } = await requireWorkspace("editor");
  const supabase = await createSupabaseServerClient();

  // Chạy song song 2 truy vấn danh mục links và media
  const [{ data: linksData }, { data: mediaData }] = await Promise.all([
    supabase
      .from("links")
      .select(
        "id, default_label, target_url, kind, default_media_id, is_active, media_assets(object_path)"
      )
      .eq("workspace_id", workspace.id)
      .is("archived_at", null)
      .order("default_label", { ascending: true }),
    supabase
      .from("media_assets")
      .select("id, original_filename, object_path")
      .eq("workspace_id", workspace.id)
      .eq("status", "ready")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
  ]);

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

  const availableMedia = ((mediaData || []) as unknown as MediaAssetQueryRow[]).map((m) => ({
    id: m.id,
    originalFilename: m.original_filename,
    publicUrl: getPublicMediaUrl(m.object_path),
  }));

  const initialBlocks: EditorBlockItem[] = [
    {
      id: "initial-block-header",
      type: "header",
      position: 0,
      isVisible: true,
      payload: {
        title: "GỜ CAFÉ",
        bio: "Hệ thống cà phê chuẩn gu Việt Nam\n*Cà phê sạch - Chuẩn vị tươi ngon*",
      },
      placements: [],
    },
    {
      id: "initial-block-link-list",
      type: "link_list",
      position: 1,
      isVisible: true,
      payload: { layout: "stack" },
      placements: availableLinks.slice(0, 3).map((l, i) => ({
        id: `initial-placement-link-${l.id || i}`,
        linkId: l.id,
        position: i,
        defaultLabel: l.defaultLabel,
        defaultUrl: l.targetUrl,
        defaultKind: l.kind,
        defaultMediaUrl: l.defaultMediaUrl,
      })),
    },
    {
      id: "initial-block-social-icons",
      type: "social_icons",
      position: 2,
      isVisible: true,
      payload: { style: "colored" },
      placements: availableLinks
        .filter((l) => l.kind === "social")
        .slice(0, 4)
        .map((l, i) => ({
          id: `initial-placement-social-${l.id || i}`,
          linkId: l.id,
          position: i,
          defaultLabel: l.defaultLabel,
          defaultUrl: l.targetUrl,
          defaultKind: l.kind,
          defaultMediaUrl: l.defaultMediaUrl,
        })),
    },
  ];

  return {
    page: {
      id: "new",
      internalName: "Trang hồ sơ mới",
      status: "unpublished",
      lockVersion: 1,
      publishedRevisionId: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    primarySlug: "trang-moi",
    aliases: [],
    draftRevision: {
      id: "new-draft",
      revisionNo: 1,
      state: "draft",
      lockVersion: 1,
      title: "GỜ CAFÉ",
      description: "Trang hồ sơ liên kết của Gờ Cafe",
      theme: { preset: "go-original" },
      seo: {
        metaTitle: "Gờ Cafe - Cà phê chuẩn gu",
        metaDescription: "Hệ thống liên kết và thông tin chính thức của Gờ Cafe.",
      },
    },
    blocks: initialBlocks,
    availableLinks,
    availableMedia,
    canEdit: true,
  };
}
