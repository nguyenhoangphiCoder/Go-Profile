"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Globe,
  Smartphone,
  Monitor,
  Plus,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Layers,
  Palette,
  Settings,
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
import { saveDraftAction, publishPageAction, unpublishPageAction } from "../../actions";

interface PageEditorProps {
  initialData: PageEditorData;
}

export function PageEditor({ initialData }: PageEditorProps) {
  const [page, setPage] = useState(initialData.page);
  const [draftRev, setDraftRev] = useState(initialData.draftRevision);
  const [title, setTitle] = useState(initialData.draftRevision.title);
  const [description, setDescription] = useState(initialData.draftRevision.description || "");
  const [themeConfig, setThemeConfig] = useState<PageThemeConfig>(
    initialData.draftRevision.theme || { preset: "go-original" }
  );
  const [seo, setSeo] = useState<PageSeoConfig>(initialData.draftRevision.seo || {});
  const [blocks, setBlocks] = useState<EditorBlockItem[]>(initialData.blocks);

  const [activeTab, setActiveTab] = useState<"blocks" | "theme" | "seo">("blocks");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Thêm khối mới
  const handleAddBlock = (type: BlockType) => {
    let payload: Record<string, unknown> = {};
    if (type === "header") payload = { title, bio: "" };
    if (type === "heading") payload = { text: "Tiêu đề mới", level: 2 };
    if (type === "text") payload = { content: "Nội dung văn bản giới thiệu...", align: "center" };
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
  };

  const handleUpdateBlock = (index: number, updated: EditorBlockItem) => {
    const copy = [...blocks];
    copy[index] = updated;
    setBlocks(copy);
  };

  const handleDeleteBlock = (index: number) => {
    const copy = blocks.filter((_, i) => i !== index);
    const reordered = copy.map((b, i) => ({ ...b, position: i }));
    setBlocks(reordered);
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
  };

  // Lưu bản nháp
  const handleSaveDraft = () => {
    setErrorMessage(null);
    setSaveSuccessMsg(null);

    startTransition(async () => {
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
        setSaveSuccessMsg("Đã lưu bản nháp thành công!");
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } else {
        setErrorMessage(res.error || "Không thể lưu bản nháp");
      }
    });
  };

  // Xuất bản (Publish)
  const handlePublish = () => {
    setErrorMessage(null);
    setSaveSuccessMsg(null);

    if (confirm("Xuất bản phiên bản này lên trang công khai?")) {
      startTransition(async () => {
        // Lưu nháp trước
        const saveRes = await saveDraftAction({
          pageId: page.id,
          draftId: draftRev.id,
          expectedDraftVersion: draftRev.lockVersion,
          title,
          description,
          theme: themeConfig,
          seo,
          blocks,
        });

        if (!saveRes.success) {
          setErrorMessage(saveRes.error || "Lỗi lưu trước khi xuất bản");
          return;
        }

        const draftIdToPublish = saveRes.draftId || draftRev.id;
        const draftLockVersion = saveRes.newLockVersion || draftRev.lockVersion;

        const pubRes = await publishPageAction(
          page.id,
          draftIdToPublish,
          page.lockVersion,
          draftLockVersion
        );

        if (pubRes.success) {
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
          setSaveSuccessMsg("Trang đã được xuất bản công khai!");
          setTimeout(() => setSaveSuccessMsg(null), 4000);
        } else {
          setErrorMessage(pubRes.error || "Xuất bản thất bại");
        }
      });
    }
  };

  // Hủy xuất bản (Unpublish)
  const handleUnpublish = () => {
    if (confirm("Ẩn trang này? Trang sẽ không còn truy cập được từ bên ngoài (trả về 404).")) {
      startTransition(async () => {
        const res = await unpublishPageAction(page.id, page.lockVersion);
        if (res.success) {
          setPage((prev) => ({
            ...prev,
            status: "unpublished",
            lockVersion: prev.lockVersion + 1,
          }));
          setSaveSuccessMsg("Đã ẩn trang thành công.");
          setTimeout(() => setSaveSuccessMsg(null), 3000);
        } else {
          setErrorMessage(res.error || "Không thể hủy xuất bản");
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-4 md:-m-6 lg:-m-8">
      {/* Top Navbar */}
      <header className="h-16 px-4 md:px-6 border-b border-border/80 bg-background/95 backdrop-blur-xs flex items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pages"
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Quay lại danh sách trang"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold truncate max-w-[200px] sm:max-w-xs">
                {page.internalName}
              </h1>
              <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                /{initialData.primarySlug}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {page.status === "published" ? (
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Đang xuất bản
                </span>
              ) : (
                <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Bản nháp / Đã ẩn
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                Rev #{draftRev.revisionNo} ({draftRev.state})
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Device Preview Switcher */}
          <div className="hidden sm:flex items-center rounded-xl border border-border p-1 bg-muted/40">
            <button
              type="button"
              onClick={() => setPreviewMode("mobile")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                previewMode === "mobile"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Xem trước chế độ điện thoại"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("desktop")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                previewMode === "desktop"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Xem trước chế độ máy tính"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* Open live page button */}
          {page.status === "published" && (
            <a
              href={`/${initialData.primarySlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Lưu nháp</span>
          </button>

          {/* Unpublish or Publish */}
          {page.status === "published" ? (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Ẩn trang</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            <span>Xuất bản</span>
          </button>
        </div>
      </header>

      {/* Alert Notifications */}
      {errorMessage && (
        <div className="bg-red-500/15 border-b border-red-500/20 text-red-500 px-6 py-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="cursor-pointer font-bold">
            ×
          </button>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-6 py-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="cursor-pointer font-bold">
            ×
          </button>
        </div>
      )}

      {/* Editor Body: Split Columns */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: Content & Settings Tabs */}
        <div className="w-full lg:w-[52%] xl:w-[48%] flex flex-col border-b lg:border-b-0 lg:border-r border-border/80 bg-background overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center px-4 md:px-6 border-b border-border/80 bg-muted/20 shrink-0">
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
              <span>Nội dung ({blocks.length} khối)</span>
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

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {activeTab === "blocks" && (
              <div className="space-y-6">
                {/* Header Information */}
                <div className="space-y-3 pb-4 border-b border-border/60">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Tiêu đề hiển thị trên trang
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Gờ Cafe - Cà phê chuẩn gu"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Mô tả nội bộ / Ghi chú
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ghi chú về chiến dịch hoặc mục tiêu trang..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Add block menu buttons */}
                <div>
                  <span className="text-xs font-bold text-muted-foreground block mb-2">
                    Thêm khối nội dung mới:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddBlock("link_list")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-purple-500" />
                      <span>Danh sách link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("heading")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-500" />
                      <span>Tiêu đề mục</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("text")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Đoạn văn bản</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("image")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-500" />
                      <span>Hình ảnh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("social_icons")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-pink-500" />
                      <span>Icon mạng xã hội</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("spacer")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                      <span>Khoảng cách</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("divider")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                      <span>Đường kẻ</span>
                    </button>
                  </div>
                </div>

                {/* Blocks list */}
                <div className="space-y-4">
                  {blocks.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-border text-muted-foreground text-xs">
                      Trang chưa có khối nào. Nhấn các nút trên để thêm khối.
                    </div>
                  ) : (
                    blocks.map((block, idx) => (
                      <BlockItemEditor
                        key={block.id}
                        block={block}
                        index={idx}
                        totalBlocks={blocks.length}
                        availableLinks={initialData.availableLinks}
                        availableMedia={initialData.availableMedia}
                        onUpdateBlock={(updated) => handleUpdateBlock(idx, updated)}
                        onMoveUp={() => handleMoveBlock(idx, "up")}
                        onMoveDown={() => handleMoveBlock(idx, "down")}
                        onDelete={() => handleDeleteBlock(idx)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "theme" && (
              <ThemeEditor themeConfig={themeConfig} onChange={setThemeConfig} />
            )}

            {activeTab === "seo" && (
              <SeoEditor seo={seo} onChange={setSeo} availableMedia={initialData.availableMedia} />
            )}
          </div>
        </div>

        {/* Right Panel: Live Device Preview */}
        <div className="w-full lg:w-[48%] xl:w-[52%] bg-muted/20 flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
          <LivePreview
            themeConfig={themeConfig}
            title={title}
            blocks={blocks}
            previewMode={previewMode}
          />
        </div>
      </div>
    </div>
  );
}
