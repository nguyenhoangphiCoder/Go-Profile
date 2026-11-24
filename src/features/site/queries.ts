import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicMediaUrl } from "@/features/media/queries";
import { requireWorkspace } from "@/features/workspace/context";
import { hasRole } from "@/features/workspace/types";
import type {
  SiteConfigEditorData,
  SiteFloatingContactConfig,
  SiteFooterColumn,
  SiteHeaderConfig,
  SiteNavItemData,
  SiteShellSummary,
} from "./types";

interface SiteShellRow {
  id: string;
  name: string;
  is_default: boolean;
  site_name: string | null;
  logo_media_id: string | null;
  header_config: unknown;
  footer_columns: unknown;
  floating_contact: unknown;
  media_assets: { object_path: string } | null;
}

interface NavItemRow {
  id: string;
  parent_id: string | null;
  label: string;
  target_type: "page" | "anchor" | "url";
  target_page_id: string | null;
  target_value: string | null;
  position: number;
  is_visible: boolean;
}

interface PageRow {
  id: string;
  internal_name: string;
  page_kind: string;
  status: string;
  page_slugs: { slug: string; is_current: boolean }[];
}

interface MediaRow {
  id: string;
  original_filename: string | null;
  object_path: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getSiteConfigData(requestedShellId?: string): Promise<SiteConfigEditorData> {
  const { workspace, role } = await requireWorkspace();
  const supabase = await createSupabaseServerClient();

  const [{ data: shellsData }, { data: pagesData }, { data: mediaData }] = await Promise.all([
    supabase
      .from("site_shells")
      .select(
        "id, name, is_default, site_name, logo_media_id, header_config, footer_columns, floating_contact, media_assets(object_path)"
      )
      .eq("workspace_id", workspace.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("pages")
      .select("id, internal_name, page_kind, status, page_slugs(slug, is_current)")
      .eq("workspace_id", workspace.id)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("media_assets")
      .select("id, original_filename, object_path")
      .eq("workspace_id", workspace.id)
      .eq("status", "ready")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
  ]);

  let rawShells = (shellsData || []) as unknown as SiteShellRow[];

  // Tự khởi tạo 1 bộ Site Shell mặc định nếu workspace chưa có
  if (rawShells.length === 0) {
    const { data: created } = await supabase
      .from("site_shells")
      .insert({
        workspace_id: workspace.id,
        name: workspace.name || "Website Chính",
        is_default: true,
        site_name: workspace.name,
      })
      .select(
        "id, name, is_default, site_name, logo_media_id, header_config, footer_columns, floating_contact, media_assets(object_path)"
      )
      .single();
    if (created) {
      rawShells = [created as unknown as SiteShellRow];
    }
  }

  const cleanRequested =
    requestedShellId && UUID_RE.test(requestedShellId) ? requestedShellId : undefined;
  const activeShell =
    (cleanRequested ? rawShells.find((s) => s.id === cleanRequested) : undefined) ||
    rawShells.find((s) => s.is_default) ||
    rawShells[0] ||
    null;

  const { data: navData } = activeShell
    ? await supabase
        .from("site_nav_items")
        .select(
          "id, parent_id, label, target_type, target_page_id, target_value, position, is_visible"
        )
        .eq("workspace_id", workspace.id)
        .eq("shell_id", activeShell.id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [] };

  const rawPages = (pagesData || []) as unknown as PageRow[];
  const availablePages = rawPages.map((p) => {
    const primarySlug = (p.page_slugs || []).find((s) => s.is_current)?.slug || "";
    return {
      id: p.id,
      internalName: p.internal_name,
      primarySlug,
      pageKind: (p.page_kind === "landing" ? "landing" : "profile") as "profile" | "landing",
      status: (p.status === "published" ? "published" : "unpublished") as
        "published" | "unpublished",
    };
  });

  const pageMap = new Map(availablePages.map((p) => [p.id, p]));

  const rawNav = (navData || []) as unknown as NavItemRow[];
  const navItems: SiteNavItemData[] = rawNav.map((n) => {
    const linkedPage = n.target_page_id ? pageMap.get(n.target_page_id) : undefined;
    return {
      id: n.id,
      parentId: n.parent_id,
      label: n.label,
      targetType: n.target_type,
      targetPageId: n.target_page_id,
      targetPageSlug: linkedPage?.primarySlug ?? null,
      targetPageStatus: linkedPage?.status ?? null,
      targetValue: n.target_value,
      position: n.position,
      isVisible: n.is_visible,
    };
  });

  const headerConfig = ((activeShell?.header_config as SiteHeaderConfig & {
    copyrightText?: string;
  }) || {}) as SiteHeaderConfig & { copyrightText?: string };

  const availableMedia = ((mediaData || []) as unknown as MediaRow[]).map((m) => ({
    id: m.id,
    originalFilename: m.original_filename,
    publicUrl: getPublicMediaUrl(m.object_path),
  }));

  const shells: SiteShellSummary[] = rawShells.map((s) => ({
    id: s.id,
    name: s.name,
    isDefault: s.is_default,
  }));

  return {
    workspaceName: workspace.name,
    canEdit: hasRole(role, "editor"),
    shells,
    activeShellId: activeShell?.id || "",
    activeShellName: activeShell?.name || workspace.name,
    activeShellIsDefault: activeShell?.is_default ?? true,
    settings: {
      siteName: activeShell?.site_name || activeShell?.name || workspace.name,
      logoMediaId: activeShell?.logo_media_id || null,
      logoUrl: activeShell?.media_assets?.object_path
        ? getPublicMediaUrl(activeShell.media_assets.object_path)
        : null,
      headerConfig: {
        ...headerConfig,
        sticky: headerConfig.sticky ?? true,
        ctaEnabled: headerConfig.ctaEnabled ?? false,
        ctaLabel: headerConfig.ctaLabel || "",
        ctaHref: headerConfig.ctaHref || "",
        navFont: headerConfig.navFont || "lexend-deca",
        navFontSize: headerConfig.navFontSize ?? 13,
        navBgColor: headerConfig.navBgColor || "#FFFFFF",
        navTextColor: headerConfig.navTextColor || "#111111",
        navActiveColor: headerConfig.navActiveColor || "#B88A44",
      },
      copyrightText: headerConfig.copyrightText || "",
      footerColumns: Array.isArray(activeShell?.footer_columns)
        ? (activeShell.footer_columns as SiteFooterColumn[])
        : [],
      floatingContact: (activeShell?.floating_contact as SiteFloatingContactConfig) || {
        enabled: false,
        showCall: true,
        phone: "",
        showZalo: true,
        zaloUrl: "",
      },
    },
    navItems,
    availablePages,
    availableMedia,
  };
}
