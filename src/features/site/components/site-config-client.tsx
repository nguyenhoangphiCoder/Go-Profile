"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  PanelTop,
  PanelBottom,
  Plus,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Save,
  Loader2,
  CornerDownRight,
  ExternalLink,
  X,
} from "lucide-react";
import type {
  SiteConfigEditorData,
  SiteCtaRadius,
  SiteFloatingButtonIcon,
  SiteFloatingCustomButton,
  SiteFooterColumn,
  SiteFooterLayout,
  SiteFooterLink,
  SiteFooterPadding,
  SiteNavActiveStyle,
  SiteNavBackdrop,
  SiteNavGap,
  SiteNavHeight,
  SiteNavItemData,
  SiteNavLayout,
  SiteNavShadow,
  SiteNavTargetType,
  SiteNavWeight,
} from "../types";
import {
  createNavItemAction,
  createPageAndLinkNavAction,
  createSiteShellAction,
  deleteNavItemAction,
  deleteSiteShellAction,
  renameSiteShellAction,
  reorderNavItemsAction,
  saveSiteSettingsAction,
  setDefaultSiteShellAction,
  updateNavItemAction,
} from "../actions";
import { MediaPickerField } from "@/components/admin/media-picker-field";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { FONT_IDS, FONT_LABELS, FONT_STACKS, type FontId } from "@/config/theme-tokens";

interface SiteConfigClientProps {
  initialData: SiteConfigEditorData;
}

type NavModalState =
  | { mode: "create"; parentId: string | null }
  | { mode: "edit"; item: SiteNavItemData }
  | { mode: "create-page"; parentId: string | null }
  | null;

