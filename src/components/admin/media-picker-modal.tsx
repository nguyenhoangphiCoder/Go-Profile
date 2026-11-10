"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import {
  X,
  UploadCloud,
  Search,
  Check,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Plus,
} from "lucide-react";
import { uploadMediaDirectAction } from "@/features/media/actions";

export interface MediaOption {
  id: string;
  originalFilename: string | null;
  publicUrl: string | null;
}

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  selectedMediaId?: string | null;
  onSelect: (mediaId: string | null, mediaUrl: string | null) => void;
  availableMedia: MediaOption[];
  onMediaAdded?: (newMedia: MediaOption) => void;
  aspectHint?: "circle" | "banner" | "standard";
}

export function MediaPickerModal({
  isOpen,
  onClose,
  title = "Chọn hình ảnh",
  selectedMediaId,
  onSelect,
  availableMedia,
  onMediaAdded,
  aspectHint = "standard",
}: MediaPickerModalProps) {
  const [search, setSearch] = useState("");
  const [currentSelectedId, setCurrentSelectedId] = useState<string | null>(
    selectedMediaId || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  if (!isOpen) return null;

  const filteredMedia = availableMedia.filter((m) =>
    (m.originalFilename || m.id).toLowerCase().includes(search.toLowerCase())
  );

  const selectedMedia = availableMedia.find((m) => m.id === currentSelectedId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadMediaDirectAction(formData);

        if (res.success && res.asset) {
          const newMedia: MediaOption = {
            id: res.asset.id,
            originalFilename: res.asset.originalFilename,
            publicUrl: res.asset.publicUrl,
          };
          onMediaAdded?.(newMedia);
          setCurrentSelectedId(newMedia.id);
          onSelect(newMedia.id, newMedia.publicUrl);
          onClose();
        } else {
          setUploadError(res.error || "Tải ảnh lên thất bại.");
        }
      } catch (err: unknown) {
        console.error("Upload error:", err);
        setUploadError("Có lỗi xảy ra khi tải ảnh lên.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  const handleConfirm = () => {
    if (!currentSelectedId) {
      onSelect(null, null);
    } else {
      const item = availableMedia.find((m) => m.id === currentSelectedId);
      onSelect(item ? item.id : null, item ? item.publicUrl : null);
    }
    onClose();
  };

  const handleClear = () => {
    setCurrentSelectedId(null);
    onSelect(null, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chọn từ kho lưu trữ hoặc tải ảnh mới từ máy tính của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Search */}
        <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên file ảnh..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Upload Button from machine */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-blue-700 shadow-xs shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isUploading ? "Đang tải lên..." : "Tải ảnh từ máy"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Upload error banner */}
        {uploadError && (
          <div className="mx-4 mt-3 p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs">
            {uploadError}
          </div>
        )}

        {/* Media Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredMedia.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-border/80 rounded-2xl bg-muted/10 space-y-3">
              <ImageIcon className="w-10 h-10 text-muted-foreground/60 mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">
                {search ? "Không tìm thấy hình ảnh phù hợp" : "Kho lưu trữ chưa có hình ảnh nào"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {search
                  ? "Vui lòng thử tìm kiếm bằng từ khóa khác hoặc tải ảnh mới từ máy tính."
                  : "Bấm nút 'Tải ảnh từ máy' ở góc trên để tải ảnh từ máy tính vào hệ thống."}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer mt-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Tải ảnh từ máy tính ngay</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredMedia.map((m) => {
                const isSelected = m.id === currentSelectedId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCurrentSelectedId(m.id)}
                    onDoubleClick={() => {
                      setCurrentSelectedId(m.id);
                      onSelect(m.id, m.publicUrl);
                      onClose();
                    }}
                    className={`group relative text-left rounded-2xl border overflow-hidden flex flex-col transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30 shadow-md bg-primary/5"
                        : "border-border/80 hover:border-primary/50 bg-card hover:shadow-xs"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div
                      className={`relative w-full aspect-square bg-muted/20 flex items-center justify-center p-2 overflow-hidden ${
                        aspectHint === "circle" ? "p-3" : ""
                      }`}
                    >
                      {m.publicUrl ? (
                        <div
                          className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
                            aspectHint === "circle" ? "rounded-full" : "rounded-lg"
                          }`}
                        >
                          <Image
                            src={m.publicUrl}
                            alt={m.originalFilename || "Media"}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform"
                            unoptimized
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground/60" />
                      )}

                      {/* Selected badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Filename */}
                    <div className="p-2.5 border-t border-border/50 text-[11px] truncate">
                      <span className="font-medium text-foreground block truncate" title={m.originalFilename || m.id}>
                        {m.originalFilename || m.id}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground w-full sm:w-auto">
            {selectedMedia ? (
              <div className="flex items-center gap-2">
                <span className="text-foreground font-semibold truncate max-w-[200px]">
                  {selectedMedia.originalFilename || "Đã chọn ảnh"}
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 text-[11px] text-destructive hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Bỏ chọn</span>
                </button>
              </div>
            ) : (
              <span>Chưa có ảnh nào được chọn</span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-blue-700 shadow-xs shadow-blue-500/20 transition-colors cursor-pointer"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
