"use client";

import {
  useState,
  useTransition,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
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
  Undo2,
  Redo2,
  GripVertical,
  MousePointerClick,
  Images,
  UtensilsCrossed,
  ListCollapse,
  PlaySquare,
  MapPin,
} from "lucide-react";
import type {
  PageEditorData,
  EditorBlockItem,
  PageThemeConfig,
  PageSeoConfig,
  BlockType,
} from "../../types";
import { LivePreview } from "./live-preview";
import { useUndoHistory } from "./use-undo-history";
import { reorderByInsertion } from "./reorder";
import { BLOCK_REGISTRY } from "@/features/renderer/blocks/registry";

// Khối mới (giai đoạn 4): payload mặc định lấy từ registry
const V2_BLOCKS = [
  { type: "button", label: "Nút nổi bật", Icon: MousePointerClick, tone: "rose" },
  { type: "gallery", label: "Thư viện ảnh", Icon: Images, tone: "orange" },
  { type: "menu_card", label: "Thẻ món", Icon: UtensilsCrossed, tone: "yellow" },
  { type: "accordion", label: "Hỏi đáp", Icon: ListCollapse, tone: "teal" },
  { type: "video_embed", label: "Video", Icon: PlaySquare, tone: "red" },
  { type: "map", label: "Bản đồ", Icon: MapPin, tone: "green" },
] as const;

const TONE_CLASSES: Record<(typeof V2_BLOCKS)[number]["tone"], string> = {
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  yellow: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  green: "bg-green-500/10 text-green-600 dark:text-green-400",
};
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

const PANEL_WIDTH_KEY = "gocafe_editor_panel_width";

function readStoredPanelWidth(): number | null {
  try {
    const parsed = parseInt(localStorage.getItem(PANEL_WIDTH_KEY) ?? "", 10);
    return !isNaN(parsed) && parsed >= 380 && parsed <= 950 ? parsed : null;
  } catch {
    return null;
  }
}

function subscribeNoop() {
  return () => {};
}

const READ_ONLY_MESSAGE = "Bạn chỉ có quyền xem trong workspace này, không thể lưu hoặc xuất bản.";

