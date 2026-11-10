"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Globe,
  Smartphone,
  Monitor,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Layers,
  Palette,
  Settings,
  Copy,
  ChevronDown,
  LayoutDashboard,
  FileText,
  Link2,
  Image as ImageIcon,
  BarChart3,
  Heading,
  AlignLeft,
  Share2,
  Maximize2,
  Minus,
  Sparkles,
} from "lucide-react";
import type {
  PageEditorData,
  EditorBlockItem,
  PageThemeConfig,
  PageSeoConfig,
  BlockType,
} from "../../types";
import { LivePreview } from "./live-preview";
import { ThemeEditor } from "./theme-editor";
import { SeoEditor } from "./seo-editor";
import { BlockItemEditor } from "./block-item-editor";
import {
  saveDraftAction,
  publishPageAction,
  unpublishPageAction,
  createPageAction,
  renameSlugAction,
} from "../../actions";

interface PageEditorProps {
  initialData: PageEditorData;
  isNew?: boolean;
}

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

interface ConfirmModalState {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant: "primary" | "danger";
  onConfirm: () => void;
}

export function PageEditor({ initialData, isNew = false }: PageEditorProps) {
  const router = useRouter();
  // Đồng bộ phát hiện chế độ tạo mới dựa trên cả prop isNew và ID trang khởi tạo để tránh hydration mismatch
  const isCreatingNew = Boolean(isNew || initialData.page.id === "new");

  const [page, setPage] = useState(initialData.page);
  const [draftRev, setDraftRev] = useState(initialData.draftRevision);
  const [internalName, setInternalName] = useState(initialData.page.internalName);
  const [slug, setSlug] = useState(initialData.primarySlug);
  const [title, setTitle] = useState(initialData.draftRevision.title);
  const [description, setDescription] = useState(initialData.draftRevision.description || "");
  const [themeConfig, setThemeConfig] = useState<PageThemeConfig>(
    initialData.draftRevision.theme || { preset: "go-original" }
  );
  const [seo, setSeo] = useState<PageSeoConfig>(initialData.draftRevision.seo || {});
  const [blocks, setBlocks] = useState<EditorBlockItem[]>(initialData.blocks);
  const [mediaList, setMediaList] = useState(initialData.availableMedia);

  const handleMediaAdded = useCallback(
    (newMedia: { id: string; originalFilename: string | null; publicUrl: string | null }) => {
      setMediaList((prev) => [newMedia, ...prev]);
    },
    []
  );

  const [activeTab, setActiveTab] = useState<"blocks" | "theme" | "seo">("blocks");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [mobileViewMode, setMobileViewMode] = useState<"edit" | "preview">("edit");
  const [isDirty, setIsDirty] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  // Kích thước co giãn linh hoạt của cột điều khiển bên trái (Split Pane Resizer)
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(500);
  const [isResizingSplit, setIsResizingSplit] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gocafe_editor_panel_width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 380 && parsed <= 950) {
          setLeftPanelWidth(parsed);
        }
      }
    } catch {}
  }, []);

  const handleSplitPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsResizingSplit(true);
  };

  const handleSplitPointerMove = (e: React.PointerEvent) => {
    if (!isResizingSplit) return;
    const minWidth = 380;
    const maxWidth = Math.max(minWidth, Math.min(window.innerWidth - 420, 950));
    const nextWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
    setLeftPanelWidth(nextWidth);
  };

  const handleSplitPointerUp = (e: React.PointerEvent) => {
    if (isResizingSplit) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setIsResizingSplit(false);
      try {
        localStorage.setItem("gocafe_editor_panel_width", String(leftPanelWidth));
      } catch {}
    }
  };

  const handleResetPanelWidth = () => {
    setLeftPanelWidth(500);
    try {
      localStorage.setItem("gocafe_editor_panel_width", "500");
    } catch {}
  };

  const [isPending, startTransition] = useTransition();

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Tự động tạo slug gợi ý khi gõ tên nội bộ lúc tạo trang mới
  const handleInternalNameChange = (val: string) => {
    setInternalName(val);
    setIsDirty(true);
    if (isCreatingNew) {
      const generated = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  // Thêm khối mới (Hỗ trợ toàn bộ 8 loại khối chuẩn)
  const handleAddBlock = (type: BlockType) => {
    let payload: Record<string, unknown> = {};
    if (type === "header") {
      payload = {
        title: title || "GỜ CAFÉ",
        bio: "",
        avatarMediaId: undefined,
        avatarUrl: undefined,
        bannerMediaId: undefined,
        bannerUrl: undefined,
      };
    }
    if (type === "heading") payload = { text: "Tiêu đề mục mới", level: 2 };
    if (type === "text") payload = { content: "Nội dung văn bản giới thiệu...", align: "center" };
    if (type === "image") {
      payload = {
        mediaAssetId: undefined,
        imageUrl: undefined,
        caption: "",
        alt: "",
        targetUrl: "",
      };
    }
    if (type === "link_list") payload = { layout: "stack" };
    if (type === "social_icons") payload = { style: "colored" };
    if (type === "spacer") payload = { height: "md" };
    if (type === "divider") payload = { style: "solid" };

    const newBlock: EditorBlockItem = {
      id: crypto.randomUUID(),
      type,
      position: blocks.length,
      isVisible: true,
      payload,
      placements: [],
    };

    setBlocks([...blocks, newBlock]);
    setIsDirty(true);
    showToast(`Đã thêm khối mới: ${getBlockName(type)}`, "info");
  };

  const getBlockName = (type: BlockType) => {
    switch (type) {
      case "header":
        return "Tiêu đề & Avatar";
      case "heading":
        return "Tiêu đề mục";
      case "text":
        return "Đoạn văn bản";
      case "image":
        return "Hình ảnh / Banner";
      case "link_list":
        return "Danh sách liên kết";
      case "social_icons":
        return "Mạng xã hội";
      case "spacer":
        return "Khoảng cách";
      case "divider":
        return "Đường kẻ";
    }
  };

  const handleUpdateBlock = (index: number, updated: EditorBlockItem) => {
    const copy = [...blocks];
    copy[index] = updated;
    setBlocks(copy);
    setIsDirty(true);
  };

  const handleDeleteBlock = (index: number) => {
    const blockToDelete = blocks[index];
    setConfirmModal({
      title: "Xóa khối nội dung này?",
      description: `Bạn có chắc chắn muốn xóa "${getBlockName(blockToDelete.type)}"? Hành động này không thể hoàn tác sau khi lưu.`,
      confirmLabel: "Xóa khối",
      confirmVariant: "danger",
      onConfirm: () => {
        const copy = blocks.filter((_, i) => i !== index);
        const reordered = copy.map((b, i) => ({ ...b, position: i }));
        setBlocks(reordered);
        setIsDirty(true);
        setConfirmModal(null);
        showToast("Đã xóa khối nội dung.", "info");
      },
    });
  };

  const handleDuplicateBlock = (index: number) => {
    const original = blocks[index];
    const duplicated: EditorBlockItem = {
      ...original,
      id: crypto.randomUUID(),
      position: index + 1,
      payload: JSON.parse(JSON.stringify(original.payload)),
      placements: original.placements
        ? original.placements.map((p) => ({ ...p, id: crypto.randomUUID() }))
        : [],
    };
    const updated = [
      ...blocks.slice(0, index + 1),
      duplicated,
      ...blocks.slice(index + 1),
    ].map((b, i) => ({ ...b, position: i }));
    setBlocks(updated);
    setIsDirty(true);
    showToast(`Đã nhân bản khối "${getBlockName(original.type)}".`, "info");
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    const reordered = copy.map((b, i) => ({ ...b, position: i }));
    setBlocks(reordered);
    setIsDirty(true);
  };

  // Lưu bản nháp (Hỗ trợ cả tạo mới trang lẫn cập nhật trang cũ)
  const handleSaveDraft = useCallback(() => {
    startTransition(async () => {
      // 1. Trường hợp tạo trang mới
      if (isCreatingNew) {
        const createRes = await createPageAction({
          internalName: internalName || "Trang hồ sơ mới",
          slug: slug || `trang-${Date.now().toString().slice(-4)}`,
          title: title || internalName || "GỜ CAFÉ",
        });

        if (!createRes.success || !createRes.pageId) {
          showToast(createRes.error || "Không thể khởi tạo trang mới", "error");
          return;
        }

        const newPageId = createRes.pageId;

        // Lưu cấu hình vào draft vừa tạo
        const saveRes = await saveDraftAction({
          pageId: newPageId,
          expectedDraftVersion: 1,
          title: title || internalName || "GỜ CAFÉ",
          description,
          theme: themeConfig,
          seo,
          blocks,
        });

        if (!saveRes.success) {
          showToast(saveRes.error || "Lỗi lưu cấu hình trang mới", "error");
          router.replace(`/admin/pages/${newPageId}`);
          return;
        }

        setIsDirty(false);
        showToast("Đã tạo trang và lưu bản nháp thành công!", "success");
        router.replace(`/admin/pages/${newPageId}`);
        return;
      }

      // 2. Trường hợp trang đã tồn tại - kiểm tra đổi slug nếu có
      if (slug && slug !== initialData.primarySlug) {
        const renameRes = await renameSlugAction(page.id, slug, page.lockVersion);
        if (!renameRes.success) {
          showToast(renameRes.error || "Không thể đổi slug", "error");
          return;
        }
      }

      const res = await saveDraftAction({
        pageId: page.id,
        draftId: draftRev.id,
        expectedDraftVersion: draftRev.lockVersion,
        title,
        description,
        theme: themeConfig,
        seo,
        blocks,
      });

      if (res.success && res.newLockVersion) {
        setDraftRev((prev) => ({
          ...prev,
          id: res.draftId || prev.id,
          lockVersion: res.newLockVersion,
          state: "draft",
        }));
        setIsDirty(false);
        showToast("Đã lưu bản nháp thành công!", "success");
      } else {
        showToast(res.error || "Không thể lưu bản nháp", "error");
      }
    });
  }, [
    isCreatingNew,
    internalName,
    slug,
    title,
    description,
    themeConfig,
    seo,
    blocks,
    page.id,
    page.lockVersion,
    draftRev.id,
    draftRev.lockVersion,
    initialData.primarySlug,
    router,
    showToast,
  ]);

  // Phím tắt Ctrl+S / Cmd+S để lưu nhanh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveDraft]);

  // Xuất bản (Publish - hỗ trợ cả tạo mới và xuất bản ngay)
  const handlePublish = () => {
    setConfirmModal({
      title: isCreatingNew ? "Xác nhận tạo & xuất bản trang ngay?" : "Xác nhận xuất bản trang?",
      description: `Phiên bản này sẽ được áp dụng trực tiếp cho đường dẫn công khai /${slug || initialData.primarySlug}. Khách hàng sẽ thấy ngay nội dung mới.`,
      confirmLabel: "Xuất bản ngay",
      confirmVariant: "primary",
      onConfirm: () => {
        setConfirmModal(null);
        startTransition(async () => {
          let targetPageId = page.id;
          let targetDraftId = draftRev.id;
          let targetPageLockVersion = page.lockVersion;
          let targetDraftLockVersion = draftRev.lockVersion;

          // Nếu là tạo mới
          if (isCreatingNew) {
            const createRes = await createPageAction({
              internalName: internalName || "Trang hồ sơ mới",
              slug: slug || `trang-${Date.now().toString().slice(-4)}`,
              title: title || internalName || "GỜ CAFÉ",
            });

            if (!createRes.success || !createRes.pageId) {
              showToast(createRes.error || "Không thể khởi tạo trang mới", "error");
              return;
            }
            targetPageId = createRes.pageId;
            targetPageLockVersion = 1;
            targetDraftLockVersion = 1;
          } else if (slug && slug !== initialData.primarySlug) {
            const renameRes = await renameSlugAction(targetPageId, slug, targetPageLockVersion);
            if (!renameRes.success) {
              showToast(renameRes.error || "Không thể đổi slug", "error");
              return;
            }
            targetPageLockVersion += 1;
          }

          // Lưu nháp trước
          const saveRes = await saveDraftAction({
            pageId: targetPageId,
            draftId: isCreatingNew ? undefined : targetDraftId,
            expectedDraftVersion: targetDraftLockVersion,
            title,
            description,
            theme: themeConfig,
            seo,
            blocks,
          });

          if (!saveRes.success) {
            showToast(saveRes.error || "Lỗi lưu trước khi xuất bản", "error");
            return;
          }

          const draftIdToPublish = saveRes.draftId || targetDraftId;
          const draftLockVersion = saveRes.newLockVersion || targetDraftLockVersion;

          const pubRes = await publishPageAction(
            targetPageId,
            draftIdToPublish,
            targetPageLockVersion,
            draftLockVersion
          );

          if (pubRes.success) {
            setIsDirty(false);
            showToast("Trang đã được xuất bản công khai thành công!", "success");
            if (isCreatingNew) {
              router.replace(`/admin/pages/${targetPageId}`);
            } else {
              setPage((prev) => ({
                ...prev,
                status: "published",
                lockVersion: prev.lockVersion + 1,
                publishedRevisionId: draftIdToPublish,
              }));
              setDraftRev((prev) => ({
                ...prev,
                state: "sealed",
              }));
            }
          } else {
            showToast(pubRes.error || "Xuất bản thất bại", "error");
          }
        });
      },
    });
  };

  // Hủy xuất bản (Unpublish)
  const handleUnpublish = () => {
    setConfirmModal({
      title: "Xác nhận ẩn trang này?",
      description: `Trang sẽ không còn truy cập được từ bên ngoài (trả về 404). Bạn có thể xuất bản lại bất cứ lúc nào.`,
      confirmLabel: "Ẩn trang",
      confirmVariant: "danger",
      onConfirm: () => {
        setConfirmModal(null);
        startTransition(async () => {
          const res = await unpublishPageAction(page.id, page.lockVersion);
          if (res.success) {
            setPage((prev) => ({
              ...prev,
              status: "unpublished",
              lockVersion: prev.lockVersion + 1,
            }));
            setIsDirty(false);
            showToast("Đã ẩn trang thành công.", "info");
          } else {
            showToast(res.error || "Không thể hủy xuất bản", "error");
          }
        });
      },
    });
  };

  const copySlugLink = () => {
    const url = `${window.location.origin}/${slug || initialData.primarySlug}`;
    navigator.clipboard.writeText(url);
    showToast(`Đã sao chép link: ${url}`, "success");
  };

  return (
    <div
      className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden select-none"
      suppressHydrationWarning
    >
      {/* 1. TOP STUDIO NAVBAR */}
      <header className="h-14 md:h-16 px-3 sm:px-5 border-b border-border/80 bg-background flex items-center justify-between gap-3 shrink-0 z-30 shadow-2xs">
        {/* Left Section: Navigation & Page Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/admin/pages"
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách trang"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Quick Admin Navigation Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Menu quản trị nhanh"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {adminMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAdminMenuOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 w-52 rounded-2xl border border-border bg-popover shadow-xl p-1.5 z-50 text-xs">
                  <div className="px-2 py-1.5 font-bold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60 mb-1">
                    Chuyển đến quản trị
                  </div>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-muted text-foreground transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    <span>Bảng điều khiển</span>
                  </Link>
                  <Link
                    href="/admin/pages"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-muted text-foreground transition-colors font-semibold"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Quản lý trang hồ sơ</span>
                  </Link>
                  <Link
                    href="/admin/links"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-muted text-foreground transition-colors"
                  >
                    <Link2 className="w-4 h-4 text-purple-600" />
                    <span>Danh mục liên kết</span>
                  </Link>
                  <Link
                    href="/admin/media"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-muted text-foreground transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>Kho hình ảnh</span>
                  </Link>
                  <Link
                    href="/admin/reports"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-muted text-foreground transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 text-pink-600" />
                    <span>Báo cáo thống kê</span>
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="h-5 w-px bg-border/80 hidden sm:block" />

          {/* Page Title & Slug Badge */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold truncate max-w-[140px] sm:max-w-xs text-foreground" suppressHydrationWarning>
                {internalName || (isCreatingNew ? "Tạo trang mới" : page.internalName)}
              </h1>
              <button
                type="button"
                onClick={copySlugLink}
                className="font-mono text-[11px] text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Sao chép link trang"
              >
                <span>/{slug || initialData.primarySlug}</span>
                <Copy className="w-3 h-3 opacity-70" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5" suppressHydrationWarning>
              {isCreatingNew ? (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Đang khởi tạo trang mới
                </span>
              ) : page.status === "published" ? (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang xuất bản
                </span>
              ) : (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Bản nháp
                </span>
              )}

              {isDirty && (
                <span className="text-[10px] text-amber-500 font-medium">
                  • Chưa lưu thay đổi
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center Section: Device Switcher & Zoom Scale (Hidden on small mobile) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Device Frame Switcher */}
          <div className="flex items-center rounded-xl border border-border p-1 bg-muted/40">
            <button
              type="button"
              onClick={() => setPreviewMode("mobile")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                previewMode === "mobile"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Điện thoại</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("desktop")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                previewMode === "desktop"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Máy tính</span>
            </button>
          </div>

          {/* Zoom Level Switcher */}
          <div className="flex items-center rounded-xl border border-border p-1 bg-muted/40 text-xs">
            {([1, 0.9, 0.8] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoomScale(z)}
                className={`px-2 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
                  zoomScale === z
                    ? "bg-background text-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={`Thu phóng ${Math.round(z * 100)}%`}
              >
                {Math.round(z * 100)}%
              </button>
            ))}
          </div>
        </div>

        {/* Right Section: Mobile Mode Switcher & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Tab Toggle (< lg screens only) */}
          <div className="flex lg:hidden items-center rounded-xl border border-border p-0.5 bg-muted/50">
            <button
              type="button"
              onClick={() => setMobileViewMode("edit")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mobileViewMode === "edit"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground"
              }`}
            >
              Chỉnh sửa
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode("preview")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mobileViewMode === "preview"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground"
              }`}
            >
              Xem trước
            </button>
          </div>

          {/* Open live page */}
          {!isCreatingNew && page.status === "published" && (
            <a
              href={`/${slug || initialData.primarySlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem trang</span>
            </a>
          )}

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isPending}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
              isDirty || isCreatingNew
                ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
                : "border-border hover:bg-muted text-foreground"
            }`}
            title="Lưu bản nháp (Phím tắt: Ctrl+S)"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isCreatingNew ? "Lưu tạo trang" : "Lưu nháp"}</span>
            <span className="text-[10px] opacity-60 hidden md:inline font-mono">⌘S</span>
          </button>

          {/* Unpublish button if published */}
          {!isCreatingNew && page.status === "published" && (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={isPending}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Ẩn trang</span>
            </button>
          )}

          {/* Publish Button */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            <span>{isCreatingNew ? "Tạo & Xuất bản" : "Xuất bản"}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN STUDIO WORKSPACE */}
      <div
        className={`flex-1 flex overflow-hidden relative ${
          isResizingSplit ? "select-none cursor-col-resize" : ""
        }`}
      >
        {/* Left Panel: Content & Customization Controls */}
        <div
          className={`w-full lg:w-[var(--left-panel-width)] flex flex-col shrink-0 bg-background border-r border-border/80 overflow-hidden ${
            mobileViewMode === "preview" ? "hidden lg:flex" : "flex"
          }`}
          style={{
            ["--left-panel-width" as string]: `${leftPanelWidth}px`,
          }}
        >
          {/* Studio Tabs Navigation */}
          <div className="flex items-center px-4 border-b border-border/80 bg-muted/20 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("blocks")}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "blocks"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Nội dung</span>
              <span className="bg-muted px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                {blocks.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("theme")}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "theme"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Giao diện (Theme)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("seo")}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "seo"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cài đặt & SEO</span>
            </button>
          </div>

          {/* Studio Tab Content (Independent scroll) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-32 sm:pb-40 space-y-6">
            {activeTab === "blocks" && (
              <div className="space-y-6">
                {/* 1. Core Page Settings: Internal Name & Slug & Title */}
                <div className="p-4 rounded-2xl border border-border/80 bg-muted/10 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-border/50 text-xs font-bold text-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Thông tin định danh trang</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Tên nội bộ quản lý <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={internalName}
                      onChange={(e) => handleInternalNameChange(e.target.value)}
                      placeholder="VD: Menu Cà phê Tháng 11, Trang Tuyển dụng..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Đường dẫn truy cập (Slug) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
                      <span className="px-3 py-2 text-xs text-muted-foreground bg-muted/40 font-mono border-r border-border/60 shrink-0">
                        gocafe.me/
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => {
                          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, "-"));
                          setIsDirty(true);
                        }}
                        placeholder="menu-thang-11"
                        className="w-full px-3 py-2 text-xs font-mono bg-transparent focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Chỉ dùng chữ thường không dấu, số và gạch nối (-).
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Tiêu đề hiển thị trên trang
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Gờ Cafe - Cà phê chuẩn gu"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Ghi chú nội bộ
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Ghi chú về chiến dịch hoặc mục tiêu trang..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Quick Add Block Toolbar: ALL 8 BLOCK TYPES */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Thêm khối nội dung:
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddBlock("header")}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:border-blue-500/50 hover:bg-blue-500/5 text-xs font-medium transition-all cursor-pointer text-left shadow-2xs group"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">Avatar & Bio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddBlock("link_list")}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:border-purple-500/50 hover:bg-purple-500/5 text-xs font-medium transition-all cursor-pointer text-left shadow-2xs group"
                    >
                      <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                        <Link2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">DS liên kết</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddBlock("heading")}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:border-indigo-500/50 hover:bg-indigo-500/5 text-xs font-medium transition-all cursor-pointer text-left shadow-2xs group"
                    >
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <Heading className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">Tiêu đề mục</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddBlock("text")}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:border-emerald-500/50 hover:bg-emerald-500/5 text-xs font-medium transition-all cursor-pointer text-left shadow-2xs group"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                        <AlignLeft className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">Văn bản</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddBlock("image")}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:border-amber-500/50 hover:bg-amber-500/5 text-xs font-medium transition-all cursor-pointer text-left shadow-2xs group"
                    >
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">Ảnh / Banner</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddBlock("social_icons")}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:border-pink-500/50 hover:bg-pink-500/5 text-xs font-medium transition-all cursor-pointer text-left shadow-2xs group"
                    >
                      <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                        <Share2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">Mạng xã hội</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddBlock("spacer")}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:border-slate-400/50 hover:bg-slate-500/5 text-xs font-medium transition-all cursor-pointer text-left shadow-2xs group"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-500 group-hover:scale-110 transition-transform">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">Khoảng cách</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddBlock("divider")}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:border-slate-400/50 hover:bg-slate-500/5 text-xs font-medium transition-all cursor-pointer text-left shadow-2xs group"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-500 group-hover:scale-110 transition-transform">
                        <Minus className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">Đường kẻ</span>
                    </button>
                  </div>
                </div>

                {/* Blocks List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Cấu trúc trang ({blocks.length} khối)
                    </span>
                  </div>

                  {blocks.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border-2 border-dashed border-border/80 text-muted-foreground text-xs space-y-2">
                      <Layers className="w-8 h-8 mx-auto opacity-40 text-muted-foreground" />
                      <p className="font-semibold text-foreground">Trang chưa có khối nào</p>
                      <p>Nhấn vào các nút phía trên để thêm Tiêu đề, Danh sách liên kết hoặc Hình ảnh.</p>
                    </div>
                  ) : (
                    blocks.map((block, idx) => (
                      <BlockItemEditor
                        key={block.id}
                        block={block}
                        index={idx}
                        totalBlocks={blocks.length}
                        availableLinks={initialData.availableLinks}
                        availableMedia={mediaList}
                        onMediaAdded={handleMediaAdded}
                        onUpdateBlock={(updated) => handleUpdateBlock(idx, updated)}
                        onMoveUp={() => handleMoveBlock(idx, "up")}
                        onMoveDown={() => handleMoveBlock(idx, "down")}
                        onDelete={() => handleDeleteBlock(idx)}
                        onDuplicate={() => handleDuplicateBlock(idx)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "theme" && (
              <ThemeEditor
                themeConfig={themeConfig}
                onChange={(newTheme) => {
                  setThemeConfig(newTheme);
                  setIsDirty(true);
                }}
              />
            )}

            {activeTab === "seo" && (
              <SeoEditor
                seo={seo}
                onChange={(newSeo) => {
                  setSeo(newSeo);
                  setIsDirty(true);
                }}
                availableMedia={mediaList}
                onMediaAdded={handleMediaAdded}
              />
            )}
          </div>
        </div>

        {/* Vertical Resizable Splitter between Left & Right panels */}
        <div
          role="separator"
          aria-orientation="vertical"
          onPointerDown={handleSplitPointerDown}
          onPointerMove={handleSplitPointerMove}
          onPointerUp={handleSplitPointerUp}
          onDoubleClick={handleResetPanelWidth}
          className={`hidden lg:flex items-center justify-center w-2.5 -ml-1.5 z-30 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors select-none group relative touch-none shrink-0 ${
            isResizingSplit ? "bg-primary/30 w-3 -ml-1.5 ring-2 ring-primary/40" : ""
          }`}
          title="Kéo sang trái / phải để điều chỉnh độ rộng cột điều khiển (Nhấp đúp để đặt lại 500px)"
        >
          {/* Handle visual grip bar */}
          <div
            className={`w-1 rounded-full transition-all duration-150 ${
              isResizingSplit
                ? "bg-primary h-14 shadow-lg shadow-primary/40 scale-125"
                : "bg-slate-300 dark:bg-slate-700 h-8 group-hover:bg-primary group-hover:h-12"
            }`}
          />

          {/* Floating width indicator badge while dragging */}
          {isResizingSplit && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-mono text-[11px] font-bold shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95">
              {leftPanelWidth} px
            </div>
          )}
        </div>

        {/* Right Panel: Live Studio Preview */}
        <div
          className={`flex-1 bg-slate-100/70 dark:bg-slate-900/40 flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden relative ${
            mobileViewMode === "edit" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Subtle Grid Backdrop */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"
            aria-hidden="true"
          />

          {/* Current Theme Pill Info */}
          <div className="absolute top-3 left-4 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/60 text-[11px] text-muted-foreground shadow-2xs z-20">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Mẫu: <strong className="text-foreground">{themeConfig.preset}</strong></span>
          </div>

          <LivePreview
            themeConfig={themeConfig}
            title={title}
            blocks={blocks}
            previewMode={previewMode}
            zoomScale={zoomScale}
          />
        </div>
      </div>

      {/* 3. CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-foreground">{confirmModal.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {confirmModal.description}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  confirmModal.confirmVariant === "danger"
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl text-xs font-medium animate-in slide-in-from-bottom-3 duration-200">
          {toast.type === "success" && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          {toast.type === "info" && <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
