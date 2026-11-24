"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Loader2,
  Plus,
  Sparkles,
  Smartphone,
  LayoutTemplate,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { createPageAction } from "../actions";
import { LANDING_TEMPLATES, type LandingTemplateId } from "../landing-templates";
import type { PageKind } from "../types";

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_KIND_OPTIONS: {
  kind: PageKind;
  title: string;
  badge: string;
  description: string;
  highlights: string[];
  Icon: typeof Smartphone;
}[] = [
  {
    kind: "profile",
    title: "Trang Profile (Bio Link)",
    badge: "Gọn nhẹ • 1 cột",
    description: "Tối ưu cho điện thoại, gắn link bio TikTok, Facebook, Instagram, Shopee & mã QR.",
    highlights: [
      "Khung dọc di động 420–620px",
      "Danh sách nút link & mạng xã hội",
      "Mẫu Gờ Original",
    ],
    Icon: Smartphone,
  },
  {
    kind: "landing",
    title: "Landing Page / Website",
    badge: "Toàn màn hình • Gờ Minimal Luxury",
    description:
      "Trang giới thiệu thương hiệu, nhượng quyền, bảng giá sỉ, hệ thống chi nhánh & thu thập SĐT.",
    highlights: [
      "Bố cục rộng Responsive (Desktop & Mobile)",
      "Font Lexend Deca • Trắng – Đen – Vàng đồng",
      "Khởi tạo sẵn Banner mở đầu (Hero)",
    ],
    Icon: LayoutTemplate,
  },
];

export function CreatePageModal({ isOpen, onClose }: CreatePageModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);
  const [pageKind, setPageKind] = useState<PageKind>("profile");
  const [templateId, setTemplateId] = useState<LandingTemplateId>("brand-home");
  const [internalName, setInternalName] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setError(null);
    onClose();
  };

  // Tự động tạo slug gợi ý khi người dùng gõ internalName
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
        pageKind,
        templateId: pageKind === "landing" ? templateId : undefined,
      });

      if (res.success && res.pageId) {
        handleClose();
        router.push(`/admin/pages/${res.pageId}`);
      } else {
        setError(res.error || "Không thể tạo trang");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-background p-6 md:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Tạo trang mới</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Bước {step}/2
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {step === 1
                  ? "Chọn loại trang phù hợp với mục đích sử dụng"
                  : pageKind === "landing"
                    ? "Thiết lập thông tin cho Landing Page (Mẫu Gờ Minimal Luxury)"
                    : "Thiết lập thông tin cho Trang Profile (Bio Link)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
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

        {/* Step 1: Chọn loại trang */}
        {step === 1 ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PAGE_KIND_OPTIONS.map((opt) => {
                const selected = pageKind === opt.kind;
                const Icon = opt.Icon;
                return (
                  <button
                    key={opt.kind}
                    type="button"
                    onClick={() => setPageKind(opt.kind)}
                    className={`relative flex flex-col text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border hover:border-foreground/30 bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {selected && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-foreground">{opt.title}</div>
                    <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mt-0.5">
                      {opt.badge}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {opt.description}
                    </p>
                    <ul className="mt-3 pt-3 border-t border-border/60 space-y-1 text-[11px] text-muted-foreground">
                      {opt.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-foreground/40 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <Link
                href="/admin/pages/new"
                onClick={handleClose}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mở Studio cấu hình nhanh</span>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-border hover:bg-muted transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Chọn Mẫu dựng sẵn (với Landing) + Nhập thông tin trang */
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border/60 text-xs">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                {pageKind === "landing" ? (
                  <LayoutTemplate className="w-4 h-4 text-amber-600" />
                ) : (
                  <Smartphone className="w-4 h-4 text-primary" />
                )}
                <span>
                  Loại trang:{" "}
                  {pageKind === "landing" ? "Landing Page / Website" : "Trang Profile (Bio Link)"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              >
                Đổi loại
              </button>
            </div>

            {pageKind === "landing" && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-muted-foreground">
                  Chọn mẫu dựng sẵn (Template)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LANDING_TEMPLATES.map((tpl) => {
                    const selected = templateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setTemplateId(tpl.id);
                          if (!internalName.trim()) {
                            setInternalName(tpl.name);
                            setSlug(tpl.suggestedSlug);
                            setTitle(tpl.name);
                          }
                        }}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          selected
                            ? "border-primary bg-primary/5 shadow-2xs"
                            : "border-border hover:border-foreground/30 bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground truncate">
                            {tpl.name}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
                            {tpl.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                          {tpl.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Tên nội bộ quản lý <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder={
                  pageKind === "landing"
                    ? "VD: Trang chủ Gờ Café, Nhượng quyền, Xưởng rang"
                    : "VD: Bio TikTok Gờ Café, Menu Tháng 11"
                }
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
                  placeholder={pageKind === "landing" ? "nhuong-quyen" : "gocafe-official"}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                  className="w-full py-2.5 pr-3 text-sm bg-transparent focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Chỉ dùng chữ thường không dấu, số và gạch nối (-). Không trùng từ khóa hệ thống.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Tiêu đề hiển thị trên trang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={
                  pageKind === "landing"
                    ? "VD: Gờ Café — Cà phê nguyên chất chuẩn gu mỗi ngày"
                    : "VD: Gờ Café Official"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-border hover:bg-muted transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending || !internalName.trim() || !slug.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shadow-xs"
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
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
