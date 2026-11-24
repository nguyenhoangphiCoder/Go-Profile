"use client";

import { memo, useState, type ReactNode } from "react";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Plus,
  Heading,
  AlignLeft,
  FileText,
  Image as ImageIcon,
  Link2,
  Share2,
  Maximize2,
  Minus,
  ChevronRight,
  MousePointerClick,
  Images,
  UtensilsCrossed,
  ListCollapse,
  PlaySquare,
  MapPin,
  Pencil,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  ListOrdered,
  BarChart2,
  Columns2,
  LayoutGrid,
  Table2,
  ShoppingBag,
  Inbox,
  MessageSquareQuote,
  Megaphone,
} from "lucide-react";
import type {
  EditorBlockItem,
  LinkPlacementItem,
  BlockType,
  HeaderBlockPayload,
  HeroSectionBlockPayload,
  HeadingBlockPayload,
  TextBlockPayload,
  ImageBlockPayload,
  LinkListBlockPayload,
  SocialIconsBlockPayload,
  SpacerBlockPayload,
  DividerBlockPayload,
} from "../../types";
import { MediaPickerField } from "@/components/admin/media-picker-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Select } from "@/components/ui/select";
import { parsePhoneTarget } from "@/features/renderer/phone-action-sheet";
import {
  AccordionBlockEditor,
  BlockStyleEditor,
  ButtonBlockEditor,
  GalleryBlockEditor,
  MapBlockEditor,
  MenuCardBlockEditor,
  VideoBlockEditor,
} from "./block-editors-v2";
import {
  BannerSliderEditor,
  CtaBannerEditor,
  InfoCardsEditor,
  LeadFormEditor,
  PricingTableEditor,
  ProductGridEditor,
  SplitContentEditor,
  StatsStripEditor,
  StoreLocatorEditor,
  TestimonialsEditor,
  TocBarEditor,
} from "./landing-block-editors";

interface BlockItemEditorProps {
  block: EditorBlockItem;
  index: number;
  totalBlocks: number;
  availableLinks: {
    id: string;
    defaultLabel: string;
    targetUrl: string;
    kind: "standard" | "social" | "contact";
    defaultMediaId: string | null;
    defaultMediaUrl?: string | null;
  }[];
  availableMedia: {
    id: string;
    originalFilename: string | null;
    publicUrl: string | null;
  }[];
  onMediaAdded?: (newMedia: {
    id: string;
    originalFilename: string | null;
    publicUrl: string | null;
  }) => void;
  onUpdateBlock: (updated: EditorBlockItem) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  /** Khối đang được chọn (từ bản xem trước hoặc bấm tiêu đề khối). */
  isSelected?: boolean;
  /** Tăng mỗi lần khối được chọn từ bản xem trước → tự mở rộng form. */
  selectToken?: number;
  onSelect?: () => void;
  /** Tay kéo để sắp xếp khối (do PageEditor cung cấp). */
  dragHandle?: ReactNode;
  /** Tuỳ chọn điều khiển đóng/mở từ PageEditor (chế độ chỉ mở 1 khối). */
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export const BlockItemEditor = memo(function BlockItemEditor({
  block,
  index,
  totalBlocks,
  availableLinks,
  availableMedia,
  onMediaAdded,
  onUpdateBlock,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate,
  isSelected = false,
  selectToken = 0,
  onSelect,
  dragHandle,
  expanded,
  onToggleExpand,
}: BlockItemEditorProps) {
  const [localExpanded, setLocalExpanded] = useState(true);
  const [innerTab, setInnerTab] = useState<"content" | "style">("content");
  // Được chọn từ bản xem trước → mở rộng form (cập nhật state khi prop đổi, không dùng effect)
  const [seenSelectToken, setSeenSelectToken] = useState(selectToken);
  if (selectToken !== seenSelectToken) {
    setSeenSelectToken(selectToken);
    if (isSelected && expanded === undefined) setLocalExpanded(true);
  }
  const isExpanded = expanded !== undefined ? expanded : localExpanded;
  const toggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setLocalExpanded((prev) => !prev);
    }
  };
  const hasBlockStyle = Boolean(
    block.payload &&
    typeof block.payload === "object" &&
    "blockStyle" in block.payload &&
    block.payload.blockStyle &&
    Object.keys(block.payload.blockStyle as Record<string, unknown>).length > 0
  );
  const [selectedLinkToAdd, setSelectedLinkToAdd] = useState("");
  const [expandedPlacements, setExpandedPlacements] = useState<Record<string, boolean>>({});

