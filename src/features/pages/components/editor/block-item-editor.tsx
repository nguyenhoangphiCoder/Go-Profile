"use client";

import { useState } from "react";
import Image from "next/image";
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
  ExternalLink,
} from "lucide-react";
import type {
  EditorBlockItem,
  LinkPlacementItem,
  BlockType,
  HeaderBlockPayload,
  HeadingBlockPayload,
  TextBlockPayload,
  ImageBlockPayload,
  LinkListBlockPayload,
  SocialIconsBlockPayload,
  SpacerBlockPayload,
  DividerBlockPayload,
} from "../../types";
import { MediaPickerField } from "@/components/admin/media-picker-field";

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
  onMediaAdded?: (newMedia: { id: string; originalFilename: string | null; publicUrl: string | null }) => void;
  onUpdateBlock: (updated: EditorBlockItem) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
}

export function BlockItemEditor({
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
}: BlockItemEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
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
    }
  };

  const getBlockSummary = () => {
    switch (block.type) {
      case "header": {
        const p = block.payload as HeaderBlockPayload;
        return p.title || p.bio || "Chưa nhập thông tin tiêu đề";
      }
      case "heading": {
        const p = block.payload as HeadingBlockPayload;
        return p.text ? `H${p.level || 2}: "${p.text}"` : "Chưa có nội dung tiêu đề";
      }
      case "text": {
        const p = block.payload as TextBlockPayload;
        return p.content ? p.content.slice(0, 45) + (p.content.length > 45 ? "..." : "") : "Đoạn văn bản trống";
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
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        block.isVisible
          ? "border-border/80 bg-card shadow-xs hover:border-slate-400/50 dark:hover:border-slate-600/60"
          : "border-dashed border-border/60 bg-muted/30 opacity-75"
      }`}
    >
      {/* Block Header */}
      <div className="flex items-center justify-between p-3 sm:p-3.5 border-b border-border/60 bg-muted/20 gap-2">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0"
        >
          <div className="p-1.5 rounded-xl bg-background border border-border/80 shadow-2xs shrink-0">
            {getBlockIcon(block.type)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold truncate text-foreground">
                {getBlockTitle(block.type)}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded shrink-0">
                #{block.position + 1}
              </span>
              {!block.isVisible && (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded shrink-0">
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

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer transition-colors"
            title="Di chuyển lên"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalBlocks - 1}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer transition-colors"
            title="Di chuyển xuống"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors"
              title="Nhân bản khối này"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onUpdateBlock({ ...block, isVisible: !block.isVisible })}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              block.isVisible
                ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                : "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
            }`}
            title={block.isVisible ? "Ẩn khối khỏi trang hiển thị" : "Hiện khối trở lại"}
          >
            {block.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer transition-colors"
            title="Xóa khối này"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer transition-colors ml-0.5"
            title={isExpanded ? "Thu gọn khối" : "Mở rộng khối"}
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Block Form Content */}
      {isExpanded && (
        <div className="p-4 pb-6 space-y-4 text-xs bg-card">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-muted-foreground">
                    Tiểu sử / Giới thiệu ngắn (Bio)
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Gợi ý: Dùng <code className="text-primary font-mono">*chữ nghiêng*</code> để tô màu điểm nhấn
                  </span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Mô tả phong cách, giờ mở cửa hoặc câu khẩu hiệu..."
                  value={(block.payload as HeaderBlockPayload).bio || ""}
                  onChange={(e) => updatePayload({ bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                <label className="block font-semibold text-muted-foreground mb-1">
                  Nội dung văn bản
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập nội dung văn bản giới thiệu, ghi chú hoặc thông báo..."
                  value={(block.payload as TextBlockPayload).content || ""}
                  onChange={(e) => updatePayload({ content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                      className={`flex-1 py-1.5 rounded-xl border cursor-pointer capitalize transition-all ${
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
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="font-semibold text-muted-foreground">Bố cục hiển thị nút</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updatePayload({ layout: "stack" })}
                    className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
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
                    className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                      (block.payload as LinkListBlockPayload).layout === "grid"
                        ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Lưới 2 cột (Grid)
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
                    Chưa có liên kết nào. Chọn liên kết ở ô bên dưới và bấm &quot;Thêm vào khối&quot;.
                  </div>
                ) : (
                  (block.placements || []).map((pl, pIdx) => {
                    const isPlExpanded = Boolean(expandedPlacements[pl.id]);
                    return (
                      <div
                        key={pl.id}
                        className="p-3 rounded-xl border border-border bg-background shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div
                            onClick={() => togglePlacementExpand(pl.id)}
                            className="flex items-center gap-2 truncate flex-1 cursor-pointer select-none"
                          >
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded">
                              #{pIdx + 1}
                            </span>
                            <span className="font-bold truncate text-foreground">
                              {pl.labelOverride || pl.defaultLabel}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                              ({pl.defaultUrl})
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMovePlacement(pIdx, "up")}
                              disabled={pIdx === 0}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                              title="Di chuyển lên"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePlacement(pIdx, "down")}
                              disabled={pIdx === (block.placements || []).length - 1}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                              title="Di chuyển xuống"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePlacementExpand(pl.id)}
                              className="p-1 rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
                              title="Tùy biến nhãn & icon"
                            >
                              <ChevronRight
                                className={`w-3.5 h-3.5 transition-transform ${
                                  isPlExpanded ? "rotate-90" : ""
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePlacement(pl.id)}
                              className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                              title="Xóa liên kết khỏi khối"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Overrides drawer */}
                        {isPlExpanded && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border/40">
                            <div>
                              <label className="block text-[11px] text-muted-foreground font-medium mb-1">
                                Ghi đè nhãn nút (Tùy chọn)
                              </label>
                              <input
                                type="text"
                                placeholder={pl.defaultLabel}
                                value={pl.labelOverride || ""}
                                onChange={(e) =>
                                  handleUpdatePlacement(pl.id, {
                                    labelOverride: e.target.value || null,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>

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
                  <select
                    value={selectedLinkToAdd}
                    onChange={(e) => setSelectedLinkToAdd(e.target.value)}
                    className="flex-1 min-w-0 w-full px-3 py-2.5 rounded-xl border border-input bg-background cursor-pointer text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 truncate"
                  >
                    <option value="">-- Chọn liên kết để thêm vào khối --</option>
                    {availableLinks.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.defaultLabel} ({l.targetUrl})
                      </option>
                    ))}
                  </select>
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
                      className={`flex-1 py-1.5 rounded-xl border cursor-pointer capitalize transition-all ${
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
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background shadow-2xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold truncate text-foreground">
                          {pl.labelOverride || pl.defaultLabel}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          ({pl.defaultUrl})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePlacement(pl.id)}
                        className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
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
                  <select
                    value={selectedLinkToAdd}
                    onChange={(e) => setSelectedLinkToAdd(e.target.value)}
                    className="flex-1 min-w-0 w-full px-3 py-2.5 rounded-xl border border-input bg-background cursor-pointer text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 truncate"
                  >
                    <option value="">-- Chọn link mạng xã hội --</option>
                    {availableLinks
                      .filter((l) => l.kind === "social")
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.defaultLabel}
                        </option>
                      ))}
                  </select>
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
        </div>
      )}
    </div>
  );
}
