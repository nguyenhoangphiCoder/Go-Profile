"use client";

import { useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type {
  InfoCardsBlockPayload,
  PricingTableBlockPayload,
  ProductGridBlockPayload,
  SplitContentBlockPayload,
  StatsStripBlockPayload,
  TocBarBlockPayload,
} from "@/features/pages/types";
import { sanitizeRichTextHtml } from "@/lib/rich-text";
import { resolveMediaUrl } from "../media";
import type { BlockRenderProps } from "../types";

function isSafeHref(url?: string | null): boolean {
  if (!url) return false;
  const u = url.trim();
  return u.startsWith("/") || u.startsWith("#") || /^https?:\/\//i.test(u) || /^tel:/i.test(u);
}

/** 1. Thanh mục lục nhảy mục (TOC Bar) */
export function TocBarBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as TocBarBlockPayload;
  const items = (p.items || []).filter((it) => it.label?.trim());
  if (items.length === 0) return null;

  const isSticky = p.sticky !== false && ctx.mode === "public";

  return (
    <nav
      aria-label={p.title || "Mục lục nội dung"}
      className={`${
        isSticky ? "sticky top-16 z-30" : ""
      } w-full py-3 px-4 rounded-2xl border backdrop-blur-md`}
      style={{
        backgroundColor: "color-mix(in srgb, var(--gp-bg) 92%, transparent)",
        borderColor: "var(--gp-surface-border)",
      }}
    >
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {p.title?.trim() && (
          <span
            className="text-[11px] font-bold uppercase tracking-[0.15em] shrink-0 pr-2 border-r"
            style={{ color: "var(--gp-accent)", borderColor: "var(--gp-surface-border)" }}
          >
            {p.title}
          </span>
        )}
        {items.map((item, idx) => {
          const cleanAnchor = (item.anchorId || "").replace(/^#/, "").trim();
          return (
            <a
              key={idx}
              href={ctx.mode === "public" && cleanAnchor ? `#${cleanAnchor}` : undefined}
              onClick={ctx.mode === "public" ? undefined : (e) => e.preventDefault()}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:opacity-80"
              style={{
                borderColor: "var(--gp-surface-border)",
                color: "var(--gp-text)",
              }}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

/** 2. Dải chỉ số uy tín (Stats Strip) */
export function StatsStripBlock({ block }: BlockRenderProps) {
  const p = block.payload as StatsStripBlockPayload;
  const items = (p.items || []).filter((it) => it.value?.trim() || it.label?.trim());
  if (items.length === 0) return null;

  const colsClass =
    p.columns === 4
      ? "grid-cols-2 @min-[48rem]:grid-cols-4"
      : "grid-cols-1 @min-[36rem]:grid-cols-3";

  return (
    <section
      id={p.anchorId || undefined}
      className={`grid ${colsClass} gap-4 @min-[48rem]:gap-6 py-4 scroll-mt-24`}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className="p-6 rounded-2xl border text-center space-y-1.5"
          style={{
            backgroundColor: "#F8F7F4",
            borderColor: "var(--gp-surface-border)",
          }}
        >
          <div
            className="text-3xl @min-[48rem]:text-4xl font-bold tracking-tight"
            style={{ color: "var(--gp-accent)", fontFamily: "var(--gp-font-heading)" }}
          >
            {item.value}
          </div>
          <div className="text-sm font-semibold" style={{ color: "var(--gp-heading-color)" }}>
            {item.label}
          </div>
          {item.sublabel?.trim() && (
            <div className="text-xs opacity-70 leading-relaxed">{item.sublabel}</div>
          )}
        </div>
      ))}
    </section>
  );
}

/** 3. Khối 2 cột Ảnh – Chữ (Split Content) */
export function SplitContentBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as SplitContentBlockPayload;
  const imgSrc = resolveMediaUrl(p.imageUrl);
  const imageRight = p.imagePosition === "right";
  const isPublic = ctx.mode === "public";
  const safeHtml = p.content ? sanitizeRichTextHtml(p.content) : "";

  const textCol = (
    <div className="@min-[48rem]:col-span-6 space-y-4 text-left">
      {p.eyebrow?.trim() && (
        <p
          className="text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--gp-accent)" }}
        >
          {p.eyebrow}
        </p>
      )}
      {p.title?.trim() && (
        <h2
          className="text-2xl @min-[48rem]:text-3xl font-bold leading-snug tracking-tight"
          style={{ fontFamily: "var(--gp-font-heading)", color: "var(--gp-heading-color)" }}
        >
          {p.title}
        </h2>
      )}
      {safeHtml && (
        <div
          className="text-sm @min-[48rem]:text-base opacity-85 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      )}
      {p.ctaLabel?.trim() && (
        <div className="pt-2">
          <a
            href={isPublic && isSafeHref(p.ctaHref) ? p.ctaHref : undefined}
            onClick={isPublic ? undefined : (e) => e.preventDefault()}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--gp-surface)",
              color: "var(--gp-surface-text)",
            }}
          >
            <span>{p.ctaLabel}</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );

  const isPngCutout = Boolean(imgSrc && /\.png(?:\?|$)/i.test(imgSrc));
  const mediaCol = imgSrc ? (
    <div className="@min-[48rem]:col-span-6 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={p.title || "Hình ảnh minh họa"}
        className={
          isPngCutout
            ? "w-full max-w-[420px] max-h-[420px] object-contain mx-auto drop-shadow-md"
            : "w-full aspect-[4/3] object-cover rounded-3xl border shadow-xs"
        }
        style={isPngCutout ? undefined : { borderColor: "var(--gp-surface-border)" }}
      />
    </div>
  ) : null;

  return (
    <section
      id={p.anchorId || undefined}
      className="py-6 @min-[48rem]:py-10 grid grid-cols-1 @min-[48rem]:grid-cols-12 gap-8 @min-[48rem]:gap-12 items-center scroll-mt-24"
    >
      {imageRight ? (
        <>
          {textCol}
          {mediaCol}
        </>
      ) : (
        <>
          {mediaCol}
          {textCol}
        </>
      )}
    </section>
  );
}

/** 4. Thẻ thông số / Quy trình (Info Cards) */
export function InfoCardsBlock({ block }: BlockRenderProps) {
  const p = block.payload as InfoCardsBlockPayload;
  const items = (p.items || []).filter((it) => it.title?.trim() || it.description?.trim());
  const variant = p.variant || "card";
  const cols = p.columns || 3;

  const colsClass =
    cols === 2
      ? "grid-cols-1 @min-[40rem]:grid-cols-2"
      : cols === 4
        ? "grid-cols-1 @min-[40rem]:grid-cols-2 @min-[60rem]:grid-cols-4"
        : "grid-cols-1 @min-[48rem]:grid-cols-3";

  return (
    <section
      id={p.anchorId || undefined}
      className="py-6 @min-[48rem]:py-10 space-y-6 scroll-mt-24"
    >
      {(p.title?.trim() || p.subtitle?.trim()) && (
        <div className="max-w-2xl space-y-2 text-left">
          {p.title?.trim() && (
            <h2
              className="text-2xl @min-[48rem]:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--gp-font-heading)", color: "var(--gp-heading-color)" }}
            >
              {p.title}
            </h2>
          )}
          {p.subtitle?.trim() && (
            <p className="text-sm @min-[48rem]:text-base opacity-75 leading-relaxed">
              {p.subtitle}
            </p>
          )}
        </div>
      )}

      <div className={`grid ${colsClass} gap-4 @min-[48rem]:gap-5`}>
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl border space-y-2.5 text-left transition-colors"
            style={{
              backgroundColor: variant === "steps" ? "#FFFFFF" : "#F8F7F4",
              borderColor: "var(--gp-surface-border)",
            }}
          >
            {variant === "steps" ? (
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: "var(--gp-surface)",
                  color: "var(--gp-surface-text)",
                }}
              >
                {item.badge?.trim() || String(idx + 1).padStart(2, "0")}
              </span>
            ) : (
              item.badge?.trim() && (
                <span
                  className="inline-block text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: "var(--gp-accent)" }}
                >
                  {item.badge}
                </span>
              )
            )}
            <h3
              className="text-base font-bold leading-snug"
              style={{ fontFamily: "var(--gp-font-heading)", color: "var(--gp-heading-color)" }}
            >
              {item.title}
            </h3>
            {item.description?.trim() && (
              <p className="text-sm opacity-80 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/** 5. Bảng báo giá đa cột (Pricing Table — VD: 20KG | 10KG | 5KG) */
export function PricingTableBlock({ block }: BlockRenderProps) {
  const p = block.payload as PricingTableBlockPayload;
  const columns = (p.columns || []).filter((c) => c.trim());
  const rows = (p.rows || []).filter((r) => r.name?.trim());
  if (rows.length === 0) return null;

  return (
    <section
      id={p.anchorId || undefined}
      className="py-6 @min-[48rem]:py-10 space-y-5 scroll-mt-24"
    >
      {(p.title?.trim() || p.effectiveNote?.trim()) && (
        <div className="flex flex-col @min-[48rem]:flex-row @min-[48rem]:items-end justify-between gap-2 text-left">
          {p.title?.trim() && (
            <h2
              className="text-2xl @min-[48rem]:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--gp-font-heading)", color: "var(--gp-heading-color)" }}
            >
              {p.title}
            </h2>
          )}
          {p.effectiveNote?.trim() && (
            <span className="text-xs font-medium opacity-70">{p.effectiveNote}</span>
          )}
        </div>
      )}

      <div
        className="rounded-2xl border overflow-hidden shadow-2xs"
        style={{ borderColor: "var(--gp-surface-border)", backgroundColor: "#FFFFFF" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[540px]">
            <thead>
              <tr
                className="border-b text-xs uppercase tracking-wider"
                style={{
                  backgroundColor: "#111111",
                  color: "#FFFFFF",
                  borderColor: "var(--gp-surface-border)",
                }}
              >
                <th className="py-4 px-5 font-semibold">Sản phẩm / Quy cách</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="py-4 px-4 text-right font-semibold whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--gp-surface-border)" }}>
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    backgroundColor: row.highlight ? "#FBF8F1" : "#FFFFFF",
                  }}
                >
                  <td className="py-4 px-5 align-top">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--gp-heading-color)" }}
                      >
                        {row.name}
                      </span>
                      {row.highlight && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: "rgba(184, 138, 68, 0.16)",
                            color: "var(--gp-accent)",
                          }}
                        >
                          <Sparkles className="w-3 h-3" />
                          Bán chạy
                        </span>
                      )}
                    </div>
                    {row.subtitle?.trim() && (
                      <div className="text-xs font-medium opacity-75 mt-0.5">{row.subtitle}</div>
                    )}
                    {row.description?.trim() && (
                      <div className="text-xs opacity-65 mt-1 leading-relaxed">
                        {row.description}
                      </div>
                    )}
                  </td>
                  {columns.map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-4 px-4 text-right align-middle whitespace-nowrap font-bold text-sm tabular-nums"
                      style={{
                        color: row.highlight ? "var(--gp-accent)" : "var(--gp-heading-color)",
                      }}
                    >
                      {row.prices?.[cIdx] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] opacity-55 @min-[48rem]:hidden text-right">
        ← Vuốt ngang để xem đầy đủ các mức giá →
      </p>
    </section>
  );
}

