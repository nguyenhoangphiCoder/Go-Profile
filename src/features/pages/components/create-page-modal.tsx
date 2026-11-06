"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Plus, Sparkles } from "lucide-react";
import { createPageAction } from "../actions";

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePageModal({ isOpen, onClose }: CreatePageModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [internalName, setInternalName] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Tự động tạo slug gợi ý khi người dùng gõ internalName (nếu slug chưa bị sửa tay)
  const handleNameChange = (val: string) => {
    setInternalName(val);
    const generated = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createPageAction({
        internalName,
        slug,
        title: title || internalName,
      });

      if (res.success && res.pageId) {
        onClose();
        router.push(`/admin/pages/${res.pageId}`);
      } else {
        setError(res.error || "Không thể tạo trang");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-background p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Tạo trang hồ sơ mới</h2>
              <p className="text-xs text-muted-foreground">
                Tạo trang liên kết profile hoặc landing page cho Gờ Cafe
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Tên nội bộ quản lý <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Menu Cà phê Tháng 11, Trang Tuyển dụng"
              value={internalName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Đường dẫn truy cập (Slug) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center rounded-xl border border-border bg-muted/30 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all overflow-hidden">
              <span className="px-3 text-xs text-muted-foreground select-none">gocafe.vn/</span>
              <input
                type="text"
                required
                placeholder="menu-thang-11"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                className="w-full py-2.5 pr-3 text-sm bg-transparent focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Chỉ dùng chữ thường không dấu, số và gạch nối. Không trùng từ khóa hệ thống.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Tiêu đề hiển thị trên trang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Gờ Cafe - Trọn Vị Tươi Ngon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
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
              disabled={isPending || !internalName.trim() || !slug.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang khởi tạo...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Tạo và mở biên tập
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
