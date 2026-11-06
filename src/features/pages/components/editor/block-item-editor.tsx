"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Heading,
  AlignLeft,
  FileText,
  Image as ImageIcon,
  Link2,
  Share2,
  Maximize2,
  Minus,
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
  SpacerBlockPayload,
  DividerBlockPayload,
} from "../../types";

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
  onUpdateBlock: (updated: EditorBlockItem) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export function BlockItemEditor({
  block,
  index,
  totalBlocks,
  availableLinks,
  availableMedia,
  onUpdateBlock,
  onMoveUp,
  onMoveDown,
  onDelete,
}: BlockItemEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedLinkToAdd, setSelectedLinkToAdd] = useState("");

  const getBlockIcon = (type: BlockType) => {
    switch (type) {
      case "header":
        return <FileText className="w-4 h-4 text-primary" />;
      case "heading":
        return <Heading className="w-4 h-4 text-blue-500" />;
      case "text":
        return <AlignLeft className="w-4 h-4 text-emerald-500" />;
      case "image":
        return <ImageIcon className="w-4 h-4 text-amber-500" />;
      case "link_list":
        return <Link2 className="w-4 h-4 text-purple-500" />;
      case "social_icons":
        return <Share2 className="w-4 h-4 text-pink-500" />;
      case "spacer":
        return <Maximize2 className="w-4 h-4 text-slate-400" />;
      case "divider":
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBlockTitle = (type: BlockType) => {
    switch (type) {
      case "header":
        return "Khối Tiêu đề & Avatar (Header)";
      case "heading":
        return "Khối Tiêu đề mục (Heading)";
      case "text":
        return "Khối Đoạn văn bản (Text)";
      case "image":
        return "Khối Hình ảnh / Banner (Image)";
      case "link_list":
        return "Khối Danh sách liên kết (Link List)";
      case "social_icons":
        return "Khối Mạng xã hội (Social Icons)";
      case "spacer":
        return "Khối Khoảng cách (Spacer)";
      case "divider":
        return "Khối Đường kẻ ngăn cách (Divider)";
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
      className={`rounded-2xl border transition-all ${
        block.isVisible
          ? "border-border bg-card shadow-xs"
          : "border-border/50 bg-muted/20 opacity-60"
      }`}
    >
      {/* Block Header */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-border/60">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 cursor-pointer select-none flex-1"
        >
          <div className="p-1.5 rounded-lg bg-muted">{getBlockIcon(block.type)}</div>
          <div>
            <span className="text-xs font-bold block">{getBlockTitle(block.type)}</span>
            <span className="text-[10px] text-muted-foreground">Vị trí: #{block.position + 1}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
            title="Di chuyển lên"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalBlocks - 1}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
            title="Di chuyển xuống"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateBlock({ ...block, isVisible: !block.isVisible })}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
            title={block.isVisible ? "Ẩn khối này" : "Hiện khối này"}
          >
            {block.isVisible ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4 text-amber-500" />
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
            title="Xóa khối này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Block Form Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 text-xs">
          {/* Header block editor */}
          {block.type === "header" && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Tiêu đề hồ sơ
                </label>
                <input
                  type="text"
                  placeholder="Gờ Cafe - Cà phê chuẩn gu"
                  value={(block.payload as HeaderBlockPayload).title || ""}
                  onChange={(e) => updatePayload({ title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Tiểu sử / Giới thiệu ngắn (Bio)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả phong cách, giờ mở cửa hoặc câu khẩu hiệu..."
                  value={(block.payload as HeaderBlockPayload).bio || ""}
                  onChange={(e) => updatePayload({ bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Ảnh đại diện (Avatar)
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={(block.payload as HeaderBlockPayload).avatarMediaId || ""}
                    onChange={(e) => {
                      const mId = e.target.value || undefined;
                      const m = availableMedia.find((item) => item.id === mId);
                      updatePayload({
                        avatarMediaId: mId,
                        avatarUrl: m?.publicUrl || undefined,
                      });
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-background cursor-pointer"
                  >
                    <option value="">-- Không sử dụng avatar --</option>
                    {availableMedia.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.originalFilename || m.id}
                      </option>
                    ))}
                  </select>
                  {(block.payload as HeaderBlockPayload).avatarUrl && (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border shrink-0">
                      <Image
                        src={(block.payload as HeaderBlockPayload).avatarUrl!}
                        alt="Avatar"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Heading block editor */}
          {block.type === "heading" && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Nội dung tiêu đề
                </label>
                <input
                  type="text"
                  placeholder="Tiêu đề mục..."
                  value={(block.payload as HeadingBlockPayload).text || ""}
                  onChange={(e) => updatePayload({ text: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary"
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
                      className={`px-3 py-1.5 rounded-lg border cursor-pointer font-bold ${
                        ((block.payload as HeadingBlockPayload).level ?? 2) === lvl
                          ? "border-primary bg-primary/10 text-primary"
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

          {/* Text block editor */}
          {block.type === "text" && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Nội dung văn bản
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập nội dung văn bản..."
                  value={(block.payload as TextBlockPayload).content || ""}
                  onChange={(e) => updatePayload({ content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary"
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
                      className={`px-3 py-1.5 rounded-lg border cursor-pointer capitalize ${
                        ((block.payload as TextBlockPayload).align || "center") === al
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {al}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Image block editor */}
          {block.type === "image" && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Chọn ảnh từ kho lưu trữ
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={(block.payload as ImageBlockPayload).mediaAssetId || ""}
                    onChange={(e) => {
                      const mId = e.target.value || undefined;
                      const m = availableMedia.find((item) => item.id === mId);
                      updatePayload({
                        mediaAssetId: mId,
                        imageUrl: m?.publicUrl || undefined,
                      });
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-background cursor-pointer"
                  >
                    <option value="">-- Chọn ảnh --</option>
                    {availableMedia.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.originalFilename || m.id}
                      </option>
                    ))}
                  </select>
                  {(block.payload as ImageBlockPayload).imageUrl && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0">
                      <Image
                        src={(block.payload as ImageBlockPayload).imageUrl!}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Chú thích ảnh (Caption)
                </label>
                <input
                  type="text"
                  placeholder="VD: Không gian quán tại chi nhánh Quận 1"
                  value={(block.payload as ImageBlockPayload).caption || ""}
                  onChange={(e) => updatePayload({ caption: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Link List block editor */}
          {block.type === "link_list" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="font-semibold text-muted-foreground">Bố cục hiển thị thẻ</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updatePayload({ layout: "stack" })}
                    className={`px-2.5 py-1 rounded-md border cursor-pointer ${
                      ((block.payload as LinkListBlockPayload).layout || "stack") === "stack"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    Xếp chồng (Stack)
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePayload({ layout: "grid" })}
                    className={`px-2.5 py-1 rounded-md border cursor-pointer ${
                      (block.payload as LinkListBlockPayload).layout === "grid"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    Lưới (Grid 2 cột)
                  </button>
                </div>
              </div>

              {/* Placements list */}
              <div className="space-y-2">
                <span className="font-semibold text-muted-foreground block">
                  Các liên kết trong khối này ({block.placements?.length || 0})
                </span>

                {(block.placements || []).length === 0 ? (
                  <div className="p-3 text-center rounded-xl bg-muted/30 border border-dashed border-border text-muted-foreground">
                    Chưa có liên kết nào. Thêm liên kết từ danh mục bên dưới.
                  </div>
                ) : (
                  (block.placements || []).map((pl, pIdx) => (
                    <div
                      key={pl.id}
                      className="p-3 rounded-xl border border-border bg-background space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate flex-1">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            #{pIdx + 1}
                          </span>
                          <span className="font-bold truncate">
                            {pl.labelOverride || pl.defaultLabel}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            ({pl.defaultUrl})
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMovePlacement(pIdx, "up")}
                            disabled={pIdx === 0}
                            className="p-1 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePlacement(pIdx, "down")}
                            disabled={pIdx === (block.placements || []).length - 1}
                            className="p-1 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePlacement(pl.id)}
                            className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Overrides */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40">
                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-0.5">
                            Ghi đè nhãn (tùy chọn)
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
                            className="w-full px-2 py-1 rounded-lg border border-border bg-muted/20 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-0.5">
                            Ghi đè icon (tùy chọn)
                          </label>
                          <select
                            value={pl.mediaOverrideId || ""}
                            onChange={(e) => {
                              const mId = e.target.value || null;
                              const m = availableMedia.find((item) => item.id === mId);
                              handleUpdatePlacement(pl.id, {
                                mediaOverrideId: mId,
                                mediaOverrideUrl: m?.publicUrl || null,
                              });
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-border bg-muted/20 text-xs cursor-pointer"
                          >
                            <option value="">-- Mặc định của link --</option>
                            {availableMedia.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.originalFilename || m.id}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add link picker */}
              <div className="flex items-center gap-2 pt-2">
                <select
                  value={selectedLinkToAdd}
                  onChange={(e) => setSelectedLinkToAdd(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background cursor-pointer"
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
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>
            </div>
          )}

          {/* Social Icons block editor */}
          {block.type === "social_icons" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="font-semibold text-muted-foreground block">
                  Các liên kết mạng xã hội ({block.placements?.length || 0})
                </span>

                {(block.placements || []).map((pl) => (
                  <div
                    key={pl.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-border bg-background"
                  >
                    <span className="font-bold truncate">
                      {pl.labelOverride || pl.defaultLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlacement(pl.id)}
                      className="p-1 rounded-md text-muted-foreground hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add social link picker */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedLinkToAdd}
                  onChange={(e) => setSelectedLinkToAdd(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background cursor-pointer"
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
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>
            </div>
          )}

          {/* Spacer block editor */}
          {block.type === "spacer" && (
            <div>
              <label className="block font-semibold text-muted-foreground mb-1">
                Chiều cao khoảng cách
              </label>
              <div className="flex gap-2">
                {(["sm", "md", "lg", "xl"] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => updatePayload({ height: h })}
                    className={`px-3 py-1.5 rounded-lg border cursor-pointer uppercase ${
                      ((block.payload as SpacerBlockPayload).height || "md") === h
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider block editor */}
          {block.type === "divider" && (
            <div>
              <label className="block font-semibold text-muted-foreground mb-1">
                Kiểu đường kẻ
              </label>
              <div className="flex gap-2">
                {(["solid", "dashed", "dotted"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updatePayload({ style: st })}
                    className={`px-3 py-1.5 rounded-lg border cursor-pointer capitalize ${
                      ((block.payload as DividerBlockPayload).style || "solid") === st
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {st}
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