  const togglePlacementExpand = (id: string) => {
    setExpandedPlacements((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getBlockIcon = (type: BlockType) => {
    switch (type) {
      case "header":
        return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "heading":
        return <Heading className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case "text":
        return <AlignLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "image":
        return <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "link_list":
        return <Link2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "social_icons":
        return <Share2 className="w-4 h-4 text-pink-600 dark:text-pink-400" />;
      case "spacer":
        return <Maximize2 className="w-4 h-4 text-slate-500" />;
      case "divider":
        return <Minus className="w-4 h-4 text-slate-500" />;
      case "button":
        return <MousePointerClick className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case "gallery":
        return <Images className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case "menu_card":
        return <UtensilsCrossed className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />;
      case "accordion":
        return <ListCollapse className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case "video_embed":
        return <PlaySquare className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case "map":
        return <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "hero_section":
        return <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "toc_bar":
        return <ListOrdered className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "stats_strip":
        return <BarChart2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "split_content":
        return <Columns2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "info_cards":
        return <LayoutGrid className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "pricing_table":
        return <Table2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "product_grid":
        return <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "store_locator":
        return <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "lead_form":
        return <Inbox className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "banner_slider":
        return <Images className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "testimonials":
        return <MessageSquareQuote className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "cta_banner":
        return <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getBlockTitle = (type: BlockType) => {
    switch (type) {
      case "header":
        return "Tiêu đề & Avatar (Header)";
      case "heading":
        return "Tiêu đề mục (Heading)";
      case "text":
        return "Đoạn văn bản (Text)";
      case "image":
        return "Hình ảnh / Banner (Image)";
      case "link_list":
        return "Danh sách liên kết (Link List)";
      case "social_icons":
        return "Mạng xã hội (Social Icons)";
      case "spacer":
        return "Khoảng cách (Spacer)";
      case "divider":
        return "Đường kẻ (Divider)";
      case "button":
        return "Nút nổi bật (Button)";
      case "gallery":
        return "Thư viện ảnh (Gallery)";
      case "menu_card":
        return "Thẻ món (Menu)";
      case "accordion":
        return "Hỏi đáp / Thông tin (FAQ)";
      case "video_embed":
        return "Video YouTube / TikTok";
      case "map":
        return "Bản đồ / Địa chỉ (Map)";
      case "hero_section":
        return "Banner mở đầu (Hero)";
      case "toc_bar":
        return "Mục lục nhảy mục (TOC)";
      case "stats_strip":
        return "Dải chỉ số uy tín (Stats)";
      case "split_content":
        return "Khối 2 cột Ảnh – Chữ";
      case "info_cards":
        return "Thẻ thông số / Quy trình";
      case "pricing_table":
        return "Bảng báo giá đa cột";
      case "product_grid":
        return "Lưới sản phẩm / Menu";
      case "store_locator":
        return "Bản đồ hệ thống chi nhánh";
      case "lead_form":
        return "Form đăng ký / Nhận báo giá";
      case "banner_slider":
        return "Banner trượt nhiều ảnh (Slider)";
      case "testimonials":
        return "Đánh giá khách hàng / Đối tác";
      case "cta_banner":
        return "Dải kêu gọi hành động (CTA)";
    }
  };

  const getBlockSummary = () => {
    switch (block.type) {
      case "header": {
        const p = block.payload as HeaderBlockPayload;
        const plainBio = (p.bio || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return p.title || plainBio || "Chưa nhập thông tin tiêu đề";
      }
      case "heading": {
        const p = block.payload as HeadingBlockPayload;
        return p.text ? `H${p.level || 2}: "${p.text}"` : "Chưa có nội dung tiêu đề";
      }
      case "text": {
        const p = block.payload as TextBlockPayload;
        const plain = (p.content || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return plain ? plain.slice(0, 45) + (plain.length > 45 ? "..." : "") : "Đoạn văn bản trống";
      }
      case "image": {
        const p = block.payload as ImageBlockPayload;
        return p.caption || (p.imageUrl ? "Đã chọn ảnh" : "Chưa chọn ảnh");
      }
      case "link_list": {
        const count = block.placements?.length || 0;
        return `${count} liên kết trong khối`;
      }
      case "social_icons": {
        const count = block.placements?.length || 0;
        return `${count} icon mạng xã hội`;
      }
      case "spacer": {
        const p = block.payload as SpacerBlockPayload;
        return `Độ cao: ${p.height || "md"}`;
      }
      case "divider": {
        const p = block.payload as DividerBlockPayload;
        return `Kiểu nét: ${p.style || "solid"}`;
      }
      case "button":
        return block.placements?.[0]
          ? `Nút: ${block.placements[0].labelOverride || block.placements[0].defaultLabel}`
          : "Chưa chọn liên kết";
      case "gallery":
        return `${((block.payload as { images?: unknown[] }).images || []).length} ảnh`;
      case "menu_card":
        return `${((block.payload as { items?: unknown[] }).items || []).length} món`;
      case "accordion":
        return `${((block.payload as { items?: unknown[] }).items || []).length} mục`;
      case "video_embed":
        return (block.payload as { url?: string }).url || "Chưa có link video";
      case "map":
        return (block.payload as { address?: string }).address || "Chưa nhập địa chỉ";
      default:
        return "";
    }
  };

  const updatePayload = (partial: Record<string, unknown>) => {
    onUpdateBlock({
      ...block,
      payload: { ...block.payload, ...partial },
    });
  };

  const v2Props = {
    block,
    updatePayload,
    onUpdateBlock,
    availableLinks,
    availableMedia,
    onMediaAdded,
  };

  const handleAddLinkPlacement = () => {
    if (!selectedLinkToAdd) return;
    const link = availableLinks.find((l) => l.id === selectedLinkToAdd);
    if (!link) return;

    const placements = block.placements || [];
    const newPlacement: LinkPlacementItem = {
      id: crypto.randomUUID(),
      linkId: link.id,
      position: placements.length,
      defaultLabel: link.defaultLabel,
      defaultUrl: link.targetUrl,
      defaultKind: link.kind,
      defaultMediaUrl: link.defaultMediaUrl,
    };

    onUpdateBlock({
      ...block,
      placements: [...placements, newPlacement],
    });
    setSelectedLinkToAdd("");
  };

  const handleRemovePlacement = (placementId: string) => {
    const updated = (block.placements || [])
      .filter((p) => p.id !== placementId)
      .map((p, idx) => ({ ...p, position: idx }));

    onUpdateBlock({
      ...block,
      placements: updated,
    });
  };

  const handleMovePlacement = (indexToMove: number, direction: "up" | "down") => {
    const placements = [...(block.placements || [])];
    const targetIdx = direction === "up" ? indexToMove - 1 : indexToMove + 1;
    if (targetIdx < 0 || targetIdx >= placements.length) return;

    const temp = placements[indexToMove];
    placements[indexToMove] = placements[targetIdx];
    placements[targetIdx] = temp;

    const reordered = placements.map((p, idx) => ({ ...p, position: idx }));
    onUpdateBlock({
      ...block,
      placements: reordered,
    });
  };

  const handleUpdatePlacement = (placementId: string, partial: Partial<LinkPlacementItem>) => {
    const updated = (block.placements || []).map((p) =>
      p.id === placementId ? { ...p, ...partial } : p
    );
    onUpdateBlock({
      ...block,
      placements: updated,
    });
  };

  return (
    <div
      id={`block-editor-${block.id}`}
      data-block-card=""
      className={`rounded-2xl border transition-all duration-200 overflow-hidden scroll-mt-4 ${
        isSelected ? "ring-2 ring-sky-500 ring-offset-2 ring-offset-background " : ""
      }${
        block.isVisible
          ? "border-border/80 bg-card shadow-xs hover:border-slate-400/50 dark:hover:border-slate-600/60"
          : "border-dashed border-border/60 bg-muted/30 opacity-75"
      }`}
    >
      {/* Block Header: trên điện thoại tên khối ở hàng trên, nút thao tác xuống hàng dưới */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-2.5 sm:p-3.5 border-b border-border/60 bg-muted/20 gap-x-2 gap-y-1.5">
        <div
          onClick={() => {
            toggleExpand();
            onSelect?.();
          }}
          className="order-1 flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0"
        >
          {dragHandle}
          <div className="p-1.5 rounded-xl bg-background border border-border/80 shadow-2xs shrink-0">
            {getBlockIcon(block.type)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold truncate text-foreground">
                {getBlockTitle(block.type)}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 rounded shrink-0">
                #{block.position + 1}
              </span>
              {!block.isVisible && (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 rounded shrink-0">
                  Đã ẩn
                </span>
              )}
            </div>
            {!isExpanded && (
              <span className="text-[11px] text-muted-foreground block truncate mt-0.5 font-normal">
                {getBlockSummary()}
              </span>
            )}
          </div>
        </div>

        {/* Thu gọn / mở rộng */}
        <button
          type="button"
          onClick={toggleExpand}
          className="order-2 sm:order-3 w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted cursor-pointer transition-colors shrink-0"
          title={isExpanded ? "Thu gọn khối" : "Mở rộng khối"}
          aria-label={isExpanded ? "Thu gọn khối" : "Mở rộng khối"}
          aria-expanded={isExpanded}
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
          />
        </button>

        {/* Action Controls */}
        <div className="order-3 sm:order-2 w-full sm:w-auto flex items-center justify-end gap-1 shrink-0 pt-1.5 sm:pt-0 border-t border-border/40 sm:border-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer transition-colors"
            title="Di chuyển lên"
            aria-label="Di chuyển lên"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalBlocks - 1}
            className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer transition-colors"
            title="Di chuyển xuống"
            aria-label="Di chuyển xuống"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors"
              title="Nhân bản khối này"
              aria-label="Nhân bản khối này"
            >
              <Copy className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onUpdateBlock({ ...block, isVisible: !block.isVisible })}
            className={`w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
              block.isVisible
                ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                : "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
            }`}
            title={block.isVisible ? "Ẩn khối khỏi trang hiển thị" : "Hiện khối trở lại"}
            aria-label={block.isVisible ? "Ẩn khối khỏi trang hiển thị" : "Hiện khối trở lại"}
          >
            {block.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer transition-colors"
            title="Xóa khối này"
            aria-label="Xóa khối này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Block Form Content */}
      {isExpanded && (
        <div className="p-3 sm:p-4 pb-5 sm:pb-6 space-y-4 text-xs bg-card">
          {/* 2 tab con bên trong khối: Nội dung | Kiểu khối */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/50 border border-border/60">
            <button
              type="button"
              onClick={() => setInnerTab("content")}
              className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                innerTab === "content"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Nội dung
            </button>
            <button
              type="button"
              onClick={() => setInnerTab("style")}
              className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                innerTab === "style"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Kiểu khối</span>
              {hasBlockStyle && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              )}
            </button>
          </div>

          {innerTab === "style" ? (
            <BlockStyleEditor block={block} updatePayload={updatePayload} embedded />
          ) : (
            <div className="space-y-4">
              {/* 1. Header block editor */}
              {block.type === "header" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">
                      Tiêu đề hiển thị (Profile Title)
                    </label>
                    <input
                      type="text"
                      placeholder="Gờ Cafe - Cà phê chuẩn gu"
                      value={(block.payload as HeaderBlockPayload).title || ""}
                      onChange={(e) => updatePayload({ title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1.5">
                      Tiểu sử / Giới thiệu ngắn (Bio)
                    </label>
                    <RichTextEditor
                      value={(block.payload as HeaderBlockPayload).bio || ""}
                      onChange={(bio) => updatePayload({ bio })}
                      placeholder="Mô tả phong cách, giờ mở cửa hoặc câu khẩu hiệu..."
                      minHeight={110}
                      ariaLabel="Tiểu sử / Giới thiệu ngắn (Bio)"
                    />
                  </div>

                  {/* Avatar picker */}
                  <MediaPickerField
                    label="Ảnh đại diện (Avatar)"
                    mediaId={(block.payload as HeaderBlockPayload).avatarMediaId}
                    mediaUrl={(block.payload as HeaderBlockPayload).avatarUrl}
                    onChange={(mId, mUrl) =>
                      updatePayload({
                        avatarMediaId: mId || undefined,
                        avatarUrl: mUrl || undefined,
                      })
                    }
                    availableMedia={availableMedia}
                    onMediaAdded={onMediaAdded}
                    aspectHint="circle"
                    helpText="Hiển thị đầu trang"
                  />

                  {/* Banner picker */}
                  <MediaPickerField
                    label="Ảnh bìa / Banner đầu trang (Banner)"
                    mediaId={(block.payload as HeaderBlockPayload).bannerMediaId}
                    mediaUrl={(block.payload as HeaderBlockPayload).bannerUrl}
                    onChange={(mId, mUrl) =>
                      updatePayload({
                        bannerMediaId: mId || undefined,
                        bannerUrl: mUrl || undefined,
                      })
                    }
                    availableMedia={availableMedia}
                    onMediaAdded={onMediaAdded}
                    aspectHint="banner"
                    helpText="Hiển thị ảnh bìa phía trên avatar"
                  />
                </div>
              )}

              {/* 2. Heading block editor */}
              {block.type === "heading" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">
                      Nội dung tiêu đề
                    </label>
                    <input
                      type="text"
                      placeholder="Tiêu đề mục..."
                      value={(block.payload as HeadingBlockPayload).text || ""}
                      onChange={(e) => updatePayload({ text: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">
                      Cấp độ tiêu đề
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => updatePayload({ level: lvl })}
                          className={`flex-1 py-1.5 rounded-xl border cursor-pointer font-bold transition-all ${
                            ((block.payload as HeadingBlockPayload).level ?? 2) === lvl
                              ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          H{lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Text block editor */}
              {block.type === "text" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1.5">
                      Nội dung văn bản
                    </label>
                    <RichTextEditor
                      value={(block.payload as TextBlockPayload).content || ""}
                      onChange={(content) => updatePayload({ content })}
                      placeholder="Nhập nội dung văn bản giới thiệu, ghi chú hoặc thông báo..."
                      minHeight={130}
                      ariaLabel="Nội dung văn bản"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Căn lề</label>
                    <div className="flex gap-2">
                      {(["left", "center", "right"] as const).map((al) => (
                        <button
                          key={al}
                          type="button"
                          onClick={() => updatePayload({ align: al })}
                          className={`flex-1 min-h-10 sm:min-h-0 py-1.5 rounded-xl border cursor-pointer capitalize transition-all ${
                            ((block.payload as TextBlockPayload).align || "center") === al
                              ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {al === "left" ? "Căn trái" : al === "center" ? "Căn giữa" : "Căn phải"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Image block editor */}
              {block.type === "image" && (
                <div className="space-y-3.5">
                  <MediaPickerField
                    label="Chọn ảnh từ kho lưu trữ"
                    mediaId={(block.payload as ImageBlockPayload).mediaAssetId}
                    mediaUrl={(block.payload as ImageBlockPayload).imageUrl}
                    onChange={(mId, mUrl) =>
                      updatePayload({
                        mediaAssetId: mId || undefined,
                        imageUrl: mUrl || undefined,
                      })
                    }
                    availableMedia={availableMedia}
                    onMediaAdded={onMediaAdded}
                    aspectHint="standard"
                    cropAspect="16:9"
                  />

                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">
                      Chú thích ảnh (Caption)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Không gian quán tại chi nhánh Quận 1"
                      value={(block.payload as ImageBlockPayload).caption || ""}
                      onChange={(e) => updatePayload({ caption: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">
                      Liên kết khi nhấn vào ảnh (Tùy chọn)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={(block.payload as ImageBlockPayload).targetUrl || ""}
                      onChange={(e) => updatePayload({ targetUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              )}

              {/* 5. Link List block editor */}
              {block.type === "link_list" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/60">
                    <span className="font-semibold text-muted-foreground">Bố cục hiển thị nút</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updatePayload({ layout: "stack" })}
                        className={`min-h-10 sm:min-h-0 px-3 py-1.5 rounded-xl border cursor-pointer transition-all whitespace-nowrap ${
                          ((block.payload as LinkListBlockPayload).layout || "stack") === "stack"
                            ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Xếp chồng (Stack)
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePayload({ layout: "grid" })}
                        className={`min-h-10 sm:min-h-0 px-3 py-1.5 rounded-xl border cursor-pointer transition-all whitespace-nowrap ${
                          (block.payload as LinkListBlockPayload).layout === "grid"
                            ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Lưới 2 cột (Grid)
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePayload({ layout: "split" })}
                        className={`min-h-10 sm:min-h-0 px-3 py-1.5 rounded-xl border cursor-pointer transition-all whitespace-nowrap ${
                          (block.payload as LinkListBlockPayload).layout === "split"
                            ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Hai bên (Trái – Phải)
                      </button>
                    </div>
                  </div>

                  {/* Placements list */}
                  <div className="space-y-2.5">
                    <span className="font-semibold text-muted-foreground block">
                      Các liên kết trong khối này ({block.placements?.length || 0})
                    </span>

                    {(block.placements || []).length === 0 ? (
                      <div className="p-4 text-center rounded-xl bg-muted/20 border border-dashed border-border text-muted-foreground text-xs">
                        Chưa có liên kết nào. Chọn liên kết ở ô bên dưới và bấm &quot;Thêm vào
                        khối&quot;.
                      </div>
                    ) : (
                      (block.placements || []).map((pl, pIdx) => {
                        const isPlExpanded = Boolean(expandedPlacements[pl.id]);
                        const hasCustomTitle = Boolean(pl.labelOverride?.trim());
                        const linkPayload = block.payload as LinkListBlockPayload;
                        const btnColor = (linkPayload.buttonColors || {})[pl.defaultUrl] || {};
                        const hasZaloOverride = Boolean(
                          (linkPayload.zaloByTel || {})[pl.defaultUrl]?.trim()
                        );
                        const hasAdvancedCustom = Boolean(
                          pl.mediaOverrideId || btnColor.bg || btnColor.text || hasZaloOverride
                        );
                        return (
                          <div
                            key={pl.id}
                            className="p-3 rounded-xl border border-border bg-card shadow-2xs space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="tabular-nums text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md shrink-0">
                                  #{pIdx + 1}
                                </span>
                                <span
                                  className="font-mono text-[11px] text-muted-foreground truncate"
                                  title={pl.defaultUrl}
                                >
                                  {pl.defaultUrl}
                                </span>
                              </div>

                              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleMovePlacement(pIdx, "up")}
                                  disabled={pIdx === 0}
                                  className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                                  title="Di chuyển lên"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMovePlacement(pIdx, "down")}
                                  disabled={pIdx === (block.placements || []).length - 1}
                                  className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                                  title="Di chuyển xuống"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => togglePlacementExpand(pl.id)}
                                  className={`relative inline-flex items-center gap-1 h-8 sm:h-7 px-2 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                                    isPlExpanded || hasAdvancedCustom
                                      ? "bg-muted text-foreground font-semibold"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                  }`}
                                  title="Tuỳ chỉnh màu nút, icon và Zalo riêng"
                                >
                                  <SlidersHorizontal className="w-3 h-3" />
                                  <span className="hidden sm:inline">Tuỳ chỉnh</span>
                                  {hasAdvancedCustom && !isPlExpanded && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                  )}
                                  <ChevronRight
                                    className={`w-3 h-3 transition-transform ${
                                      isPlExpanded ? "rotate-90" : ""
                                    }`}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePlacement(pl.id)}
                                  className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer shrink-0"
                                  title="Xóa liên kết khỏi khối"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inline button title input — luôn hiển thị để sửa tiêu đề ngay */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label
                                  htmlFor={`placement-title-${pl.id}`}
                                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>
                                    {(block.payload as LinkListBlockPayload).layout === "split"
                                      ? "Chữ bên trái (tiêu đề)"
                                      : "Tiêu đề hiển thị trên nút"}
                                  </span>
                                </label>
                                {hasCustomTitle && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdatePlacement(pl.id, { labelOverride: null })
                                    }
                                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                                    title={`Khôi phục tên gốc: ${pl.defaultLabel}`}
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    <span>Dùng tên gốc</span>
                                  </button>
                                )}
                              </div>
                              <textarea
                                id={`placement-title-${pl.id}`}
                                rows={(pl.labelOverride ?? pl.defaultLabel).includes("\n") ? 2 : 1}
                                maxLength={100}
                                placeholder={pl.defaultLabel}
                                value={pl.labelOverride ?? pl.defaultLabel}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  handleUpdatePlacement(pl.id, {
                                    labelOverride: next === pl.defaultLabel ? null : next,
                                  });
                                }}
                                onBlur={() => {
                                  if (
                                    pl.labelOverride !== null &&
                                    pl.labelOverride !== undefined &&
                                    pl.labelOverride.trim() === ""
                                  ) {
                                    handleUpdatePlacement(pl.id, { labelOverride: null });
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                              />
                            </div>

                            {/* Chữ bên phải (màu nhấn) khi chọn bố cục Hai bên (Trái – Phải) */}
                            {(block.payload as LinkListBlockPayload).layout === "split" && (
                              <div>
                                <label
                                  htmlFor={`placement-right-${pl.id}`}
                                  className="block text-[11px] text-muted-foreground font-medium mb-1"
                                >
                                  Chữ bên phải (màu nhấn — tuỳ chọn)
                                </label>
                                <input
                                  id={`placement-right-${pl.id}`}
                                  type="text"
                                  maxLength={80}
                                  placeholder={
                                    pl.defaultUrl?.trim().toLowerCase().startsWith("tel:")
                                      ? `Mặc định: ${parsePhoneTarget(pl.defaultUrl).display} (gõ để đổi, VD: 0345.75.0007)`
                                      : "VD: Xem ngay, Điền form →, 0345.75.0007..."
                                  }
                                  value={
                                    ((block.payload as LinkListBlockPayload).rightTextByUrl || {})[
                                      pl.defaultUrl
                                    ] || ""
                                  }
                                  onChange={(e) => {
                                    const prevMap = {
                                      ...((block.payload as LinkListBlockPayload).rightTextByUrl ||
                                        {}),
                                    };
                                    const val = e.target.value;
                                    if (val.trim()) {
                                      prevMap[pl.defaultUrl] = val;
                                    } else {
                                      delete prevMap[pl.defaultUrl];
                                    }
                                    updatePayload({
                                      rightTextByUrl:
                                        Object.keys(prevMap).length > 0 ? prevMap : undefined,
                                    });
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            )}

                            {/* Tuỳ chỉnh nâng cao (Màu nút, Zalo riêng, Icon) — thu gọn mặc định cho gọn mắt */}
                            {isPlExpanded && (
                              <div className="pt-2.5 border-t border-border/60 space-y-3">
                                {/* Màu riêng cho từng nút */}
                                {(() => {
                                  const colorMap = linkPayload.buttonColors || {};
                                  const updateBtnColor = (
                                    patch: { bg?: string; text?: string } | null
                                  ) => {
                                    const nextMap = { ...colorMap };
                                    if (!patch) {
                                      delete nextMap[pl.defaultUrl];
                                    } else {
                                      const merged = { ...btnColor, ...patch };
                                      if (!merged.bg) delete merged.bg;
                                      if (!merged.text) delete merged.text;
                                      if (Object.keys(merged).length === 0) {
                                        delete nextMap[pl.defaultUrl];
                                      } else {
                                        nextMap[pl.defaultUrl] = merged;
                                      }
                                    }
                                    updatePayload({
                                      buttonColors:
                                        Object.keys(nextMap).length > 0 ? nextMap : undefined,
                                    });
                                  };
                                  return (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[11px] text-muted-foreground font-medium mr-0.5">
                                        Màu nút:
                                      </span>
                                      {(
                                        [
                                          ["#EE4D2D", "Cam Shopee"],
                                          ["#111111", "Đen TikTok"],
                                          ["#0068FF", "Xanh Zalo"],
                                          ["#1877F2", "Xanh Facebook"],
                                          ["#16A34A", "Xanh lá"],
                                          ["#D97706", "Vàng"],
                                        ] as const
                                      ).map(([hex, name]) => (
                                        <button
                                          key={hex}
                                          type="button"
                                          title={name}
                                          onClick={() => updateBtnColor({ bg: hex })}
                                          className={`w-5 h-5 rounded-full border cursor-pointer transition-transform hover:scale-110 ${
                                            btnColor.bg?.toUpperCase() === hex
                                              ? "ring-2 ring-primary ring-offset-1 border-white"
                                              : "border-black/20"
                                          }`}
                                          style={{ backgroundColor: hex }}
                                        />
                                      ))}
                                      <label
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-input bg-background text-[10px] cursor-pointer"
                                        title="Chọn màu nền nút tuỳ ý"
                                      >
                                        <input
                                          type="color"
                                          value={btnColor.bg || "#EE4D2D"}
                                          onChange={(e) =>
                                            updateBtnColor({ bg: e.target.value.toUpperCase() })
                                          }
                                          className="w-3.5 h-3.5 rounded border-0 bg-transparent cursor-pointer p-0"
                                        />
                                        <span>Nền</span>
                                      </label>
                                      <label
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-input bg-background text-[10px] cursor-pointer"
                                        title="Chọn màu chữ trên nút tuỳ ý"
                                      >
                                        <input
                                          type="color"
                                          value={btnColor.text || "#FFFFFF"}
                                          onChange={(e) =>
                                            updateBtnColor({ text: e.target.value.toUpperCase() })
                                          }
                                          className="w-3.5 h-3.5 rounded border-0 bg-transparent cursor-pointer p-0"
                                        />
                                        <span>Chữ</span>
                                      </label>
                                      {(btnColor.bg || btnColor.text) && (
                                        <button
                                          type="button"
                                          onClick={() => updateBtnColor(null)}
                                          className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer ml-auto"
                                          title="Quay về màu chung của trang"
                                        >
                                          <RotateCcw className="w-2.5 h-2.5" />
                                          <span>Mặc định</span>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* Nếu là link số điện thoại (tel:...), cho nhập số/link Zalo riêng */}
                                {pl.defaultUrl?.trim().toLowerCase().startsWith("tel:") && (
                                  <div>
                                    <label
                                      htmlFor={`placement-zalo-${pl.id}`}
                                      className="block text-[11px] text-muted-foreground font-medium mb-1"
                                    >
                                      Số hoặc link Zalo riêng (để trống = dùng SĐT gốc)
                                    </label>
                                    <input
                                      id={`placement-zalo-${pl.id}`}
                                      type="text"
                                      maxLength={200}
                                      placeholder="VD: 0901234567 hoặc https://zalo.me/gocafe"
                                      value={(linkPayload.zaloByTel || {})[pl.defaultUrl] || ""}
                                      onChange={(e) => {
                                        const prevMap = { ...(linkPayload.zaloByTel || {}) };
                                        const val = e.target.value;
                                        if (val.trim()) {
                                          prevMap[pl.defaultUrl] = val;
                                        } else {
                                          delete prevMap[pl.defaultUrl];
                                        }
                                        updatePayload({
                                          zaloByTel:
                                            Object.keys(prevMap).length > 0 ? prevMap : undefined,
                                        });
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </div>
                                )}

                                {/* Icon override */}
                                <MediaPickerField
                                  label="Ghi đè icon nút (Tùy chọn)"
                                  mediaId={pl.mediaOverrideId}
                                  mediaUrl={pl.mediaOverrideUrl}
                                  onChange={(mId, mUrl) =>
                                    handleUpdatePlacement(pl.id, {
                                      mediaOverrideId: mId || null,
                                      mediaOverrideUrl: mUrl || null,
                                    })
                                  }
                                  availableMedia={availableMedia}
                                  onMediaAdded={onMediaAdded}
                                  aspectHint="circle"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add link picker */}
                  <div className="pt-3 pb-1 border-t border-border/60">
                    <label className="block font-semibold text-muted-foreground mb-1.5">
                      Thêm liên kết vào danh sách:
                    </label>
                    <div className="flex items-center gap-2">
                      <Select
                        size="sm"
                        ariaLabel="Chọn liên kết để thêm vào khối"
                        value={selectedLinkToAdd}
                        onChange={setSelectedLinkToAdd}
                        placeholder="-- Chọn liên kết để thêm vào khối --"
                        options={[
                          { value: "", label: "-- Chọn liên kết để thêm vào khối --" },
                          ...availableLinks.map((l) => ({
                            value: l.id,
                            label: l.defaultLabel,
                            description: l.targetUrl,
                          })),
                        ]}
                        className="flex-1 min-w-0 h-9"
                      />
                      <button
                        type="button"
                        onClick={handleAddLinkPlacement}
                        disabled={!selectedLinkToAdd}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-40 cursor-pointer shrink-0 transition-opacity shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Social Icons block editor */}
              {block.type === "social_icons" && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">
                      Kiểu hiển thị icon
                    </label>
                    <div className="flex gap-2">
                      {(["colored", "monochrome", "outline"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updatePayload({ style: st })}
                          className={`flex-1 min-h-10 sm:min-h-0 py-1.5 rounded-xl border cursor-pointer capitalize transition-all ${
                            ((block.payload as SocialIconsBlockPayload).style || "colored") === st
                              ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {st === "colored"
                            ? "Màu gốc"
                            : st === "monochrome"
                              ? "Đơn sắc"
                              : "Đường viền"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-semibold text-muted-foreground block">
                      Các liên kết mạng xã hội ({block.placements?.length || 0})
                    </span>

                    {(block.placements || []).length === 0 ? (
                      <div className="p-4 text-center rounded-xl bg-muted/20 border border-dashed border-border text-muted-foreground text-xs">
                        Chưa có icon mạng xã hội nào. Chọn link bên dưới để thêm.
                      </div>
                    ) : (
                      (block.placements || []).map((pl) => (
                        <div
                          key={pl.id}
                          className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl border border-border bg-background shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold truncate text-foreground">
                              {pl.labelOverride || pl.defaultLabel}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                              ({pl.defaultUrl})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePlacement(pl.id)}
                            className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer shrink-0"
                            title="Xóa icon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add social link picker */}
                  <div className="pt-3 pb-1 border-t border-border/60">
                    <label className="block font-semibold text-muted-foreground mb-1.5">
                      Thêm mạng xã hội vào khối:
                    </label>
                    <div className="flex items-center gap-2">
                      <Select
                        size="sm"
                        ariaLabel="Chọn link mạng xã hội"
                        value={selectedLinkToAdd}
                        onChange={setSelectedLinkToAdd}
                        placeholder="-- Chọn link mạng xã hội --"
                        options={[
                          { value: "", label: "-- Chọn link mạng xã hội --" },
                          ...availableLinks
                            .filter((l) => l.kind === "social")
                            .map((l) => ({
                              value: l.id,
                              label: l.defaultLabel,
                              description: l.targetUrl,
                            })),
                        ]}
                        className="flex-1 min-w-0 h-9"
                      />
                      <button
                        type="button"
                        onClick={handleAddLinkPlacement}
                        disabled={!selectedLinkToAdd}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-40 cursor-pointer shrink-0 transition-opacity shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Spacer block editor */}
              {block.type === "spacer" && (
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1.5">
                    Chiều cao khoảng cách
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        { key: "sm", label: "Nhỏ (10px)" },
                        { key: "md", label: "Vừa (20px)" },
                        { key: "lg", label: "Lớn (32px)" },
                        { key: "xl", label: "Rất lớn (48px)" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => updatePayload({ height: item.key })}
                        className={`py-2 px-1 rounded-xl border cursor-pointer text-center transition-all ${
                          ((block.payload as SpacerBlockPayload).height || "md") === item.key
                            ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                            : "border-border hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="block text-xs">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. Divider block editor */}
              {block.type === "divider" && (
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1.5">
                    Kiểu đường kẻ
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { key: "solid", label: "Nét liền (Solid)" },
                        { key: "dashed", label: "Nét đứt (Dashed)" },
                        { key: "dotted", label: "Chấm bi (Dotted)" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => updatePayload({ style: item.key })}
                        className={`py-2 px-1 rounded-xl border cursor-pointer text-center transition-all ${
                          ((block.payload as DividerBlockPayload).style || "solid") === item.key
                            ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                            : "border-border hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="block text-xs">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. Khối mới (v2) */}
              {block.type === "button" && <ButtonBlockEditor {...v2Props} />}
              {block.type === "gallery" && <GalleryBlockEditor {...v2Props} />}
              {block.type === "menu_card" && <MenuCardBlockEditor {...v2Props} />}
              {block.type === "accordion" && <AccordionBlockEditor {...v2Props} />}
              {block.type === "video_embed" && <VideoBlockEditor {...v2Props} />}
              {block.type === "map" && <MapBlockEditor {...v2Props} />}

              {/* 10. Khối Landing Page — Hero Section */}
              {block.type === "hero_section" &&
                (() => {
                  const hp = block.payload as HeroSectionBlockPayload;
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          Bố cục Banner
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              { key: "split", label: "2 cột Ảnh–Chữ" },
                              { key: "centered", label: "Căn giữa" },
                              { key: "full-bg", label: "Ảnh nền tối" },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => updatePayload({ layout: opt.key })}
                              className={`py-2 px-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                (hp.layout || "split") === opt.key
                                  ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                                  : "border-border hover:bg-muted text-muted-foreground"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1">
                          Nhãn nhỏ phía trên (Eyebrow)
                        </label>
                        <input
                          type="text"
                          value={hp.eyebrow || ""}
                          onChange={(e) => updatePayload({ eyebrow: e.target.value })}
                          placeholder="VD: GỜ CAFÉ • TỪ 2013"
                          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1">
                          Tiêu đề chính (H1)
                        </label>
                        <input
                          type="text"
                          value={hp.title || ""}
                          onChange={(e) => updatePayload({ title: e.target.value })}
                          placeholder="VD: Cà phê nguyên chất — Chuẩn gu mỗi ngày"
                          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1">
                          Mô tả ngắn
                        </label>
                        <textarea
                          rows={3}
                          value={hp.subtitle || ""}
                          onChange={(e) => updatePayload({ subtitle: e.target.value })}
                          placeholder="Giới thiệu ngắn gọn về thương hiệu hoặc ưu đãi..."
                          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background resize-y"
                        />
                      </div>

                      <MediaPickerField
                        label="Hình ảnh Banner (hoặc ảnh bìa Video)"
                        mediaId={hp.mediaId}
                        mediaUrl={hp.imageUrl}
                        availableMedia={availableMedia}
                        onMediaAdded={onMediaAdded}
                        onChange={(mId, mUrl) =>
                          updatePayload({
                            mediaId: mId || undefined,
                            imageUrl: mUrl || undefined,
                          })
                        }
                      />

                      {hp.layout === "full-bg" && (
                        <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                              Link Video nền MP4 (tuỳ chọn — tự phát lặp không tiếng)
                            </label>
                            <input
                              type="text"
                              value={hp.videoUrl || ""}
                              onChange={(e) => updatePayload({ videoUrl: e.target.value })}
                              placeholder="https://.../hero-video.mp4"
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                Độ tối lớp phủ ({hp.overlayOpacity ?? 55}%)
                              </label>
                              <input
                                type="range"
                                min={0}
                                max={85}
                                step={5}
                                value={hp.overlayOpacity ?? 55}
                                onChange={(e) =>
                                  updatePayload({ overlayOpacity: Number(e.target.value) })
                                }
                                className="w-full accent-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                Chiều cao Banner
                              </label>
                              <Select
                                value={hp.height || "default"}
                                onChange={(v) => updatePayload({ height: v })}
                                options={[
                                  { value: "compact", label: "Gọn" },
                                  { value: "default", label: "Chuẩn" },
                                  { value: "tall", label: "Lớn (Nổi bật)" },
                                ]}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="block font-semibold text-muted-foreground mb-1">
                            Nút chính (Label)
                          </label>
                          <input
                            type="text"
                            value={hp.primaryCtaLabel || ""}
                            onChange={(e) => updatePayload({ primaryCtaLabel: e.target.value })}
                            placeholder="VD: Nhận tư vấn ngay"
                            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-muted-foreground mb-1">
                            Đường dẫn nút chính
                          </label>
                          <input
                            type="text"
                            value={hp.primaryCtaHref || ""}
                            onChange={(e) => updatePayload({ primaryCtaHref: e.target.value })}
                            placeholder="VD: #lien-he hoặc https://..."
                            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-semibold text-muted-foreground mb-1">
                            Nút phụ (Label)
                          </label>
                          <input
                            type="text"
                            value={hp.secondaryCtaLabel || ""}
                            onChange={(e) => updatePayload({ secondaryCtaLabel: e.target.value })}
                            placeholder="VD: Xem bảng giá"
                            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-muted-foreground mb-1">
                            Đường dẫn nút phụ
                          </label>
                          <input
                            type="text"
                            value={hp.secondaryCtaHref || ""}
                            onChange={(e) => updatePayload({ secondaryCtaHref: e.target.value })}
                            placeholder="VD: /xuong-rang-ca-phe"
                            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/50">
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Mã neo mục lục (Anchor ID — tuỳ chọn)
                        </label>
                        <input
                          type="text"
                          value={hp.anchorId || ""}
                          onChange={(e) =>
                            updatePayload({
                              anchorId: e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-_]/g, "")
                                .slice(0, 64),
                            })
                          }
                          placeholder="VD: dau-trang"
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-input bg-background"
                        />
                      </div>
                    </div>
                  );
                })()}

              {/* 11. Các Section Landing Page (Phase 3) */}
              {block.type === "toc_bar" && (
                <TocBarEditor
                  payload={block.payload as Record<string, unknown>}
                  updatePayload={updatePayload}
                  availableMedia={availableMedia}
                  onMediaAdded={onMediaAdded}
                />
              )}
              {block.type === "stats_strip" && (
                <StatsStripEditor
                  payload={block.payload as Record<string, unknown>}
                  updatePayload={updatePayload}
                  availableMedia={availableMedia}
                  onMediaAdded={onMediaAdded}
                />
              )}
              {block.type === "split_content" && (
                <SplitContentEditor
                  payload={block.payload as Record<string, unknown>}
                  updatePayload={updatePayload}
                  availableMedia={availableMedia}
                  onMediaAdded={onMediaAdded}
                />
              )}
              {block.type === "info_cards" && (
                <InfoCardsEditor
                  payload={block.payload as Record<string, unknown>}
                  updatePayload={updatePayload}
                  availableMedia={availableMedia}
                  onMediaAdded={onMediaAdded}
                />
              )}
              {block.type === "pricing_table" && (
                <PricingTableEditor
                  payload={block.payload as Record<string, unknown>}
                  updatePayload={updatePayload}
                  availableMedia={availableMedia}
                  onMediaAdded={onMediaAdded}
                />
              )}
              {block.type === "product_grid" && (
                <ProductGridEditor
                  payload={block.payload as Record<string, unknown>}
                  updatePayload={updatePayload}
                  availableMedia={availableMedia}
                  onMediaAdded={onMediaAdded}
                />
              )}
              {block.type === "store_locator" && (
                <StoreLocatorEditor
                  payload={block.payload as Record<string, unknown>}
                  updatePayload={updatePayload}
                  availableMedia={availableMedia}
                  onMediaAdded={onMediaAdded}
                />
              )}
              {block.type === "lead_form" && (
                <LeadFormEditor
                  payload={block.payload as Record<string, unknown>}
                  updatePayload={updatePayload}
                  availableMedia={availableMedia}
                  onMediaAdded={onMediaAdded}
                />
              )}
              {block.type === "banner_slider" && (
                <BannerSliderEditor
                  payload={block.payload as Record<string, unknown>}
                  updatePayload={updatePayload}
                  availableMedia={availableMedia}
                  onMediaAdded={onMediaAdded}
                />
              )}
              {block.type === "testimonials" && (
                <TestimonialsEditor
                  payload={block.payload as Record<string, unknown>}
                  updatePayload={updatePayload}
                  availableMedia={availableMedia}
                  onMediaAdded={onMediaAdded}
                />
              )}
              {block.type === "cta_banner" && (
                <CtaBannerEditor
                  payload={block.payload as Record<string, unknown>}
                  updatePayload={updatePayload}
                  availableMedia={availableMedia}
                  onMediaAdded={onMediaAdded}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