/** 6. Lưới sản phẩm / Menu có lọc nhóm (Product Grid) */
export function ProductGridBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as ProductGridBlockPayload;
  const items = (p.items || []).filter((it) => it.name?.trim());
  const categories = (p.categories || []).filter((c) => c.trim());
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const isPublic = ctx.mode === "public";

  if (items.length === 0) return null;

  const visibleItems =
    selectedCat === "all"
      ? items
      : items.filter((it) => (it.category || "").trim() === selectedCat);

  return (
    <section
      id={p.anchorId || undefined}
      className="py-6 @min-[48rem]:py-10 space-y-6 scroll-mt-24"
    >
      <div className="flex flex-col @min-[48rem]:flex-row @min-[48rem]:items-end justify-between gap-4">
        {(p.title?.trim() || p.subtitle?.trim()) && (
          <div className="space-y-1.5 text-left">
            {p.title?.trim() && (
              <h2
                className="text-2xl @min-[48rem]:text-3xl font-bold tracking-tight"
                style={{ fontFamily: "var(--gp-font-heading)", color: "var(--gp-heading-color)" }}
              >
                {p.title}
              </h2>
            )}
            {p.subtitle?.trim() && (
              <p className="text-sm opacity-75 leading-relaxed">{p.subtitle}</p>
            )}
          </div>
        )}

        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCat("all")}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer"
              style={
                selectedCat === "all"
                  ? {
                      backgroundColor: "var(--gp-surface)",
                      color: "var(--gp-surface-text)",
                      borderColor: "var(--gp-surface)",
                    }
                  : {
                      backgroundColor: "transparent",
                      color: "var(--gp-text)",
                      borderColor: "var(--gp-surface-border)",
                    }
              }
            >
              Tất cả
            </button>
            {categories.map((cat) => {
              const active = selectedCat === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer"
                  style={
                    active
                      ? {
                          backgroundColor: "var(--gp-surface)",
                          color: "var(--gp-surface-text)",
                          borderColor: "var(--gp-surface)",
                        }
                      : {
                          backgroundColor: "transparent",
                          color: "var(--gp-text)",
                          borderColor: "var(--gp-surface-border)",
                        }
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 @min-[36rem]:grid-cols-2 @min-[60rem]:grid-cols-3 gap-5">
        {visibleItems.map((item, idx) => {
          const imgSrc = resolveMediaUrl(item.imageUrl);
          return (
            <div
              key={idx}
              className="rounded-2xl border overflow-hidden flex flex-col text-left transition-shadow hover:shadow-md"
              style={{
                backgroundColor: "#FFFFFF",
                borderColor: "var(--gp-surface-border)",
              }}
            >
              {imgSrc && (
                <div className="relative aspect-square bg-[#F8F7F4] overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgSrc}
                    alt={item.name}
                    className={
                      /\.png(?:\?|$)/i.test(imgSrc)
                        ? "w-full h-full object-contain p-2"
                        : "w-full h-full object-cover"
                    }
                    loading="lazy"
                  />
                  {item.badge?.trim() && (
                    <span
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: "#111111",
                        color: "#FFFFFF",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="text-base font-bold leading-snug"
                      style={{
                        fontFamily: "var(--gp-font-heading)",
                        color: "var(--gp-heading-color)",
                      }}
                    >
                      {item.name}
                    </h3>
                    {item.price?.trim() && (
                      <span
                        className="text-sm font-bold shrink-0 tabular-nums"
                        style={{ color: "var(--gp-accent)" }}
                      >
                        {item.price}
                      </span>
                    )}
                  </div>
                  {item.description?.trim() && (
                    <p className="text-xs opacity-75 leading-relaxed">{item.description}</p>
                  )}
                </div>

                {item.buyUrl?.trim() && (
                  <a
                    href={isPublic && isSafeHref(item.buyUrl) ? item.buyUrl : undefined}
                    onClick={isPublic ? undefined : (e) => e.preventDefault()}
                    target={isPublic && /^https?:\/\//i.test(item.buyUrl) ? "_blank" : undefined}
                    rel={
                      isPublic && /^https?:\/\//i.test(item.buyUrl)
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="inline-flex items-center justify-center gap-1.5 w-full h-10 rounded-xl text-xs font-semibold border transition-colors hover:opacity-85"
                    style={{
                      borderColor: "var(--gp-surface-border)",
                      color: "var(--gp-heading-color)",
                    }}
                  >
                    <span>Đặt mua / Xem chi tiết</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
