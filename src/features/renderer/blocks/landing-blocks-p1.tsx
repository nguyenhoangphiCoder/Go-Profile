"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Quote, ArrowUpRight } from "lucide-react";
import type {
  BannerSliderBlockPayload,
  CtaBannerBlockPayload,
  TestimonialsBlockPayload,
} from "@/features/pages/types";
import { resolveMediaUrl } from "../media";
import type { BlockRenderProps } from "../types";

function isSafeHref(url?: string | null): boolean {
  if (!url) return false;
  const u = url.trim();
  return (
    u.startsWith("/") ||
    u.startsWith("#") ||
    /^https?:\/\//i.test(u) ||
    /^tel:/i.test(u) ||
    /^mailto:/i.test(u)
  );
}

/** 1. Banner Slider / Carousel nhiều ảnh */
export function BannerSliderBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as BannerSliderBlockPayload;
  const slides = (p.slides || []).filter((s) => Boolean(s.imageUrl || s.title));
  const autoPlaySec = typeof p.autoPlaySec === "number" ? p.autoPlaySec : 5;
  const [active, setActive] = useState(0);
  const isPublic = ctx.mode === "public";

  const safeIdx = slides.length > 0 ? active % slides.length : 0;

  useEffect(() => {
    if (!isPublic || autoPlaySec <= 0 || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, autoPlaySec * 1000);
    return () => window.clearInterval(id);
  }, [isPublic, autoPlaySec, slides.length]);

  if (slides.length === 0) {
    if (ctx.mode === "preview") {
      return (
        <div className="p-8 rounded-3xl border border-dashed text-center text-xs opacity-60">
          Banner Slider: chưa có ảnh slide nào. Thêm ảnh ở cột bên trái.
        </div>
      );
    }
    return null;
  }

  const current = slides[safeIdx];
  const imgSrc = resolveMediaUrl(current.imageUrl);
  const hasHref = isPublic && isSafeHref(current.ctaHref);

  return (
    <section
      id={p.anchorId || undefined}
      className="relative w-full overflow-hidden rounded-3xl bg-[#111111] text-white scroll-mt-24 select-none"
    >
      <div className="relative w-full aspect-[16/9] @min-[48rem]:aspect-[21/9] min-h-[260px]">
        {imgSrc && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imgSrc}
            alt={current.title || `Slide ${safeIdx + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/15" />

        {(current.title || current.subtitle || current.ctaLabel) && (
          <div className="absolute inset-0 flex flex-col justify-end p-6 @min-[48rem]:p-12 text-left max-w-2xl space-y-2.5">
            {current.title && (
              <h2
                className="text-xl @min-[48rem]:text-4xl font-bold leading-tight tracking-tight text-white"
                style={{ fontFamily: "var(--gp-font-heading)" }}
              >
                {current.title}
              </h2>
            )}
            {current.subtitle && (
              <p className="text-xs @min-[48rem]:text-base text-white/85 leading-relaxed">
                {current.subtitle}
              </p>
            )}
            {current.ctaLabel && (
              <div className="pt-1">
                <a
                  href={hasHref ? current.ctaHref : undefined}
                  onClick={isPublic ? undefined : (e) => e.preventDefault()}
                  className="inline-flex items-center gap-1.5 px-5 h-10 rounded-xl bg-white text-[#111111] text-xs @min-[48rem]:text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <span>{current.ctaLabel}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((prev) => (prev - 1 + slides.length) % slides.length)}
              aria-label="Slide trước"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActive((prev) => (prev + 1) % slides.length)}
              aria-label="Slide tiếp theo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-3.5 right-5 flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActive(idx)}
                  aria-label={`Chọn slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === safeIdx ? "w-6 bg-[#B88A44]" : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** 2. Đánh giá khách hàng / Đối tác (Testimonials) */
export function TestimonialsBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as TestimonialsBlockPayload;
  const items = p.items || [];
  const cols = p.columns === 2 ? "@min-[48rem]:grid-cols-2" : "@min-[48rem]:grid-cols-3";

  if (items.length === 0) {
    if (ctx.mode === "preview") {
      return (
        <div className="p-6 rounded-2xl border border-dashed text-center text-xs opacity-60">
          Đánh giá khách hàng: chưa có nhận xét nào.
        </div>
      );
    }
    return null;
  }

  return (
    <section
      id={p.anchorId || undefined}
      className="py-6 @min-[48rem]:py-10 space-y-6 scroll-mt-24"
    >
      {(p.title?.trim() || p.subtitle?.trim()) && (
        <div className="text-center max-w-2xl mx-auto space-y-2">
          {p.title?.trim() && (
            <h2
              className="text-2xl @min-[48rem]:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--gp-font-heading)", color: "var(--gp-heading-color)" }}
            >
              {p.title}
            </h2>
          )}
          {p.subtitle?.trim() && <p className="text-sm opacity-75">{p.subtitle}</p>}
        </div>
      )}

      <div className={`grid grid-cols-1 ${cols} gap-5`}>
        {items.map((item, idx) => {
          const stars = Math.min(5, Math.max(1, item.rating ?? 5));
          const avatarSrc = resolveMediaUrl(item.avatarUrl);
          return (
            <article
              key={idx}
              className="p-6 rounded-2xl border flex flex-col justify-between gap-4 text-left"
              style={{
                backgroundColor: "#FFFFFF",
                borderColor: "var(--gp-surface-border)",
                color: "#111111",
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5 text-[#B88A44]">
                    {Array.from({ length: stars }).map((_, sIdx) => (
                      <Star key={sIdx} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 opacity-20" />
                </div>
                <p className="text-sm leading-relaxed text-zinc-700">&ldquo;{item.quote}&rdquo;</p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-zinc-100">
                {avatarSrc ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatarSrc}
                    alt={item.author}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#111111] text-[#B88A44] font-bold text-sm flex items-center justify-center shrink-0">
                    {(item.author || "G").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#111111] truncate">{item.author}</div>
                  {item.role?.trim() && (
                    <div className="text-xs text-zinc-500 truncate">{item.role}</div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** 3. Dải Kêu gọi hành động nổi bật (CTA Banner) */
export function CtaBannerBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as CtaBannerBlockPayload;
  const tone = p.tone || "dark";
  const isPublic = ctx.mode === "public";

  const styles =
    tone === "gold"
      ? {
          bg: "#B88A44",
          text: "#FFFFFF",
          btnBg: "#111111",
          btnText: "#FFFFFF",
          secBorder: "rgba(255,255,255,0.55)",
        }
      : tone === "cream"
        ? {
            bg: "#F8F7F4",
            text: "#111111",
            btnBg: "#111111",
            btnText: "#FFFFFF",
            secBorder: "rgba(17,17,17,0.22)",
          }
        : {
            bg: "#111111",
            text: "#FFFFFF",
            btnBg: "#B88A44",
            btnText: "#FFFFFF",
            secBorder: "rgba(255,255,255,0.4)",
          };

  return (
    <section
      id={p.anchorId || undefined}
      className="w-full rounded-3xl px-6 py-10 @min-[48rem]:px-12 @min-[48rem]:py-14 text-center space-y-4 scroll-mt-24"
      style={{ backgroundColor: styles.bg, color: styles.text }}
    >
      {p.eyebrow?.trim() && (
        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-85">{p.eyebrow}</p>
      )}
      <h2
        className="text-2xl @min-[48rem]:text-4xl font-bold tracking-tight max-w-3xl mx-auto"
        style={{ fontFamily: "var(--gp-font-heading)" }}
      >
        {p.title?.trim() || "Sẵn sàng đồng hành cùng Gờ Café?"}
      </h2>
      {p.subtitle?.trim() && (
        <p className="text-sm @min-[48rem]:text-base opacity-85 max-w-2xl mx-auto leading-relaxed">
          {p.subtitle}
        </p>
      )}

      {(p.primaryCtaLabel?.trim() || p.secondaryCtaLabel?.trim()) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {p.primaryCtaLabel?.trim() && (
            <a
              href={isPublic && isSafeHref(p.primaryCtaHref) ? p.primaryCtaHref : undefined}
              onClick={isPublic ? undefined : (e) => e.preventDefault()}
              className="inline-flex items-center gap-1.5 px-6 h-12 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: styles.btnBg, color: styles.btnText }}
            >
              <span>{p.primaryCtaLabel}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          )}
          {p.secondaryCtaLabel?.trim() && (
            <a
              href={isPublic && isSafeHref(p.secondaryCtaHref) ? p.secondaryCtaHref : undefined}
              onClick={isPublic ? undefined : (e) => e.preventDefault()}
              className="inline-flex items-center justify-center px-6 h-12 rounded-xl text-sm font-semibold border transition-opacity hover:opacity-80"
              style={{ borderColor: styles.secBorder, color: styles.text }}
            >
              {p.secondaryCtaLabel}
            </a>
          )}
        </div>
      )}
    </section>
  );
}
