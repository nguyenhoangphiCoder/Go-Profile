"use client";

import { useState, useTransition } from "react";
import { X, Loader2, ArrowRight, LinkIcon } from "lucide-react";
import { renameSlugAction } from "../actions";

interface RenameSlugModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  currentSlug: string;
  expectedPageVersion: number;
  aliases: string[];
}

export function RenameSlugModal({
  isOpen,
  onClose,
  pageId,
  currentSlug,
  expectedPageVersion,
  aliases,
}: RenameSlugModalProps) {
  const [newSlug, setNewSlug] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newSlug.trim() === currentSlug) {
      setError("Slug mới không được trùng với slug hiện tại");
      return;
    }

    startTransition(async () => {
      const res = await renameSlugAction(pageId, newSlug.trim(), expectedPageVersion);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Không thể đổi đường dẫn");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-border bg-background p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Đổi đường dẫn chính (Slug)</h2>
              <p className="text-xs text-muted-foreground">
                Tự động tạo redirect từ các slug cũ sang slug mới
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
            {error}
          </div>
        )}

        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Slug hiện tại:</span>
            <span className="font-mono font-semibold text-primary">{currentSlug}</span>
          </div>
          {aliases.length > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <span className="text-muted-foreground">Các alias trước đây:</span>
              <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[200px]">
                {aliases.join(", ")}
              </span>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
            💡 Khi đổi slug, đường dẫn cũ <code>/{currentSlug}</code> sẽ tự động chuyển hướng
            (redirect 308) về slug mới, đảm bảo các mã QR đã in không bị gãy.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Đường dẫn mới <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center rounded-xl border border-border bg-muted/30 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all overflow-hidden">
              <span className="px-3 text-xs text-muted-foreground select-none">gocafe.vn/</span>
              <input
                type="text"
                required
                placeholder="slug-moi-thay-the"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().trim())}
                className="w-full py-2.5 pr-3 text-sm bg-transparent focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 text-xs font-medium rounded-xl border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending || !newSlug.trim() || newSlug === currentSlug}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <ArrowRight className="w-3.5 h-3.5" />
                  Xác nhận đổi slug
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
