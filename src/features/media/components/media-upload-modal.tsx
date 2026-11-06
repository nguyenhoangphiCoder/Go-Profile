"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { X, UploadCloud, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadMediaAction } from "@/features/media/actions";
import type { MediaUploadState } from "@/features/media/types";

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialState: MediaUploadState = {};

export function MediaUploadModal({ isOpen, onClose }: MediaUploadModalProps) {
  const [state, formAction, isPending] = useActionState(uploadMediaAction, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-border bg-background p-6 md:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h2 className="text-lg font-bold">Tải ảnh mới</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hỗ trợ PNG, JPEG, WebP, GIF, SVG (tối đa 5MB)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {state.error && (
          <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
            {state.error}
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-foreground/40 hover:bg-muted/20 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3"
          >
            {preview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-muted/40 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold block text-foreground">
                    Bấm để chọn ảnh từ máy tính
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Avatar, icon liên kết hoặc ảnh bìa
                  </span>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Public Storage CDN</span>
            </span>
            <span>Tối đa: 5MB</span>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending || !preview}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isPending ? "Đang tải lên..." : "Tải lên"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