export function PageEditor({ initialData, isNew = false }: PageEditorProps) {
  const router = useRouter();
  // Đồng bộ phát hiện chế độ tạo mới dựa trên cả prop isNew và ID trang khởi tạo để tránh hydration mismatch
  const isCreatingNew = Boolean(isNew || initialData.page.id === "new");

  // Người xem (viewer) chỉ xem được, không lưu / xuất bản (server cũng chặn)
  const canEdit = initialData.canEdit;
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
  // Độ rộng đã lưu được đọc qua useSyncExternalStore (server render dùng mặc định 500px);
  // khi người dùng kéo thì giá trị kéo được ưu tiên.
  const storedPanelWidth = useSyncExternalStore(subscribeNoop, readStoredPanelWidth, () => null);
  const [draggedPanelWidth, setLeftPanelWidth] = useState<number | null>(null);
  const leftPanelWidth = draggedPanelWidth ?? storedPanelWidth ?? 500;
  const [isResizingSplit, setIsResizingSplit] = useState(false);

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
        localStorage.setItem(PANEL_WIDTH_KEY, String(leftPanelWidth));
      } catch {}
    }
  };

  const handleResetPanelWidth = () => {
    setLeftPanelWidth(500);
    try {
      localStorage.setItem(PANEL_WIDTH_KEY, "500");
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

  // Thêm khối mới (8 loại khối gốc + 6 loại khối mới của giai đoạn 4)
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
    if (V2_BLOCKS.some((b) => b.type === type)) {
      payload = structuredClone(BLOCK_REGISTRY[type].defaultPayload);
    }

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
      default:
        return BLOCK_REGISTRY[type]?.label ?? type;
    }
  };

  // ---- Chọn khối (bấm trên bản xem trước ↔ form chỉnh sửa) ----
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  // Chỉ thay đổi khi chọn từ bản xem trước → form khối đó tự mở rộng
  const [previewPick, setPreviewPick] = useState<{ id: string; token: number } | null>(null);

  const handleSelectBlockFromPreview = useCallback((blockId: string) => {
    setSelectedBlockId(blockId);
    setPreviewPick((prev) => ({ id: blockId, token: (prev?.token ?? 0) + 1 }));
    setActiveTab("blocks");
    setMobileViewMode("edit");
    // Chờ form render (khi vừa chuyển tab / chế độ) rồi cuộn tới khối
    window.setTimeout(() => {
      document
        .getElementById(`block-editor-${blockId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, []);

  // ---- Kéo thả sắp xếp khối ----
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleReorderBlock = (from: number, to: number) => {
    const next = reorderByInsertion(blocks, from, to);
    if (next === blocks) return;
    setBlocks(next);
    setIsDirty(true);
  };

  const resetDrag = () => {
    setDragIndex(null);
    setDropIndex(null);
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
    const updated = [...blocks.slice(0, index + 1), duplicated, ...blocks.slice(index + 1)].map(
      (b, i) => ({ ...b, position: i })
    );
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
    if (!canEdit) {
      showToast(READ_ONLY_MESSAGE, "error");
      return;
    }
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
    canEdit,
  ]);

  // Hoàn tác / làm lại: theo dõi toàn bộ nội dung có thể chỉnh sửa của trang
  const editorSnapshot = useMemo(
    () => ({ title, description, themeConfig, seo, blocks }),
    [title, description, themeConfig, seo, blocks]
  );
  const applySnapshot = useCallback((snap: typeof editorSnapshot) => {
    setTitle(snap.title);
    setDescription(snap.description);
    setThemeConfig(snap.themeConfig);
    setSeo(snap.seo);
    setBlocks(snap.blocks);
    setIsDirty(true);
  }, []);
  const history = useUndoHistory(editorSnapshot, applySnapshot);

  // Phím tắt: Ctrl+S lưu nhanh; Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y hoàn tác & làm lại
  // (trong ô nhập liệu thì để trình duyệt tự xử lý hoàn tác chữ)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        handleSaveDraft();
        return;
      }
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isTyping) return;
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        history.undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        history.redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveDraft, history]);

  // Ảnh trong trang dùng để gợi ý bảng màu
  const pageImageUrls = useMemo(
    () =>
      blocks.flatMap((b) => {
        const p = b.payload as { avatarUrl?: string; bannerUrl?: string; imageUrl?: string };
        return [p.avatarUrl, p.bannerUrl, p.imageUrl].filter((u): u is string => Boolean(u));
      }),
    [blocks]
  );

  // Xuất bản (Publish - hỗ trợ cả tạo mới và xuất bản ngay)
  const handlePublish = () => {
    if (!canEdit) {
      showToast(READ_ONLY_MESSAGE, "error");
      return;
    }
    setConfirmModal({
      title: isCreatingNew ? "Xác nhận tạo & xuất bản trang ngay?" : "Xác nhận xuất bản trang?",
      description: `Phiên bản này sẽ được áp dụng trực tiếp cho đường dẫn công khai /${slug || initialData.primarySlug}. Khách hàng sẽ thấy ngay nội dung mới.`,
      confirmLabel: "Xuất bản ngay",
      confirmVariant: "primary",
      onConfirm: () => {
        setConfirmModal(null);
        startTransition(async () => {
          let targetPageId = page.id;
          const targetDraftId = draftRev.id;
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
    if (!canEdit) {
      showToast(READ_ONLY_MESSAGE, "error");
      return;
    }
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
      className="flex flex-col h-screen h-dvh w-full bg-slate-50 dark:bg-slate-950 overflow-hidden select-none"
      suppressHydrationWarning
    >
      {/* 1. TOP STUDIO NAVBAR */}
      <header className="border-b border-border/80 bg-background shrink-0 z-30 shadow-2xs">
        <div className="h-14 md:h-16 px-2 sm:px-5 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left Section: Navigation & Page Info */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
            <Link
              href="/admin/pages"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
              title="Quay lại danh sách trang"
              aria-label="Quay lại danh sách trang"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {/* Quick Admin Navigation Dropdown (ẩn trên điện thoại, đã có nút quay lại) */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Menu quản trị nhanh"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {adminMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAdminMenuOpen(false)} />
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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h1
                  className="text-[13px] sm:text-sm font-bold truncate sm:max-w-xs text-foreground leading-tight"
                  suppressHydrationWarning
                >
                  {internalName || (isCreatingNew ? "Tạo trang mới" : page.internalName)}
                </h1>
                <button
                  type="button"
                  onClick={copySlugLink}
                  className="hidden sm:flex font-mono text-[11px] text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-lg items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Sao chép link trang"
                >
                  <span>/{slug || initialData.primarySlug}</span>
                  <Copy className="w-3 h-3 opacity-70" />
                </button>
              </div>
              <div
                className="flex items-center gap-1.5 sm:gap-2 mt-0.5 min-w-0 text-[10px] sm:text-[11px]"
                suppressHydrationWarning
              >
                {isCreatingNew ? (
                  <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3 h-3" />
                    <span className="sm:hidden">Trang mới</span>
                    <span className="hidden sm:inline">Đang khởi tạo trang mới</span>
                  </span>
                ) : page.status === "published" ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đang xuất bản
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Bản nháp
                  </span>
                )}

                {/* Slug rút gọn trên điện thoại (bấm để sao chép link) */}
                <button
                  type="button"
                  onClick={copySlugLink}
                  className="sm:hidden font-mono text-primary truncate min-w-0 cursor-pointer"
                  title="Sao chép link trang"
                >
                  /{slug || initialData.primarySlug}
                </button>

                {!canEdit && (
                  <span
                    className="text-slate-500 font-semibold shrink-0"
                    title="Bạn là người xem trong workspace này"
                  >
                    • Chỉ xem
                  </span>
                )}
                {isDirty && (
                  <span className="text-amber-500 font-medium shrink-0">
                    <span className="sm:hidden" title="Chưa lưu thay đổi">
                      •
                    </span>
                    <span className="hidden sm:inline">• Chưa lưu thay đổi</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Section: Device Switcher & Zoom Scale (desktop only) */}
          <div className="hidden lg:flex items-center gap-2">
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

          {/* Right Section: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

            {/* Undo / Redo */}
            <div className="hidden sm:flex items-center rounded-xl border border-border">
              <button
                type="button"
                onClick={history.undo}
                disabled={!history.canUndo}
                className="h-9 w-9 flex items-center justify-center rounded-l-xl text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-35 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                title="Hoàn tác (Ctrl+Z)"
                aria-label="Hoàn tác"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={history.redo}
                disabled={!history.canRedo}
                className="h-9 w-9 flex items-center justify-center rounded-r-xl border-l border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-35 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                title="Làm lại (Ctrl+Shift+Z)"
                aria-label="Làm lại"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Save Draft */}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isPending || !canEdit}
              className={`relative flex items-center justify-center gap-1.5 h-9 min-w-9 px-2.5 sm:px-3.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
                isDirty || isCreatingNew
                  ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
                  : "border-border hover:bg-muted text-foreground"
              }`}
              title="Lưu bản nháp (Phím tắt: Ctrl+S)"
              aria-label={isCreatingNew ? "Lưu tạo trang" : "Lưu nháp"}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 animate-spin" />
              ) : (
                <Save className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isCreatingNew ? "Lưu tạo trang" : "Lưu nháp"}
              </span>
              <span className="text-[10px] opacity-60 hidden md:inline font-mono">⌘S</span>
              {isDirty && (
                <span className="sm:hidden absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-background" />
              )}
            </button>

            {/* Unpublish button if published */}
            {!isCreatingNew && page.status === "published" && (
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={isPending || !canEdit}
                className="hidden sm:flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-xl border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>Ẩn trang</span>
              </button>
            )}

            {/* Publish Button */}
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPending || !canEdit}
              className="flex items-center gap-1.5 h-9 px-3 sm:px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              <span className="sm:hidden">Xuất bản</span>
              <span className="hidden sm:inline">
                {isCreatingNew ? "Tạo & Xuất bản" : "Xuất bản"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile/Tablet: chuyển giữa Chỉnh sửa và Xem trước (< lg) */}
        <div className="lg:hidden px-2 sm:px-5 pb-2">
          <div className="grid grid-cols-2 rounded-xl border border-border p-1 bg-muted/50">
            <button
              type="button"
              onClick={() => setMobileViewMode("edit")}
              aria-pressed={mobileViewMode === "edit"}
              className={`flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mobileViewMode === "edit"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Chỉnh sửa
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode("preview")}
              aria-pressed={mobileViewMode === "preview"}
              className={`flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mobileViewMode === "preview"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Xem trước
            </button>
          </div>
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
          <div
            role="tablist"
            className="flex items-stretch px-1 sm:px-4 border-b border-border/80 bg-muted/20 shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "blocks"}
              onClick={() => setActiveTab("blocks")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 min-h-11 py-2.5 px-2 sm:px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === "blocks"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Nội dung</span>
              <span className="bg-muted px-1.5 rounded-full text-[10px] font-mono">
                {blocks.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "theme"}
              onClick={() => setActiveTab("theme")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 min-h-11 py-2.5 px-2 sm:px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === "theme"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Palette className="w-4 h-4 shrink-0" />
              <span>Giao diện</span>
              <span className="hidden sm:inline">(Theme)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "seo"}
              onClick={() => setActiveTab("seo")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 min-h-11 py-2.5 px-2 sm:px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === "seo"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">SEO</span>
              <span className="hidden sm:inline">Cài đặt & SEO</span>
            </button>
          </div>

          {/* Studio Tab Content (Independent scroll) */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5 pb-24 sm:pb-40 space-y-6">
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

                {/* Quick Add Block Toolbar: toàn bộ 14 loại khối */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Thêm khối nội dung:</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4 gap-2">
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

                    {V2_BLOCKS.map(({ type, label, Icon, tone }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleAddBlock(type)}
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-xs font-medium transition-all cursor-pointer text-left shadow-2xs group"
                      >
                        <div
                          className={`p-1.5 rounded-lg group-hover:scale-110 transition-transform ${TONE_CLASSES[tone]}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
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
                      <p>
                        Nhấn vào các nút phía trên để thêm Tiêu đề, Danh sách liên kết hoặc Hình
                        ảnh.
                      </p>
                    </div>
                  ) : (
                    blocks.map((block, idx) => (
                      <div
                        key={block.id}
                        onDragOver={(e) => {
                          if (dragIndex === null) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          const rect = e.currentTarget.getBoundingClientRect();
                          const after = e.clientY > rect.top + rect.height / 2;
                          setDropIndex(after ? idx + 1 : idx);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragIndex !== null && dropIndex !== null) {
                            handleReorderBlock(dragIndex, dropIndex);
                          }
                          resetDrag();
                        }}
                        className={`relative transition-opacity ${dragIndex === idx ? "opacity-40" : ""}`}
                      >
                        {dropIndex === idx && dragIndex !== null && (
                          <div
                            className="absolute -top-2 inset-x-2 h-1 rounded-full bg-primary"
                            aria-hidden="true"
                          />
                        )}
                        {dropIndex === idx + 1 &&
                          idx === blocks.length - 1 &&
                          dragIndex !== null && (
                            <div
                              className="absolute -bottom-2 inset-x-2 h-1 rounded-full bg-primary"
                              aria-hidden="true"
                            />
                          )}
                        <BlockItemEditor
                          isSelected={selectedBlockId === block.id}
                          selectToken={previewPick?.id === block.id ? previewPick.token : 0}
                          onSelect={() => setSelectedBlockId(block.id)}
                          dragHandle={
                            <span
                              draggable
                              onClick={(e) => e.stopPropagation()}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", String(idx));
                                const card = (e.currentTarget as HTMLElement).closest(
                                  "[data-block-card]"
                                );
                                if (card) e.dataTransfer.setDragImage(card, 24, 24);
                                setDragIndex(idx);
                              }}
                              onDragEnd={resetDrag}
                              className="hidden lg:flex items-center justify-center w-6 h-8 -ml-1 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted cursor-grab active:cursor-grabbing shrink-0"
                              title="Kéo để sắp xếp lại khối"
                              aria-label="Kéo để sắp xếp lại khối"
                            >
                              <GripVertical className="w-4 h-4" />
                            </span>
                          }
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
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "theme" && (
              <ThemeEditor
                themeConfig={themeConfig}
                imageUrls={pageImageUrls}
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
          className={`flex-1 bg-slate-100/70 dark:bg-slate-900/40 flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6 overflow-hidden relative ${
            mobileViewMode === "edit" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Subtle Grid Backdrop */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"
            aria-hidden="true"
          />

          {/* Current Theme Pill Info */}
          <div className="absolute top-3 left-4 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/60 text-[11px] text-muted-foreground shadow-2xs z-20">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>
              Mẫu: <strong className="text-foreground">{themeConfig.preset}</strong>
            </span>
          </div>

          <LivePreview
            key={previewMode}
            themeConfig={themeConfig}
            title={title}
            blocks={blocks}
            previewMode={previewMode}
            zoomScale={zoomScale}
            selectedBlockId={selectedBlockId}
            onSelectBlock={handleSelectBlockFromPreview}
          />
        </div>
      </div>

      {/* 3. CONFIRMATION MODAL */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setConfirmModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-border bg-card p-5 sm:p-6 pb-safe sm:pb-6 shadow-2xl space-y-4"
          >
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-foreground">{confirmModal.title}</h3>
              <p className="text-sm sm:text-xs text-muted-foreground leading-relaxed break-words">
                {confirmModal.description}
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="h-11 sm:h-auto px-4 sm:py-2 rounded-xl border border-border text-sm sm:text-xs font-semibold hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`h-11 sm:h-auto px-4 sm:py-2 rounded-xl text-sm sm:text-xs font-bold transition-all cursor-pointer shadow-xs ${
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
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-3 right-3 sm:left-auto sm:bottom-5 sm:right-5 sm:max-w-sm z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl text-xs font-medium animate-in slide-in-from-bottom-3 duration-200"
        >
          {toast.type === "success" && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          {toast.type === "info" && <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />}
          <span className="min-w-0 break-words">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
