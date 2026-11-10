"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  UploadCloud,
  ImageIcon,
  FolderOpen,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { MediaOption } from "./media-picker-modal";
import { uploadMediaDirectAction } from "@/features/media/actions";

const MediaPickerModal = dynamic(
  () => import("./media-picker-modal").then((m) => m.MediaPickerModal),
  { ssr: false }
);

export interface MediaPickerFieldProps {
  label: string;
  mediaId?: string | null;
  mediaUrl?: string | null;
  onChange: (mediaId: string | null, mediaUrl: string | null) => void;
  availableMedia: MediaOption[];
  onMediaAdded?: (newMedia: MediaOption) => void;
  aspectHint?: "circle" | "banner" | "standard";
  helpText?: string;
  className?: string;
}

export function MediaPickerField({
  label,
  mediaId,
  mediaUrl,
  onChange,
  availableMedia,
  onMediaAdded,
  aspectHint = "standard",
  helpText,
  className = "",
}: MediaPickerFieldProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  // Find media info from availableMedia if mediaUrl is missing
  const matchedMedia = mediaId
    ? availableMedia.find((m) => m.id === mediaId)
    : null;
  const effectiveUrl = mediaUrl || matchedMedia?.publicUrl || null;
  const filename = matchedMedia?.originalFilename || (mediaId ? "Hình ảnh đã chọn" : null);

  const handleDirectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
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
          onChange(newMedia.id, newMedia.publicUrl);
        } else {
          alert(res.error || "Tải ảnh lên thất bại.");
        }
      } catch (err) {
        console.error("Direct upload error:", err);
        alert("Có lỗi xảy ra khi tải ảnh lên.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label & Help text */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-foreground">
          {label}
        </label>
        {helpText && (
          <span className="text-[11px] text-muted-foreground">{helpText}</span>
        )}
      </div>

      {/* Main Container Card */}
      <div className="p-2.5 rounded-2xl border border-input bg-card/60 shadow-2xs hover:border-primary/40 transition-colors">
        {effectiveUrl ? (
          /* State 1: Image is selected */
          <div className="flex items-center gap-3">
            {/* Thumbnail Preview */}
            <div
              className={`relative shrink-0 overflow-hidden border border-border/80 bg-muted/40 shadow-xs ${
                aspectHint === "circle"
                  ? "w-12 h-12 rounded-full"
                  : aspectHint === "banner"
                  ? "w-20 h-12 rounded-xl"
                  : "w-14 h-14 rounded-xl"
              }`}
            >
              <Image
                src={effectiveUrl}
                alt={label}
                fill
                className="object-cover"
                unoptimized
                loading="lazy"
              />
            </div>

            {/* Info & Action Buttons */}
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-xs font-semibold text-foreground block truncate" title={filename || ""}>
                {filename || "Ảnh đã được tải lên"}
              </span>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-[11px] font-medium transition-colors cursor-pointer text-foreground"
                >
                  <RefreshCw className="w-3 h-3 text-muted-foreground" />
                  <span>Đổi ảnh</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-[11px] font-medium transition-colors cursor-pointer text-foreground disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span>{isUploading ? "Tải lên..." : "Tải ảnh từ máy"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer ml-auto"
                  title="Gỡ ảnh này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* State 2: No image selected */
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 py-1">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <div className="w-9 h-9 rounded-xl border border-dashed border-border flex items-center justify-center shrink-0 bg-muted/20">
                <ImageIcon className="w-4 h-4 opacity-50" />
              </div>
              <span className="text-xs">Chưa sử dụng hình ảnh</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shadow-2xs"
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Thư viện media</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                <span>{isUploading ? "Đang tải..." : "Tải từ máy"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Hidden machine upload file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={handleDirectUpload}
          className="hidden"
        />
      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <MediaPickerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Chọn ${label.toLowerCase()}`}
          selectedMediaId={mediaId}
          onSelect={onChange}
          availableMedia={availableMedia}
          onMediaAdded={onMediaAdded}
          aspectHint={aspectHint}
        />
      )}
    </div>
  );
}