export function SiteConfigClient({ initialData }: SiteConfigClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const canEdit = initialData.canEdit;

  const [activeTab, setActiveTab] = useState<"nav" | "header" | "footer">("nav");

  // Site settings state
  const [siteName, setSiteName] = useState(initialData.settings.siteName);
  const [logoMediaId, setLogoMediaId] = useState<string | null>(initialData.settings.logoMediaId);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData.settings.logoUrl);
  const [stickyHeader, setStickyHeader] = useState(
    initialData.settings.headerConfig.sticky ?? true
  );
  const [hideSiteName, setHideSiteName] = useState(
    initialData.settings.headerConfig.hideSiteName ?? false
  );
  const [homePageSlug, setHomePageSlug] = useState(
    initialData.settings.headerConfig.homePageSlug || ""
  );
  const [socialFacebook, setSocialFacebook] = useState(
    initialData.settings.headerConfig.socialLinks?.facebook || ""
  );
  const [socialTiktok, setSocialTiktok] = useState(
    initialData.settings.headerConfig.socialLinks?.tiktok || ""
  );
  const [socialInstagram, setSocialInstagram] = useState(
    initialData.settings.headerConfig.socialLinks?.instagram || ""
  );
  const [socialShopee, setSocialShopee] = useState(
    initialData.settings.headerConfig.socialLinks?.shopee || ""
  );
  const [socialYoutube, setSocialYoutube] = useState(
    initialData.settings.headerConfig.socialLinks?.youtube || ""
  );
  const [ga4Id, setGa4Id] = useState(initialData.settings.headerConfig.tracking?.ga4Id || "");
  const [fbPixelId, setFbPixelId] = useState(
    initialData.settings.headerConfig.tracking?.fbPixelId || ""
  );
  const [tiktokPixelId, setTiktokPixelId] = useState(
    initialData.settings.headerConfig.tracking?.tiktokPixelId || ""
  );
  const [telegramBotToken, setTelegramBotToken] = useState(
    initialData.settings.headerConfig.leadNotifications?.telegramBotToken || ""
  );
  const [telegramChatId, setTelegramChatId] = useState(
    initialData.settings.headerConfig.leadNotifications?.telegramChatId || ""
  );
  const [leadWebhookUrl, setLeadWebhookUrl] = useState(
    initialData.settings.headerConfig.leadNotifications?.webhookUrl || ""
  );
  const [ctaEnabled, setCtaEnabled] = useState(
    initialData.settings.headerConfig.ctaEnabled ?? false
  );
  const [ctaLabel, setCtaLabel] = useState(initialData.settings.headerConfig.ctaLabel || "");
  const [ctaHref, setCtaHref] = useState(initialData.settings.headerConfig.ctaHref || "");
  const [navFont, setNavFont] = useState<FontId>(
    initialData.settings.headerConfig.navFont || "lexend-deca"
  );
  const [navFontSize, setNavFontSize] = useState<number>(
    initialData.settings.headerConfig.navFontSize ?? 13
  );
  const [navBgColor, setNavBgColor] = useState(
    initialData.settings.headerConfig.navBgColor || "#FFFFFF"
  );
  const [navTextColor, setNavTextColor] = useState(
    initialData.settings.headerConfig.navTextColor || "#111111"
  );
  const [navActiveColor, setNavActiveColor] = useState(
    initialData.settings.headerConfig.navActiveColor || "#B88A44"
  );
  // Bố cục, kích thước, hiệu ứng & CTA mở rộng
  const [navLayout, setNavLayout] = useState<SiteNavLayout>(
    initialData.settings.headerConfig.navLayout || "classic"
  );
  const [navHeight, setNavHeight] = useState<SiteNavHeight>(
    initialData.settings.headerConfig.navHeight || "default"
  );
  const [logoHeight, setLogoHeight] = useState<number>(
    initialData.settings.headerConfig.logoHeight ?? 36
  );
  const [navGap, setNavGap] = useState<SiteNavGap>(
    initialData.settings.headerConfig.navGap || "normal"
  );
  const [navUppercase, setNavUppercase] = useState<boolean>(
    initialData.settings.headerConfig.navUppercase ?? false
  );
  const [navWeight, setNavWeight] = useState<SiteNavWeight>(
    initialData.settings.headerConfig.navWeight || "500"
  );
  const [navActiveStyle, setNavActiveStyle] = useState<SiteNavActiveStyle>(
    initialData.settings.headerConfig.navActiveStyle || "text"
  );
  const [navBackdrop, setNavBackdrop] = useState<SiteNavBackdrop>(
    initialData.settings.headerConfig.navBackdrop || "glass"
  );
  const [navShadow, setNavShadow] = useState<SiteNavShadow>(
    initialData.settings.headerConfig.navShadow || "none"
  );
  const [navBorder, setNavBorder] = useState<boolean>(
    initialData.settings.headerConfig.navBorder ?? true
  );
  const [ctaBgColor, setCtaBgColor] = useState(
    initialData.settings.headerConfig.ctaBgColor || "#111111"
  );
  const [ctaTextColor, setCtaTextColor] = useState(
    initialData.settings.headerConfig.ctaTextColor || "#FFFFFF"
  );
  const [ctaRadius, setCtaRadius] = useState<SiteCtaRadius>(
    initialData.settings.headerConfig.ctaRadius || "xl"
  );
  const [ctaShowOnMobile, setCtaShowOnMobile] = useState<boolean>(
    initialData.settings.headerConfig.ctaShowOnMobile ?? false
  );
  const [announcementEnabled, setAnnouncementEnabled] = useState<boolean>(
    initialData.settings.headerConfig.announcementEnabled ?? false
  );
  const [announcementText, setAnnouncementText] = useState(
    initialData.settings.headerConfig.announcementText || ""
  );
  const [announcementHref, setAnnouncementHref] = useState(
    initialData.settings.headerConfig.announcementHref || ""
  );
  const [announcementBgColor, setAnnouncementBgColor] = useState(
    initialData.settings.headerConfig.announcementBgColor || "#111111"
  );
  const [announcementTextColor, setAnnouncementTextColor] = useState(
    initialData.settings.headerConfig.announcementTextColor || "#FFFFFF"
  );
  // Footer style state
  const [footerLayout, setFooterLayout] = useState<SiteFooterLayout>(
    initialData.settings.headerConfig.footerStyle?.layout || "columns"
  );
  const [footerPadding, setFooterPadding] = useState<SiteFooterPadding>(
    initialData.settings.headerConfig.footerStyle?.padding || "default"
  );
  const [footerShowLogo, setFooterShowLogo] = useState<boolean>(
    initialData.settings.headerConfig.footerStyle?.showLogo ?? true
  );
  const [footerBgColor, setFooterBgColor] = useState(
    initialData.settings.headerConfig.footerStyle?.bgColor || "#F8F7F4"
  );
  const [footerTextColor, setFooterTextColor] = useState(
    initialData.settings.headerConfig.footerStyle?.textColor || "#111111"
  );
  const [footerAccentColor, setFooterAccentColor] = useState(
    initialData.settings.headerConfig.footerStyle?.accentColor || "#B88A44"
  );
  const [footerFont, setFooterFont] = useState<FontId>(
    initialData.settings.headerConfig.footerStyle?.font || "lexend-deca"
  );
  const [footerFontSize, setFooterFontSize] = useState<number>(
    initialData.settings.headerConfig.footerStyle?.fontSize ?? 14
  );
  const [copyrightText, setCopyrightText] = useState(initialData.settings.copyrightText || "");
  const [faviconUrl, setFaviconUrl] = useState(
    initialData.settings.headerConfig.faviconUrl || ""
  );
  const [legalLinks, setLegalLinks] = useState<SiteFooterLink[]>(
    initialData.settings.headerConfig.legalLinks || []
  );

  // Floating contact state
  const [floatingEnabled, setFloatingEnabled] = useState(
    initialData.settings.floatingContact.enabled ?? false
  );
  const [floatingPosition, setFloatingPosition] = useState<"right" | "left">(
    initialData.settings.floatingContact.position ?? "right"
  );
  const [showBackToTop, setShowBackToTop] = useState(
    initialData.settings.floatingContact.showBackToTop ?? false
  );
  const [showCall, setShowCall] = useState(initialData.settings.floatingContact.showCall ?? true);
  const [floatingPhone, setFloatingPhone] = useState(
    initialData.settings.floatingContact.phone || ""
  );
  const [showZalo, setShowZalo] = useState(initialData.settings.floatingContact.showZalo ?? true);
  const [floatingZalo, setFloatingZalo] = useState(
    initialData.settings.floatingContact.zaloUrl || ""
  );
  const [customFloatingButtons, setCustomFloatingButtons] = useState<SiteFloatingCustomButton[]>(
    initialData.settings.floatingContact.customButtons || []
  );

  // Footer columns state (max 3)
  const [footerColumns, setFooterColumns] = useState<SiteFooterColumn[]>(
    initialData.settings.footerColumns
  );

  // Media list state
  const [mediaList, setMediaList] = useState(initialData.availableMedia);

  // Nav modals state
  const [navModal, setNavModal] = useState<NavModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<SiteNavItemData | null>(null);
  const [shellModal, setShellModal] = useState<"create" | "rename" | null>(null);
  const [shellNameInput, setShellNameInput] = useState("");
  const [deleteShellConfirm, setDeleteShellConfirm] = useState(false);

  // Form fields inside NavModal
  const [formLabel, setFormLabel] = useState("");
  const [formTargetType, setFormTargetType] = useState<SiteNavTargetType>("page");
  const [formTargetPageId, setFormTargetPageId] = useState<string>("");
  const [formTargetValue, setFormTargetValue] = useState("");
  const [formSlug, setFormSlug] = useState("");

  const topItems = initialData.navItems
    .filter((i) => !i.parentId)
    .sort((a, b) => a.position - b.position);

  const getChildren = (parentId: string) =>
    initialData.navItems
      .filter((i) => i.parentId === parentId)
      .sort((a, b) => a.position - b.position);

  const openCreateNav = (parentId: string | null) => {
    setFormLabel("");
    setFormTargetType("page");
    setFormTargetPageId(initialData.availablePages[0]?.id || "");
    setFormTargetValue("");
    setNavModal({ mode: "create", parentId });
  };

  const openEditNav = (item: SiteNavItemData) => {
    setFormLabel(item.label);
    setFormTargetType(item.targetType);
    setFormTargetPageId(item.targetPageId || initialData.availablePages[0]?.id || "");
    setFormTargetValue(item.targetValue || "");
    setNavModal({ mode: "edit", item });
  };

  const openCreatePageForNav = (parentId: string | null) => {
    setFormLabel("");
    setFormSlug("");
    setNavModal({ mode: "create-page", parentId });
  };

  const handleLabelToSlug = (val: string) => {
    setFormLabel(val);
    const slug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormSlug(slug);
  };

  const handleSaveSettings = () => {
    startTransition(async () => {
      const res = await saveSiteSettingsAction({
        shellId: initialData.activeShellId,
        siteName,
        logoMediaId,
        headerConfig: {
          sticky: stickyHeader,
          hideSiteName,
          homePageSlug,
          navLayout,
          navHeight,
          logoHeight,
          navGap,
          navFont,
          navFontSize,
          navUppercase,
          navWeight,
          navActiveStyle,
          navBackdrop,
          navShadow,
          navBorder,
          navBgColor,
          navTextColor,
          navActiveColor,
          ctaEnabled,
          ctaLabel,
          ctaHref,
          ctaBgColor,
          ctaTextColor,
          ctaRadius,
          ctaShowOnMobile,
          announcementEnabled,
          announcementText,
          announcementHref,
          announcementBgColor,
          announcementTextColor,
          faviconUrl,
          copyrightText,
          legalLinks: legalLinks.filter((l) => l.label.trim() && l.href.trim()),
          footerStyle: {
            layout: footerLayout,
            padding: footerPadding,
            showLogo: footerShowLogo,
            bgColor: footerBgColor,
            textColor: footerTextColor,
            accentColor: footerAccentColor,
            font: footerFont,
            fontSize: footerFontSize,
          },
          socialLinks: {
            facebook: socialFacebook,
            tiktok: socialTiktok,
            instagram: socialInstagram,
            shopee: socialShopee,
            youtube: socialYoutube,
          },
          tracking: {
            ga4Id,
            fbPixelId,
            tiktokPixelId,
          },
          leadNotifications: {
            telegramBotToken,
            telegramChatId,
            webhookUrl: leadWebhookUrl,
          },
        },
        footerColumns,
        floatingContact: {
          enabled: floatingEnabled,
          position: floatingPosition,
          showBackToTop,
          showCall,
          phone: floatingPhone,
          showZalo,
          zaloUrl: floatingZalo,
          customButtons: customFloatingButtons.filter((b) => b.label.trim() && b.href.trim()),
        },
      });
      if (res.success) {
        toast.success("Đã lưu cấu hình website!");
        router.refresh();
      } else {
        toast.error(res.error || "Không thể lưu cấu hình");
      }
    });
  };

  const handleSubmitNavModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!navModal) return;

    startTransition(async () => {
      if (navModal.mode === "create-page") {
        const res = await createPageAndLinkNavAction({
          shellId: initialData.activeShellId,
          parentId: navModal.parentId,
          label: formLabel,
          slug: formSlug,
          title: formLabel,
        });
        if (res.success) {
          toast.success(`Đã tạo trang mới & thêm tab "${formLabel}" vào menu!`);
          setNavModal(null);
          router.refresh();
        } else {
          toast.error(res.error || "Không thể tạo trang mới cho tab");
        }
        return;
      }

      if (navModal.mode === "create") {
        const res = await createNavItemAction({
          shellId: initialData.activeShellId,
          parentId: navModal.parentId,
          label: formLabel,
          targetType: formTargetType,
          targetPageId: formTargetType === "page" ? formTargetPageId || null : null,
          targetValue: formTargetType === "page" ? null : formTargetValue,
          isVisible: true,
        });
        if (res.success) {
          toast.success(`Đã thêm mục menu "${formLabel}"`);
          setNavModal(null);
          router.refresh();
        } else {
          toast.error(res.error || "Không thể thêm mục menu");
        }
        return;
      }

      const res = await updateNavItemAction({
        id: navModal.item.id,
        label: formLabel,
        targetType: formTargetType,
        targetPageId: formTargetType === "page" ? formTargetPageId || null : null,
        targetValue: formTargetType === "page" ? null : formTargetValue,
      });
      if (res.success) {
        toast.success("Đã cập nhật mục menu");
        setNavModal(null);
        router.refresh();
      } else {
        toast.error(res.error || "Không thể cập nhật mục menu");
      }
    });
  };

  const handleToggleVisible = (item: SiteNavItemData) => {
    startTransition(async () => {
      const res = await updateNavItemAction({
        id: item.id,
        label: item.label,
        targetType: item.targetType,
        targetPageId: item.targetPageId,
        targetValue: item.targetValue,
        isVisible: !item.isVisible,
      });
      if (res.success) {
        router.refresh();
      } else {
        toast.error(res.error || "Không thể đổi trạng thái hiển thị");
      }
    });
  };

  const handleMove = (siblings: SiteNavItemData[], index: number, dir: -1 | 1) => {
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;
    const reordered = [...siblings];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    startTransition(async () => {
      const res = await reorderNavItemsAction({
        items: reordered.map((it, idx) => ({
          id: it.id,
          parentId: it.parentId,
          position: idx,
        })),
      });
      if (res.success) {
        router.refresh();
      } else {
        toast.error(res.error || "Không thể đổi thứ tự");
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const res = await deleteNavItemAction(target.id);
      setDeleteTarget(null);
      if (res.success) {
        toast.success(`Đã xóa mục "${target.label}"`);
        router.refresh();
      } else {
        toast.error(res.error || "Không thể xóa mục menu");
      }
    });
  };

  const describeTarget = (item: SiteNavItemData) => {
    if (item.targetType === "page") {
      if (!item.targetPageSlug) return "Trang chưa xác định";
      return item.targetPageStatus === "published"
        ? `/${item.targetPageSlug}`
        : `/${item.targetPageSlug} (Bản nháp — chưa hiện công khai)`;
    }
    return item.targetValue || "—";
  };

  const handleSubmitShellModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shellModal || !shellNameInput.trim()) return;
    startTransition(async () => {
      if (shellModal === "create") {
        const res = await createSiteShellAction(shellNameInput.trim());
        if (res.success && res.id) {
          toast.success(`Đã tạo bộ Menu "${shellNameInput.trim()}"`);
          setShellModal(null);
          router.push(`/admin/site?shell=${res.id}`);
        } else {
          toast.error(res.error || "Không thể tạo bộ Menu mới");
        }
        return;
      }
      const res = await renameSiteShellAction(initialData.activeShellId, shellNameInput.trim());
      if (res.success) {
        toast.success("Đã đổi tên bộ Menu");
        setShellModal(null);
        router.refresh();
      } else {
        toast.error(res.error || "Không thể đổi tên");
      }
    });
  };

  const handleSetDefaultShell = () => {
    startTransition(async () => {
      const res = await setDefaultSiteShellAction(initialData.activeShellId);
      if (res.success) {
        toast.success(`Đã đặt "${initialData.activeShellName}" làm bộ Menu mặc định`);
        router.refresh();
      } else {
        toast.error(res.error || "Không thể đặt mặc định");
      }
    });
  };

  const handleConfirmDeleteShell = () => {
    startTransition(async () => {
      const res = await deleteSiteShellAction(initialData.activeShellId);
      setDeleteShellConfirm(false);
      if (res.success) {
        toast.success(`Đã xóa bộ Menu "${initialData.activeShellName}"`);
        router.push("/admin/site");
      } else {
        toast.error(res.error || "Không thể xóa bộ Menu");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* MULTI-SITE SHELL SWITCHER BAR */}
      <div className="p-4 rounded-2xl border border-border/80 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <span className="text-xs font-bold text-muted-foreground shrink-0">
            Bộ Menu / Website:
          </span>
          <div className="min-w-[220px]">
            <Select
              value={initialData.activeShellId}
              onChange={(val) => router.push(`/admin/site?shell=${val}`)}
              className="w-full"
              options={initialData.shells.map((s) => ({
                value: s.id,
                label: s.isDefault ? `${s.name} (Mặc định)` : s.name,
              }))}
            />
          </div>
          {!initialData.activeShellIsDefault && canEdit && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSetDefaultShell}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-[11px] font-semibold cursor-pointer"
            >
              Đặt làm mặc định
            </button>
          )}
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShellNameInput(initialData.activeShellName);
                setShellModal("rename");
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Đổi tên</span>
            </button>
            {initialData.shells.length > 1 && (
              <button
                type="button"
                onClick={() => setDeleteShellConfirm(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-500/30 text-red-600 hover:bg-red-500/10 text-xs font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa bộ</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShellNameInput("");
                setShellModal("create");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-foreground text-background hover:opacity-90 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo bộ Menu mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/80 overflow-x-auto">
        {(
          [
            { key: "nav", label: "Thanh Menu (2 cấp)", Icon: Menu },
            { key: "header", label: "Header & Nút nổi", Icon: PanelTop },
            { key: "footer", label: "Footer (1–4 cột)", Icon: PanelBottom },
          ] as const
        ).map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MENU 2 CẤP */}
      {activeTab === "nav" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Danh sách Tab điều hướng</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tự thêm/sửa/xóa và sắp xếp các tab (hỗ trợ menu thả xuống 2 cấp). Áp dụng đồng bộ
                cho mọi Landing Page.
              </p>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openCreatePageForNav(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tạo trang mới cho tab</span>
                </button>
                <button
                  type="button"
                  onClick={() => openCreateNav(null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Tab cấp 1</span>
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden">
            {topItems.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Menu className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm font-semibold text-foreground">Chưa có tab menu nào</p>
                <p className="text-xs text-muted-foreground">
                  Bấm &quot;Thêm Tab cấp 1&quot; hoặc &quot;Tạo trang mới cho tab&quot; để xây thanh
                  điều hướng website.
                </p>
              </div>
            ) : (
              topItems.map((item, idx) => {
                const children = getChildren(item.id);
                return (
                  <div key={item.id} className="p-3.5 sm:p-4 space-y-2.5">
                    {/* Level 1 row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold truncate ${
                              item.isVisible
                                ? "text-foreground"
                                : "text-muted-foreground line-through"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                            {item.targetType}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                          {describeTarget(item)}
                        </p>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openCreateNav(item.id)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Thêm mục con (cấp 2)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Mục con</span>
                          </button>
                          <button
                            type="button"
                            disabled={idx === 0 || isPending}
                            onClick={() => handleMove(topItems, idx, -1)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === topItems.length - 1 || isPending}
                            onClick={() => handleMove(topItems, idx, 1)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleVisible(item)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            title={
                              item.isVisible ? "Đang hiện — bấm để ẩn" : "Đang ẩn — bấm để hiện"
                            }
                          >
                            {item.isVisible ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditNav(item)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            title="Sửa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Level 2 children */}
                    {children.length > 0 && (
                      <div className="pl-5 sm:pl-7 space-y-1.5 border-l-2 border-border/60 ml-2">
                        {children.map((child, cIdx) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/40"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-xs font-semibold truncate ${
                                      child.isVisible
                                        ? "text-foreground"
                                        : "text-muted-foreground line-through"
                                    }`}
                                  >
                                    {child.label}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-background text-muted-foreground uppercase">
                                    {child.targetType}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground font-mono truncate">
                                  {describeTarget(child)}
                                </p>
                              </div>
                            </div>

                            {canEdit && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  disabled={cIdx === 0 || isPending}
                                  onClick={() => handleMove(children, cIdx, -1)}
                                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={cIdx === children.length - 1 || isPending}
                                  onClick={() => handleMove(children, cIdx, 1)}
                                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleVisible(child)}
                                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background cursor-pointer"
                                >
                                  {child.isVisible ? (
                                    <Eye className="w-3 h-3" />
                                  ) : (
                                    <EyeOff className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditNav(child)}
                                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(child)}
                                  className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HEADER & NÚT NỔI */}
      {activeTab === "header" && (
        <div className="space-y-5 max-w-2xl">
          <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
            <h2 className="text-sm font-bold text-foreground">Thanh Header thương hiệu</h2>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Tên thương hiệu hiển thị
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                disabled={!canEdit}
                placeholder="VD: GỜ CAFÉ"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-input bg-background"
              />
            </div>

            <MediaPickerField
              label="Logo thương hiệu (Header & Footer)"
              mediaId={logoMediaId}
              mediaUrl={logoUrl}
              availableMedia={mediaList}
              onMediaAdded={(m) => setMediaList((prev) => [m, ...prev])}
              onChange={(mId, mUrl) => {
                setLogoMediaId(mId || null);
                setLogoUrl(mUrl || null);
              }}
            />

            <div className="pt-2 border-t border-border/60 space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Trang chủ mặc định khi truy cập tên miền gốc (<code>/</code>)
              </label>
              <p className="text-[11px] text-muted-foreground">
                Khi khách gõ thẳng tên miền (VD: <code>go-cafe.com</code>), hệ thống sẽ mở ngay
                trang đã chọn bên dưới.
              </p>
              <Select
                value={homePageSlug}
                disabled={!canEdit}
                onChange={setHomePageSlug}
                options={[
                  { value: "", label: "Mặc định hệ thống (chuyển sang /login)" },
                  ...initialData.availablePages
                    .filter((p) => p.status === "published")
                    .map((p) => ({
                      value: p.primarySlug,
                      label: `${p.internalName} (/${p.primarySlug})`,
                    })),
                ]}
              />
            </div>

            <label className="flex items-center justify-between gap-3 pt-2 border-t border-border/60 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Chỉ hiện Logo (ẩn chữ tên thương hiệu bên cạnh Logo)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Nên bật khi ảnh Logo đã chứa sẵn chữ thương hiệu để thanh Menu gọn hơn.
                </span>
              </div>
              <input
                type="checkbox"
                checked={hideSiteName}
                disabled={!canEdit}
                onChange={(e) => setHideSiteName(e.target.checked)}
                className="w-4 h-4 accent-foreground"
              />
            </label>

            <label className="flex items-center justify-between gap-3 pt-2 border-t border-border/60 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Dính thanh Menu trên cùng khi cuộn (Sticky Header)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Giúp khách chuyển tab dễ dàng khi đọc nội dung dài.
                </span>
              </div>
              <input
                type="checkbox"
                checked={stickyHeader}
                disabled={!canEdit}
                onChange={(e) => setStickyHeader(e.target.checked)}
                className="w-4 h-4 accent-foreground"
              />
            </label>

            {/* Kiểu chữ & Màu sắc thanh Navbar */}
            <div className="pt-3 border-t border-border/60 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Kiểu chữ & Màu sắc thanh Navbar
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Tuỳ chỉnh font chữ, cỡ chữ (px) và bộ màu cho thanh điều hướng.
                  </span>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setNavLayout("classic");
                      setNavHeight("default");
                      setLogoHeight(36);
                      setNavGap("normal");
                      setNavFont("lexend-deca");
                      setNavFontSize(13);
                      setNavUppercase(false);
                      setNavWeight("500");
                      setNavActiveStyle("text");
                      setNavBackdrop("glass");
                      setNavShadow("none");
                      setNavBorder(true);
                      setNavBgColor("#FFFFFF");
                      setNavTextColor("#111111");
                      setNavActiveColor("#B88A44");
                      setCtaBgColor("#111111");
                      setCtaTextColor("#FFFFFF");
                      setCtaRadius("xl");
                    }}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground underline cursor-pointer"
                  >
                    Mặc định Gờ
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Font chữ Navbar
                  </label>
                  <Select
                    value={navFont}
                    disabled={!canEdit}
                    onChange={(val) => setNavFont(val as FontId)}
                    options={FONT_IDS.map((f) => ({ value: f, label: FONT_LABELS[f] }))}
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Cỡ chữ ({navFontSize}px)
                  </label>
                  <input
                    type="number"
                    min={11}
                    max={20}
                    disabled={!canEdit}
                    value={navFontSize}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!isNaN(n)) setNavFontSize(Math.max(11, Math.min(20, n)));
                    }}
                    className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-input bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { label: "Màu nền Navbar", val: navBgColor, set: setNavBgColor },
                    { label: "Màu chữ Menu", val: navTextColor, set: setNavTextColor },
                    { label: "Màu tab đang chọn", val: navActiveColor, set: setNavActiveColor },
                  ] as const
                ).map(({ label, val, set }) => (
                  <div key={label} className="space-y-1">
                    <label className="block text-[11px] font-semibold text-muted-foreground">
                      {label}
                    </label>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-input bg-background">
                      <input
                        type="color"
                        disabled={!canEdit}
                        value={/^#[0-9a-f]{6}$/i.test(val) ? val : "#111111"}
                        onChange={(e) => set(e.target.value)}
                        className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        className="w-full text-xs font-mono bg-transparent focus:outline-hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bố cục, Chiều cao, Cỡ Logo, Khoảng cách */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Kiểu bố cục Navbar
                  </label>
                  <Select
                    value={navLayout}
                    disabled={!canEdit}
                    onChange={(val) => setNavLayout(val as SiteNavLayout)}
                    options={[
                      { value: "classic", label: "Chuẩn (Logo trái • Menu giữa • CTA phải)" },
                      { value: "left", label: "Hiện đại (Logo & Menu sát trái)" },
                      { value: "centered-logo", label: "Luxury (Logo chính giữa • Menu đối xứng)" },
                      { value: "floating-pill", label: "Thanh nổi bo tròn (Floating Pill)" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Hiệu ứng nền Navbar
                  </label>
                  <Select
                    value={navBackdrop}
                    disabled={!canEdit}
                    onChange={(val) => setNavBackdrop(val as SiteNavBackdrop)}
                    options={[
                      { value: "glass", label: "Kính mờ (Glassmorphism)" },
                      { value: "solid", label: "Nền đặc 100%" },
                      {
                        value: "transparent-top",
                        label: "Trong suốt đầu trang (cuộn mới hiện nền)",
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Chiều cao Navbar
                  </label>
                  <Select
                    value={navHeight}
                    disabled={!canEdit}
                    onChange={(val) => setNavHeight(val as SiteNavHeight)}
                    options={[
                      { value: "compact", label: "Gọn (56px)" },
                      { value: "default", label: "Chuẩn (64px)" },
                      { value: "tall", label: "Thoáng (80px)" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Khoảng cách các tab
                  </label>
                  <Select
                    value={navGap}
                    disabled={!canEdit}
                    onChange={(val) => setNavGap(val as SiteNavGap)}
                    options={[
                      { value: "compact", label: "Gọn (nhiều tab)" },
                      { value: "normal", label: "Vừa" },
                      { value: "wide", label: "Rộng thoáng" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Chiều cao Logo ({logoHeight}px)
                  </label>
                  <input
                    type="range"
                    min={24}
                    max={56}
                    step={2}
                    disabled={!canEdit}
                    value={logoHeight}
                    onChange={(e) => setLogoHeight(Number(e.target.value))}
                    className="w-full h-9 accent-primary"
                  />
                </div>
              </div>

              {/* Kiểu chữ, Độ đậm, Active Style, Viền & Đổ bóng */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Độ đậm chữ Menu
                  </label>
                  <Select
                    value={navWeight}
                    disabled={!canEdit}
                    onChange={(val) => setNavWeight(val as SiteNavWeight)}
                    options={[
                      { value: "500", label: "Vừa (Medium 500)" },
                      { value: "600", label: "Bán đậm (SemiBold 600)" },
                      { value: "700", label: "Đậm (Bold 700)" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Kiểu tab đang chọn (Active)
                  </label>
                  <Select
                    value={navActiveStyle}
                    disabled={!canEdit}
                    onChange={(val) => setNavActiveStyle(val as SiteNavActiveStyle)}
                    options={[
                      { value: "text", label: "Đổi màu chữ" },
                      { value: "underline", label: "Gạch chân màu nhấn" },
                      { value: "pill", label: "Nền viên thuốc bo tròn" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Đổ bóng Navbar
                  </label>
                  <Select
                    value={navShadow}
                    disabled={!canEdit}
                    onChange={(val) => setNavShadow(val as SiteNavShadow)}
                    options={[
                      { value: "none", label: "Không đổ bóng" },
                      { value: "sm", label: "Bóng nhẹ" },
                      { value: "md", label: "Bóng rõ" },
                    ]}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={navUppercase}
                    disabled={!canEdit}
                    onChange={(e) => setNavUppercase(e.target.checked)}
                    className="w-4 h-4 accent-foreground"
                  />
                  <span>IN HOA TOÀN BỘ MENU</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={navBorder}
                    disabled={!canEdit}
                    onChange={(e) => setNavBorder(e.target.checked)}
                    className="w-4 h-4 accent-foreground"
                  />
                  <span>Hiện đường viền dưới</span>
                </label>
              </div>

              {/* Mini preview thanh Navbar sống động */}
              <div className="rounded-2xl border border-border/80 overflow-hidden bg-muted/20">
                {announcementEnabled && announcementText.trim() && (
                  <div
                    className="px-3 py-1.5 text-center text-[11px] font-medium truncate"
                    style={{
                      backgroundColor: announcementBgColor || "#111111",
                      color: announcementTextColor || "#FFFFFF",
                    }}
                  >
                    {announcementText}
                  </div>
                )}
                <div className={navLayout === "floating-pill" ? "p-2.5" : ""}>
                  <div
                    className={`px-4 py-2.5 flex items-center justify-between gap-3 overflow-hidden transition-all ${
                      navLayout === "floating-pill"
                        ? "rounded-full shadow-md border border-black/10"
                        : ""
                    }`}
                    style={{
                      backgroundColor: navBgColor || "#FFFFFF",
                      color: navTextColor || "#111111",
                      fontFamily: FONT_STACKS[navFont],
                    }}
                  >
                    <span className="font-bold text-sm truncate">
                      {hideSiteName && logoUrl ? "● LOGO" : siteName || "GỜ CAFÉ"}
                    </span>
                    <div
                      className={`flex items-center gap-3 shrink-0 ${
                        navUppercase ? "uppercase tracking-wider" : ""
                      } ${
                        navWeight === "700"
                          ? "font-bold"
                          : navWeight === "600"
                            ? "font-semibold"
                            : "font-medium"
                      }`}
                      style={{ fontSize: `${navFontSize}px` }}
                    >
                      <span
                        className={
                          navActiveStyle === "underline"
                            ? "pb-0.5 border-b-2 font-semibold"
                            : navActiveStyle === "pill"
                              ? "px-2.5 py-0.5 rounded-full font-semibold"
                              : "font-semibold"
                        }
                        style={{
                          color: navActiveColor || "#B88A44",
                          borderBottomColor:
                            navActiveStyle === "underline"
                              ? navActiveColor || "#B88A44"
                              : undefined,
                          backgroundColor:
                            navActiveStyle === "pill"
                              ? `color-mix(in srgb, ${navActiveColor || "#B88A44"} 15%, transparent)`
                              : undefined,
                        }}
                      >
                        Trang chủ
                      </span>
                      <span className="opacity-85">Nhượng quyền</span>
                      <span className="opacity-85 hidden sm:inline">Hệ thống quán</span>
                    </div>
                    {ctaEnabled && ctaLabel.trim() && (
                      <span
                        className={`hidden sm:inline-flex px-2.5 py-1 text-[11px] font-semibold shrink-0 ${
                          ctaRadius === "full"
                            ? "rounded-full"
                            : ctaRadius === "md"
                              ? "rounded-md"
                              : "rounded-lg"
                        }`}
                        style={{
                          backgroundColor: ctaBgColor || "#111111",
                          color: ctaTextColor || "#FFFFFF",
                        }}
                      >
                        {ctaLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 space-y-3">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Hiển thị nút hành động nổi bật bên phải Header (CTA)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    VD: &quot;Đặt hàng&quot;, &quot;Liên hệ&quot; hoặc &quot;Nhận báo giá&quot;.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={ctaEnabled}
                  disabled={!canEdit}
                  onChange={(e) => setCtaEnabled(e.target.checked)}
                  className="w-4 h-4 accent-foreground"
                />
              </label>

              {ctaEnabled && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Nhãn nút CTA
                      </label>
                      <input
                        type="text"
                        value={ctaLabel}
                        disabled={!canEdit}
                        onChange={(e) => setCtaLabel(e.target.value)}
                        placeholder="VD: Liên hệ ngay"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Đường dẫn đích
                      </label>
                      <input
                        type="text"
                        value={ctaHref}
                        disabled={!canEdit}
                        onChange={(e) => setCtaHref(e.target.value)}
                        placeholder="VD: /lien-he hoặc tel:19009246"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-muted-foreground">
                        Màu nền nút CTA
                      </label>
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-input bg-background">
                        <input
                          type="color"
                          disabled={!canEdit}
                          value={/^#[0-9a-f]{6}$/i.test(ctaBgColor) ? ctaBgColor : "#111111"}
                          onChange={(e) => setCtaBgColor(e.target.value)}
                          className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={ctaBgColor}
                          onChange={(e) => setCtaBgColor(e.target.value)}
                          className="w-full text-xs font-mono bg-transparent focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-muted-foreground">
                        Màu chữ nút CTA
                      </label>
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-input bg-background">
                        <input
                          type="color"
                          disabled={!canEdit}
                          value={/^#[0-9a-f]{6}$/i.test(ctaTextColor) ? ctaTextColor : "#FFFFFF"}
                          onChange={(e) => setCtaTextColor(e.target.value)}
                          className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={ctaTextColor}
                          onChange={(e) => setCtaTextColor(e.target.value)}
                          className="w-full text-xs font-mono bg-transparent focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Bo góc nút CTA
                      </label>
                      <Select
                        value={ctaRadius}
                        disabled={!canEdit}
                        onChange={(val) => setCtaRadius(val as SiteCtaRadius)}
                        options={[
                          { value: "md", label: "Vuông nhẹ" },
                          { value: "xl", label: "Bo tròn chuẩn" },
                          { value: "full", label: "Viên thuốc (Pill)" },
                        ]}
                      />
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ctaShowOnMobile}
                      disabled={!canEdit}
                      onChange={(e) => setCtaShowOnMobile(e.target.checked)}
                      className="w-4 h-4 accent-foreground"
                    />
                    <span>Hiện nút CTA trực tiếp trên thanh đầu trang điện thoại (Mobile)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Thanh thông báo khuyến mãi trên cùng (Announcement Bar) */}
            <div className="pt-3 border-t border-border/60 space-y-3">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Thanh thông báo trên cùng (Announcement Bar)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Dải thông báo ưu đãi / sự kiện nằm phía trên thanh Navbar.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={announcementEnabled}
                  disabled={!canEdit}
                  onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                  className="w-4 h-4 accent-foreground"
                />
              </label>

              {announcementEnabled && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={announcementText}
                      disabled={!canEdit}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      placeholder="VD: Miễn phí gửi mẫu thử cà phê rang mộc 72H — Đăng ký ngay"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                    />
                    <input
                      type="text"
                      value={announcementHref}
                      disabled={!canEdit}
                      onChange={(e) => setAnnouncementHref(e.target.value)}
                      placeholder="Link khi bấm (VD: /xuong-rang-ca-phe)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-input bg-background">
                      <span className="text-[11px] text-muted-foreground shrink-0">Nền:</span>
                      <input
                        type="color"
                        disabled={!canEdit}
                        value={
                          /^#[0-9a-f]{6}$/i.test(announcementBgColor)
                            ? announcementBgColor
                            : "#111111"
                        }
                        onChange={(e) => setAnnouncementBgColor(e.target.value)}
                        className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={announcementBgColor}
                        onChange={(e) => setAnnouncementBgColor(e.target.value)}
                        className="w-full text-xs font-mono bg-transparent focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-input bg-background">
                      <span className="text-[11px] text-muted-foreground shrink-0">Chữ:</span>
                      <input
                        type="color"
                        disabled={!canEdit}
                        value={
                          /^#[0-9a-f]{6}$/i.test(announcementTextColor)
                            ? announcementTextColor
                            : "#FFFFFF"
                        }
                        onChange={(e) => setAnnouncementTextColor(e.target.value)}
                        className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={announcementTextColor}
                        onChange={(e) => setAnnouncementTextColor(e.target.value)}
                        className="w-full text-xs font-mono bg-transparent focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Cụm nút liên hệ nổi góc dưới phải (Gọi & Zalo)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hiển thị cố định ở góc dưới bên phải mọi Landing Page.
                </p>
              </div>
              <input
                type="checkbox"
                checked={floatingEnabled}
                disabled={!canEdit}
                onChange={(e) => setFloatingEnabled(e.target.checked)}
                className="w-4 h-4 accent-foreground"
              />
            </label>

            {floatingEnabled && (
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCall}
                        disabled={!canEdit}
                        onChange={(e) => setShowCall(e.target.checked)}
                        className="w-3.5 h-3.5 accent-foreground"
                      />
                      <span>Nút Gọi điện (Hotline)</span>
                    </label>
                    <input
                      type="text"
                      value={floatingPhone}
                      disabled={!canEdit || !showCall}
                      onChange={(e) => setFloatingPhone(e.target.value)}
                      placeholder="VD: 0779200020 hoặc 19009246"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showZalo}
                        disabled={!canEdit}
                        onChange={(e) => setShowZalo(e.target.checked)}
                        className="w-3.5 h-3.5 accent-foreground"
                      />
                      <span>Nút Nhắn Zalo</span>
                    </label>
                    <input
                      type="text"
                      value={floatingZalo}
                      disabled={!canEdit || !showZalo}
                      onChange={(e) => setFloatingZalo(e.target.value)}
                      placeholder="VD: 0779200020 hoặc https://zalo.me/..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Vị trí cụm nút nổi
                    </label>
                    <Select
                      size="sm"
                      value={floatingPosition}
                      disabled={!canEdit}
                      onChange={(v) => setFloatingPosition(v as "right" | "left")}
                      options={[
                        { value: "right", label: "Góc dưới bên phải" },
                        { value: "left", label: "Góc dưới bên trái" },
                      ]}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-end pb-1.5">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showBackToTop}
                        disabled={!canEdit}
                        onChange={(e) => setShowBackToTop(e.target.checked)}
                        className="w-3.5 h-3.5 accent-foreground"
                      />
                      <span>Hiện nút Lên đầu trang (Back-to-Top)</span>
                    </label>
                  </div>
                </div>

                {/* Nút nổi tùy biến (Messenger, TikTok, Maps, Link...) */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Nút nổi mở rộng ({customFloatingButtons.length}/6)
                    </span>
                    {canEdit && customFloatingButtons.length < 6 && (
                      <button
                        type="button"
                        onClick={() =>
                          setCustomFloatingButtons((prev) => [
                            ...prev,
                            {
                              id: `fb-${Date.now()}`,
                              label: "Messenger",
                              href: "",
                              icon: "messenger",
                              bgColor: "#0084FF",
                              textColor: "#FFFFFF",
                            },
                          ])
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold hover:bg-muted cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Thêm nút nổi
                      </button>
                    )}
                  </div>

                  {customFloatingButtons.map((btn, idx) => (
                    <div
                      key={btn.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl border border-border/70 bg-muted/20 items-center"
                    >
                      <div className="sm:col-span-3">
                        <Select
                          size="sm"
                          value={btn.icon}
                          disabled={!canEdit}
                          onChange={(v) =>
                            setCustomFloatingButtons((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, icon: v as SiteFloatingButtonIcon } : x
                              )
                            )
                          }
                          options={[
                            { value: "messenger", label: "Messenger" },
                            { value: "zalo", label: "Zalo" },
                            { value: "phone", label: "Điện thoại" },
                            { value: "tiktok", label: "TikTok" },
                            { value: "maps", label: "Google Maps" },
                            { value: "link", label: "Link khác" },
                          ]}
                          className="w-full"
                        />
                      </div>
                      <input
                        type="text"
                        value={btn.label}
                        disabled={!canEdit}
                        onChange={(e) =>
                          setCustomFloatingButtons((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x))
                          )
                        }
                        placeholder="Tên nút (VD: Chat Messenger)"
                        className="sm:col-span-3 px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background"
                      />
                      <input
                        type="text"
                        value={btn.href}
                        disabled={!canEdit}
                        onChange={(e) =>
                          setCustomFloatingButtons((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, href: e.target.value } : x))
                          )
                        }
                        placeholder="https://m.me/... hoặc /slug"
                        className="sm:col-span-4 px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background"
                      />
                      <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
                        <input
                          type="color"
                          value={btn.bgColor || "#111111"}
                          disabled={!canEdit}
                          onChange={(e) =>
                            setCustomFloatingButtons((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, bgColor: e.target.value } : x))
                            )
                          }
                          title="Màu nền nút"
                          className="w-7 h-7 rounded border border-input cursor-pointer p-0.5 bg-background"
                        />
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              setCustomFloatingButtons((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label="Xóa nút nổi"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Favicon riêng & Liên kết pháp lý cuối trang */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Favicon &amp; Liên kết pháp lý cuối trang (White-Label)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tùy chỉnh biểu tượng trên tab trình duyệt và các liên kết Điều khoản / Chính sách bảo
                mật riêng cho thương hiệu này.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  URL Favicon riêng (ảnh vuông .png / .ico / .svg)
                </label>
                <input
                  type="text"
                  value={faviconUrl}
                  disabled={!canEdit}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="https://... hoặc /logo-gocafe.png"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Dòng bản quyền (Copyright)
                </label>
                <input
                  type="text"
                  value={copyrightText}
                  disabled={!canEdit}
                  onChange={(e) => setCopyrightText(e.target.value)}
                  placeholder="VD: © 2026 Công ty TNHH Gờ Cafe"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Liên kết pháp lý cuối trang ({legalLinks.length}/6)
                </span>
                {canEdit && legalLinks.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setLegalLinks((prev) => [...prev, { label: "", href: "" }])}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold hover:bg-muted cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm liên kết
                  </button>
                )}
              </div>
              {legalLinks.map((lnk, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={lnk.label}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setLegalLinks((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x))
                      )
                    }
                    placeholder="VD: Chính sách bảo mật"
                    className="sm:col-span-5 px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background"
                  />
                  <input
                    type="text"
                    value={lnk.href}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setLegalLinks((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, href: e.target.value } : x))
                      )
                    }
                    placeholder="VD: /chinh-sach-bao-mat hoặc https://..."
                    className="sm:col-span-6 px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background"
                  />
                  <div className="sm:col-span-1 flex justify-end">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setLegalLinks((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label="Xóa liên kết pháp lý"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-3.5">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Tracking &amp; Pixel Quảng cáo (tuỳ chọn)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tự động gắn mã đo lường cho mọi Landing Page và tự bắn sự kiện <strong>Lead</strong>{" "}
                khi khách gửi form tư vấn thành công.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Google Analytics 4 (GA4)
                </label>
                <input
                  type="text"
                  value={ga4Id}
                  disabled={!canEdit}
                  onChange={(e) => setGa4Id(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-input bg-background"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Meta / Facebook Pixel ID
                </label>
                <input
                  type="text"
                  value={fbPixelId}
                  disabled={!canEdit}
                  onChange={(e) => setFbPixelId(e.target.value)}
                  placeholder="123456789012345"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-input bg-background"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  TikTok Pixel ID
                </label>
                <input
                  type="text"
                  value={tiktokPixelId}
                  disabled={!canEdit}
                  onChange={(e) => setTiktokPixelId(e.target.value)}
                  placeholder="CXXXXXXXXXXXXX"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-input bg-background"
                />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-3.5">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Thông báo Khách hàng mới (Telegram / Webhook riêng)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mỗi khi có khách điền Form trên Landing Page của Workspace này, hệ thống sẽ tự động
                bắn tin nhắn về nhóm Telegram hoặc Webhook (n8n, Make, Google Sheets, CRM) của riêng
                bạn.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Telegram Bot Token
                </label>
                <input
                  type="password"
                  value={telegramBotToken}
                  disabled={!canEdit}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="123456:ABC-DEF..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-input bg-background"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Telegram Chat / Group ID
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  disabled={!canEdit}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="-1001234567890"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-input bg-background"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Webhook URL (https://)
                </label>
                <input
                  type="url"
                  value={leadWebhookUrl}
                  disabled={!canEdit}
                  onChange={(e) => setLeadWebhookUrl(e.target.value)}
                  placeholder="https://hook.eu2.make.com/..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-input bg-background"
                />
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveSettings}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Lưu cấu hình Header & Nút nổi</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FOOTER ĐỘNG (1–4 CỘT + GIAO DIỆN + PREVIEW) */}
      {activeTab === "footer" && (
        <div className="space-y-5 max-w-4xl">
          {/* Gợi ý đường dẫn nội bộ cho tất cả ô link trong Footer */}
          <datalist id="site-footer-internal-links">
            {initialData.availablePages
              .filter((p) => p.status === "published")
              .map((p) => (
                <option key={p.id} value={`/${p.primarySlug}`}>
                  {p.internalName}
                </option>
              ))}
          </datalist>

          {/* 1. GIAO DIỆN & XEM TRƯỚC FOOTER */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Giao diện &amp; Bố cục Chân trang (Footer)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chọn nhanh phong cách hoặc tùy chỉnh màu sắc, font chữ, khoảng đệm theo thương
                  hiệu.
                </p>
              </div>
              {canEdit && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { name: "Kem Gờ", bg: "#F8F7F4", text: "#111111", accent: "#B88A44" },
                      { name: "Đen sang trọng", bg: "#111111", text: "#FFFFFF", accent: "#B88A44" },
                      { name: "Trắng tối giản", bg: "#FFFFFF", text: "#111111", accent: "#111111" },
                      { name: "Nâu Espresso", bg: "#2C1E16", text: "#F7EFE5", accent: "#D4A373" },
                      { name: "Xanh Rừng", bg: "#132A23", text: "#F2F7F5", accent: "#C9A25B" },
                      { name: "Xanh Navy", bg: "#0F172A", text: "#F8FAFC", accent: "#38BDF8" },
                      { name: "Đỏ Burgundy", bg: "#3A1219", text: "#FDF2F4", accent: "#E5B869" },
                      { name: "Xám Khói", bg: "#F1F5F9", text: "#0F172A", accent: "#B88A44" },
                    ] as const
                  ).map((preset) => {
                    const active =
                      footerBgColor.toLowerCase() === preset.bg.toLowerCase() &&
                      footerTextColor.toLowerCase() === preset.text.toLowerCase();
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setFooterBgColor(preset.bg);
                          setFooterTextColor(preset.text);
                          setFooterAccentColor(preset.accent);
                        }}
                        style={{ backgroundColor: preset.bg, color: preset.text }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all hover:opacity-90 ${
                          active ? "ring-2 ring-amber-500 border-amber-500" : "border-black/15"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/40"
                          style={{ backgroundColor: preset.accent }}
                        />
                        <span>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6 min-w-0">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Kiểu bố cục
                </label>
                <Select
                  value={footerLayout}
                  disabled={!canEdit}
                  onChange={(val) => setFooterLayout(val as SiteFooterLayout)}
                  className="w-full"
                  options={[
                    { value: "columns", label: "Đa cột (1–4 cột)" },
                    { value: "centered", label: "Căn giữa tối giản" },
                  ]}
                />
              </div>
              <div className="sm:col-span-6 min-w-0">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Độ thoáng (Padding)
                </label>
                <Select
                  value={footerPadding}
                  disabled={!canEdit}
                  onChange={(val) => setFooterPadding(val as SiteFooterPadding)}
                  className="w-full"
                  options={[
                    { value: "compact", label: "Gọn" },
                    { value: "default", label: "Chuẩn" },
                    { value: "spacious", label: "Rộng thoáng" },
                  ]}
                />
              </div>
              <div className="sm:col-span-8 min-w-0">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Font chữ Footer
                </label>
                <Select
                  value={footerFont}
                  disabled={!canEdit}
                  onChange={(val) => setFooterFont(val as FontId)}
                  className="w-full"
                  options={FONT_IDS.map((f) => ({ value: f, label: FONT_LABELS[f] }))}
                />
              </div>
              <div className="sm:col-span-4 min-w-0">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Cỡ chữ ({footerFontSize}px)
                </label>
                <input
                  type="number"
                  min={12}
                  max={16}
                  disabled={!canEdit}
                  value={footerFontSize}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n)) setFooterFontSize(Math.max(12, Math.min(16, n)));
                  }}
                  className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-input bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { label: "Màu nền Footer", val: footerBgColor, set: setFooterBgColor },
                  { label: "Màu chữ nội dung", val: footerTextColor, set: setFooterTextColor },
                  { label: "Màu tiêu đề cột", val: footerAccentColor, set: setFooterAccentColor },
                ] as const
              ).map(({ label, val, set }) => (
                <div key={label} className="space-y-1">
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    {label}
                  </label>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-input bg-background">
                    <input
                      type="color"
                      disabled={!canEdit}
                      value={/^#[0-9a-f]{6}$/i.test(val) ? val : "#111111"}
                      onChange={(e) => set(e.target.value)}
                      className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      className="w-full text-xs font-mono bg-transparent focus:outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={footerShowLogo}
                disabled={!canEdit}
                onChange={(e) => setFooterShowLogo(e.target.checked)}
                className="w-4 h-4 accent-foreground"
              />
              <span>Hiển thị Logo thương hiệu phía trên chân trang</span>
            </label>

            {/* Live Mini-Footer Preview */}
            <div
              className="rounded-2xl border border-border/80 p-5 space-y-4 overflow-hidden"
              style={{
                backgroundColor: footerBgColor || "#F8F7F4",
                color: footerTextColor || "#111111",
                fontFamily: FONT_STACKS[footerFont],
              }}
            >
              {footerShowLogo && (
                <div
                  className={`flex items-center gap-2 text-xs font-bold ${
                    footerLayout === "centered" ? "justify-center" : ""
                  }`}
                >
                  <span>● {siteName || "GỜ CAFÉ"}</span>
                </div>
              )}
              {footerLayout === "centered" ? (
                <div className="text-center space-y-2 text-[11px] opacity-85">
                  <p className="line-clamp-2">
                    {footerColumns[0]?.description || "Thông tin thương hiệu..."}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 font-medium">
                    {footerColumns
                      .flatMap((c) => c.links || [])
                      .slice(0, 5)
                      .map((l, idx) => (
                        <span key={idx}>{l.label || "Liên kết"}</span>
                      ))}
                  </div>
                </div>
              ) : (
                <div
                  className={`grid grid-cols-1 gap-4 ${
                    footerColumns.length === 2
                      ? "sm:grid-cols-2"
                      : footerColumns.length === 3
                        ? "sm:grid-cols-3"
                        : footerColumns.length >= 4
                          ? "sm:grid-cols-4"
                          : ""
                  }`}
                >
                  {footerColumns.map((c, idx) => (
                    <div key={idx} className="space-y-1 min-w-0">
                      <div
                        className="text-[10px] font-bold uppercase tracking-wider truncate"
                        style={{ color: footerAccentColor || "#B88A44" }}
                      >
                        {c.title || `Cột ${idx + 1}`}
                      </div>
                      {c.description && (
                        <p className="text-[11px] opacity-75 line-clamp-2 whitespace-pre-line">
                          {c.description}
                        </p>
                      )}
                      {(c.links || []).slice(0, 3).map((l, i) => (
                        <div key={i} className="text-[11px] opacity-80 truncate">
                          {l.label || "Liên kết"}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-3 border-t border-current/15 flex items-center justify-between text-[10px] opacity-70">
                <span>
                  {copyrightText || `© ${new Date().getFullYear()} ${siteName || "Gờ Café"}`}
                </span>
                <span>Xem trước Footer</span>
              </div>
            </div>
          </div>

          {/* 2. CÁC CỘT NỘI DUNG FOOTER (TỐI ĐA 4 CỘT) */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Nội dung các cột Footer ({footerColumns.length}/4 cột)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Có thể thêm tới 4 cột, đổi thứ tự cột và gõ <code>/</code> trong ô link để chọn
                nhanh trang nội bộ.
              </p>
            </div>
            {canEdit && footerColumns.length < 4 && (
              <button
                type="button"
                onClick={() =>
                  setFooterColumns((prev) => [
                    ...prev,
                    { title: `Cột ${prev.length + 1}`, description: "", links: [] },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm cột</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {footerColumns.map((col, colIdx) => (
              <div
                key={colIdx}
                className="p-5 rounded-2xl border border-border/80 bg-card space-y-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Cột #{colIdx + 1}</span>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={colIdx === 0}
                        onClick={() =>
                          setFooterColumns((prev) => {
                            const next = [...prev];
                            [next[colIdx - 1], next[colIdx]] = [next[colIdx], next[colIdx - 1]];
                            return next;
                          })
                        }
                        title="Đưa cột lên trước"
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-35 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={colIdx === footerColumns.length - 1}
                        onClick={() =>
                          setFooterColumns((prev) => {
                            const next = [...prev];
                            [next[colIdx + 1], next[colIdx]] = [next[colIdx], next[colIdx + 1]];
                            return next;
                          })
                        }
                        title="Đưa cột xuống sau"
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-35 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFooterColumns((prev) => prev.filter((_, i) => i !== colIdx))
                        }
                        className="ml-2 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Xóa cột
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Tiêu đề cột
                  </label>
                  <input
                    type="text"
                    value={col.title}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFooterColumns((prev) =>
                        prev.map((c, i) => (i === colIdx ? { ...c, title: e.target.value } : c))
                      )
                    }
                    placeholder="VD: Thông tin công ty / Liên kết nhanh / Liên hệ"
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-input bg-background"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Nội dung / Địa chỉ / Thông tin liên hệ (tuỳ chọn — nhấn Enter để xuống dòng)
                  </label>
                  <textarea
                    rows={5}
                    value={col.description || ""}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFooterColumns((prev) =>
                        prev.map((c, i) =>
                          i === colIdx ? { ...c, description: e.target.value } : c
                        )
                      )
                    }
                    placeholder="VD: Công ty TNHH Gờ Cafe&#10;Điện thoại: 1900-9246&#10;Email: info@go-cafe.com&#10;Địa chỉ: ..."
                    className="w-full px-3.5 py-2.5 text-xs leading-relaxed rounded-xl border border-input bg-background resize-y"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Liên kết trong cột ({(col.links || []).length})
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          setFooterColumns((prev) =>
                            prev.map((c, i) =>
                              i === colIdx
                                ? { ...c, links: [...(c.links || []), { label: "", href: "/" }] }
                                : c
                            )
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Thêm liên kết</span>
                      </button>
                    )}
                  </div>

                  {(col.links || []).map((lnk, lIdx) => (
                    <div key={lIdx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={lnk.label}
                        disabled={!canEdit}
                        onChange={(e) =>
                          setFooterColumns((prev) =>
                            prev.map((c, i) =>
                              i === colIdx
                                ? {
                                    ...c,
                                    links: (c.links || []).map((l, j) =>
                                      j === lIdx ? { ...l, label: e.target.value } : l
                                    ),
                                  }
                                : c
                            )
                          )
                        }
                        placeholder="Tên liên kết"
                        className="col-span-5 px-2.5 py-2 text-xs rounded-lg border border-input bg-background"
                      />
                      <input
                        type="text"
                        list="site-footer-internal-links"
                        value={lnk.href}
                        disabled={!canEdit}
                        onChange={(e) =>
                          setFooterColumns((prev) =>
                            prev.map((c, i) =>
                              i === colIdx
                                ? {
                                    ...c,
                                    links: (c.links || []).map((l, j) =>
                                      j === lIdx ? { ...l, href: e.target.value } : l
                                    ),
                                  }
                                : c
                            )
                          )
                        }
                        placeholder="/duong-dan hoặc https://..."
                        className="col-span-6 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-input bg-background"
                      />
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() =>
                            setFooterColumns((prev) =>
                              prev.map((c, i) =>
                                i === colIdx
                                  ? { ...c, links: (c.links || []).filter((_, j) => j !== lIdx) }
                                  : c
                              )
                            )
                          }
                          className="col-span-1 p-1.5 text-muted-foreground hover:text-red-600 cursor-pointer justify-self-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-3">
            <div>
              <h3 className="text-xs font-bold text-foreground">
                Mạng xã hội hiển thị ở chân trang (tuỳ chọn)
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Dán đường dẫn đầy đủ (<code>https://...</code>) cho các kênh muốn hiển thị ở góc
                phải cuối Footer.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  {
                    label: "Facebook",
                    val: socialFacebook,
                    set: setSocialFacebook,
                    ph: "https://facebook.com/gocafe",
                  },
                  {
                    label: "TikTok",
                    val: socialTiktok,
                    set: setSocialTiktok,
                    ph: "https://tiktok.com/@gocafe",
                  },
                  {
                    label: "Instagram",
                    val: socialInstagram,
                    set: setSocialInstagram,
                    ph: "https://instagram.com/gocafe",
                  },
                  {
                    label: "Shopee",
                    val: socialShopee,
                    set: setSocialShopee,
                    ph: "https://shopee.vn/gocafe",
                  },
                  {
                    label: "YouTube",
                    val: socialYoutube,
                    set: setSocialYoutube,
                    ph: "https://youtube.com/@gocafe",
                  },
                ] as const
              ).map(({ label, val, set, ph }) => (
                <div key={label}>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    {label}
                  </label>
                  <input
                    type="url"
                    value={val}
                    disabled={!canEdit}
                    onChange={(e) => set(e.target.value)}
                    placeholder={ph}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-input bg-background"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-2">
            <label className="block text-xs font-semibold text-muted-foreground">
              Dòng bản quyền cuối trang (Copyright)
            </label>
            <input
              type="text"
              value={copyrightText}
              disabled={!canEdit}
              onChange={(e) => setCopyrightText(e.target.value)}
              placeholder="VD: © 2026 GỜ CÀFÊ. All rights reserved."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-input bg-background"
            />
          </div>

          {canEdit && (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveSettings}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Lưu cấu hình Footer</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL THÊM / SỬA MỤC MENU */}
      {navModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground">
                {navModal.mode === "create-page"
                  ? "Tạo Landing Page mới cho Tab"
                  : navModal.mode === "create"
                    ? navModal.parentId
                      ? "Thêm mục con (Cấp 2)"
                      : "Thêm Tab cấp 1"
                    : "Chỉnh sửa mục Menu"}
              </h3>
              <button
                type="button"
                onClick={() => setNavModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNavModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Tên hiển thị trên Menu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formLabel}
                  onChange={(e) =>
                    navModal.mode === "create-page"
                      ? handleLabelToSlug(e.target.value)
                      : setFormLabel(e.target.value)
                  }
                  placeholder="VD: Nhượng quyền, Xưởng rang, Hệ thống quán"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                />
              </div>

              {navModal.mode === "create-page" ? (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Đường dẫn (Slug) cho trang mới <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-input bg-muted/30 overflow-hidden">
                    <span className="px-2.5 text-xs text-muted-foreground">/</span>
                    <input
                      type="text"
                      required
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value.toLowerCase().trim())}
                      placeholder="nhuong-quyen"
                      className="w-full py-2 pr-3 text-xs bg-transparent focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Hệ thống sẽ tự khởi tạo 1 Landing Page mẫu Gờ Minimal Luxury và gắn thẳng vào
                    menu.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Loại liên kết đích
                    </label>
                    <Select
                      value={formTargetType}
                      onChange={(val) => setFormTargetType(val as SiteNavTargetType)}
                      options={[
                        { value: "page", label: "Trang nội bộ trong hệ thống" },
                        { value: "anchor", label: "Nhảy tới mục lục (#anchor)" },
                        { value: "url", label: "Đường dẫn tuỳ chỉnh (https://...)" },
                      ]}
                    />
                  </div>

                  {formTargetType === "page" ? (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Chọn trang đích
                      </label>
                      {initialData.availablePages.length === 0 ? (
                        <p className="text-xs text-amber-600">
                          Chưa có trang nào. Hãy dùng nút &quot;Tạo trang mới cho tab&quot;.
                        </p>
                      ) : (
                        <Select
                          value={formTargetPageId}
                          onChange={(val) => setFormTargetPageId(val)}
                          options={initialData.availablePages.map((p) => ({
                            value: p.id,
                            label: `${p.internalName} (/${p.primarySlug})${
                              p.status !== "published" ? " • Nháp" : ""
                            }`,
                          }))}
                        />
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        {formTargetType === "anchor" ? "Mã neo (#anchor)" : "Đường dẫn URL"}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formTargetValue}
                          onChange={(e) => setFormTargetValue(e.target.value)}
                          placeholder={
                            formTargetType === "anchor" ? "#bang-gia" : "https://go-cafe.com"
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                        />
                        {formTargetType === "url" && (
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setNavModal(null)}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl border border-border hover:bg-muted cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending || !formLabel.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {navModal.mode === "create-page"
                      ? "Tạo trang & gắn Tab"
                      : navModal.mode === "create"
                        ? "Thêm vào Menu"
                        : "Lưu thay đổi"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẠO / ĐỔI TÊN BỘ MENU (SITE SHELL) */}
      {shellModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setShellModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground">
                {shellModal === "create"
                  ? "Tạo bộ Menu / Website mới"
                  : "Đổi tên bộ Menu / Website"}
              </h3>
              <button
                type="button"
                onClick={() => setShellModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitShellModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Tên bộ Menu / Website <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={shellNameInput}
                  onChange={(e) => setShellNameInput(e.target.value)}
                  placeholder="VD: Website Thương hiệu mới / Landing Nhượng quyền"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Mỗi bộ có thanh Menu 2 cấp, Logo, Màu sắc, Footer và Nút nổi hoàn toàn độc lập.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShellModal(null)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-border hover:bg-muted cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending || !shellNameInput.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{shellModal === "create" ? "Tạo bộ mới" : "Lưu tên"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE SHELL */}
      <ConfirmDialog
        open={deleteShellConfirm}
        variant="danger"
        title="Xóa bộ Menu / Website này?"
        description={`Bộ "${initialData.activeShellName}" cùng toàn bộ các tab Menu bên trong sẽ bị xóa. Các trang Landing Page đang gắn bộ này sẽ tự chuyển về bộ Menu mặc định.`}
        confirmLabel="Xóa bộ này"
        loading={isPending}
        onConfirm={handleConfirmDeleteShell}
        onCancel={() => setDeleteShellConfirm(false)}
      />

      {/* CONFIRM DELETE NAV ITEM */}
      <ConfirmDialog
        open={deleteTarget !== null}
        variant="danger"
        title="Xóa mục Menu?"
        description={
          deleteTarget
            ? `Mục "${deleteTarget.label}" (và các mục con bên trong nếu có) sẽ bị xóa khỏi thanh điều hướng.`
            : ""
        }
        confirmLabel="Xóa"
        loading={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
