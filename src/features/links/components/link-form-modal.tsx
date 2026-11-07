"use client";

import { useActionState, useEffect, useState } from "react";
import { X, Globe, Phone, Mail, AlertTriangle, Loader2 } from "lucide-react";
import { upsertLinkAction } from "@/features/links/actions";
import type { LinkItem, LinkKind, LinkActionState } from "@/features/links/types";

interface LinkFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  link?: LinkItem | null;
}

const initialState: LinkActionState = {};

export function LinkFormModal({ isOpen, onClose, link }: LinkFormModalProps) {
  const [state, formAction, isPending] = useActionState(upsertLinkAction, initialState);
  const [kind, setKind] = useState<LinkKind>(link?.kind || "http");

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-background p-6 md:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h2 className="text-lg font-bold">
              {link ? "Chỉnh sửa liên kết" : "Thêm liên kết mới"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kho liên kết dùng chung cho tất cả các trang hồ sơ Gờ Cafe
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if editing link used by pages */}
        {link && link.usageCount > 0 && (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Cảnh báo cập nhật tập trung:</span>
              Liên kết này hiện đang được hiển thị trên <strong>{link.usageCount} trang</strong> (
              {link.affectedPages?.map((p) => p.internalName).join(", ")}). Việc thay đổi URL đích
              sẽ có hiệu lực ngay lập tức trên tất cả các trang này mà không cần xuất bản lại.
            </div>
          </div>
        )}

        {/* General Error */}
        {state.error && (
          <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
            {state.error}
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
          {link && <input type="hidden" name="id" value={link.id} />}
          {link && <input type="hidden" name="lockVersion" value={link.lockVersion} />}

          {/* Kind Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">Loại liên kết</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setKind("http")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  kind === "http"
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-background text-muted-foreground hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website</span>
              </button>
              <button
                type="button"
                onClick={() => setKind("tel")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  kind === "tel"
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-background text-muted-foreground hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Hotline (tel)</span>
              </button>
              <button
                type="button"
                onClick={() => setKind("mailto")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  kind === "mailto"
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-background text-muted-foreground hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email (mailto)</span>
              </button>
            </div>
            <input type="hidden" name="kind" value={kind} />
          </div>

          {/* Label */}
          <div className="space-y-1.5">
            <label htmlFor="defaultLabel" className="block text-xs font-semibold text-foreground">
              Tên / Nhãn hiển thị mặc định
            </label>
            <input
              id="defaultLabel"
              name="defaultLabel"
              type="text"
              required
              defaultValue={link?.defaultLabel || ""}
              placeholder="ví dụ: Đặt món qua ShopeeFood"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {state.fieldErrors?.defaultLabel && (
              <p className="text-[11px] text-red-500">{state.fieldErrors.defaultLabel[0]}</p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <label htmlFor="targetUrl" className="block text-xs font-semibold text-foreground">
              Địa chỉ đích (URL)
            </label>
            <input
              id="targetUrl"
              name="targetUrl"
              type="text"
              required
              defaultValue={link?.targetUrl || ""}
              placeholder={
                kind === "http"
                  ? "https://shopeefood.vn/..."
                  : kind === "tel"
                    ? "tel:1900123456"
                    : "mailto:cskh@gocafe.vn"
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {state.fieldErrors?.targetUrl && (
              <p className="text-[11px] text-red-500">{state.fieldErrors.targetUrl[0]}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-xs font-semibold text-foreground">
              Ghi chú nội bộ (tùy chọn)
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={link?.description || ""}
              placeholder="Mô tả chiến dịch hoặc mục đích của liên kết này..."
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
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
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-blue-700 shadow-xs shadow-blue-500/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{link ? "Lưu thay đổi" : "Tạo liên kết"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
