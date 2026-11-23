import type { CSSProperties } from "react";
import Image from "next/image";
import { ChevronDown, MapPin } from "lucide-react";
import { readableOn } from "@/lib/color";
import type {
  AccordionBlockPayload,
  ButtonBlockPayload,
  GalleryBlockPayload,
  MapBlockPayload,
  MenuCardBlockPayload,
  VideoEmbedBlockPayload,
} from "@/features/pages/types";
import { resolveMediaUrl } from "../media";
import {
  alignItemsClass,
  alignJustifyClass,
  alignTextClass,
  readBlockStyle,
  resolveBlockAlign,
} from "../block-frame";
import { renderLnkBioFormattedText } from "@/features/public/components/lnkbio-format";
import { HEADING_STYLE, PageLink, tint } from "../primitives";
import { isSafeMapsUrl, mapsEmbedUrl, mapsSearchUrl, parseVideoUrl } from "../embeds";
import type { BlockRenderProps } from "../types";

function PreviewPlaceholder({ ctx, children }: { ctx: BlockRenderProps["ctx"]; children: string }) {
  if (ctx.mode !== "preview") return null;
  return (
    <div
      className="w-full py-6 px-4 rounded-2xl border border-dashed text-center text-xs opacity-60"
      style={{ borderColor: tint(30) }}
    >
      {children}
    </div>
  );
}

const cardSurface = (ctx: BlockRenderProps["ctx"]): CSSProperties =>
  ctx.variant === "standard"
    ? { backgroundColor: tint(6), borderColor: tint(14) }
    : { backgroundColor: "#202225", borderColor: "rgba(255,255,255,0.12)" };

// ---------------------------------------------------------------------------
// Nút kêu gọi hành động (CTA)
// ---------------------------------------------------------------------------

export function ButtonBlock({ block, ctx }: BlockRenderProps) {
  const link = block.links[0];
  const p = block.payload as ButtonBlockPayload;
  if (!link) return <PreviewPlaceholder ctx={ctx}>Chưa chọn liên kết cho nút</PreviewPlaceholder>;

  const useAccent = (p.emphasis ?? "accent") === "accent";
  const bg = p.customBg || (useAccent ? ctx.tokens.colors.accent : ctx.tokens.colors.surface);
  const fg =
    p.customText ||
    (p.customBg
      ? readableOn(p.customBg)
      : useAccent
        ? readableOn(ctx.tokens.colors.accent)
        : ctx.tokens.colors.surfaceText);
  const large = p.size === "lg";
  const btnAlign = resolveBlockAlign(block.payload, "center");

  return (
    <div className="w-full max-w-(--gp-max-w) mx-auto mt-(--gp-gap)">
      <PageLink
        ctx={ctx}
        link={link}
        zaloTarget={p.zaloTarget}
        className={`group flex flex-col ${alignItemsClass(btnAlign)} justify-center w-full ${alignTextClass(btnAlign)} px-5 transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.99] select-none ${
          large ? "py-2.5" : "py-2"
        }`}
        style={{
          backgroundColor: bg,
          color: fg,
          borderRadius: "var(--gp-radius)",
          boxShadow: "0 10px 24px -8px rgb(0 0 0 / 0.35)",
          textDecoration: "none",
          minHeight: large
            ? "calc(var(--gp-btn-height, 64px) + 10px)"
            : "var(--gp-btn-height, 64px)",
        }}
      >
        <span
          className="font-extrabold tracking-[0.8px] leading-tight whitespace-pre-line"
          style={{
            fontFamily: "var(--gp-title-font, var(--gp-font-body))",
            fontSize: large
              ? "var(--gp-title-size, calc(var(--gp-base-size, 14px) * 1.2))"
              : "var(--gp-title-size, calc(var(--gp-base-size, 14px) * 1.07))",
            textTransform: "var(--gp-text-case)" as CSSProperties["textTransform"],
          }}
        >
          {link.label}
        </span>
        {p.subtitle && (
          <span
            className="opacity-85 mt-1 font-medium whitespace-pre-line"
            style={{ fontSize: "var(--gp-body-size, calc(var(--gp-base-size, 14px) * 0.86))" }}
          >
            {p.subtitle}
          </span>
        )}
      </PageLink>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thư viện ảnh
// ---------------------------------------------------------------------------

export function GalleryBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as GalleryBlockPayload;
  const images = (p.images || [])
    .map((img) => ({ ...img, src: resolveMediaUrl(img.url) }))
    .filter((img) => img.src);
  if (images.length === 0)
    return <PreviewPlaceholder ctx={ctx}>Chưa có ảnh trong thư viện</PreviewPlaceholder>;

  const align = resolveBlockAlign(block.payload, "center");

  if (p.layout === "carousel") {
    // Mỗi slide rộng 78%: đệm 11% hai bên để slide nằm chính giữa (Giữa), hoặc 22% bên trái để sát phải (Phải)
    const trackPadding =
      align === "center" ? "px-[11%]" : align === "right" ? "pl-[22%] pr-1" : "px-1";
    const snapAlign =
      align === "center" ? "snap-center" : align === "right" ? "snap-end" : "snap-start";
    return (
      <div className="w-full my-2 -mx-1">
        <div
          className={`flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:thin] ${trackPadding}`}
        >
          {images.map((img, i) => (
            <div
              key={`${img.src}-${i}`}
              className={`relative shrink-0 w-[78%] aspect-4/5 rounded-2xl overflow-hidden shadow-md ${snapAlign}`}
            >
              <Image
                src={img.src}
                alt={img.alt || `Ảnh ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const colCount = p.columns === 3 ? 3 : 2;
  // Khi số ảnh ít hơn số cột (VD: 1 ảnh ở lưới 2 cột), dùng flex để căn Trái / Giữa / Phải chuẩn xác
  if (images.length < colCount) {
    const itemWidth = colCount === 3 ? "w-[calc(33.333%-0.35rem)]" : "w-[calc(50%-0.25rem)]";
    return (
      <div className={`w-full my-2 flex flex-wrap ${alignJustifyClass(align)} gap-2`}>
        {images.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            className={`relative ${itemWidth} aspect-square rounded-xl overflow-hidden shadow-sm`}
          >
            <Image
              src={img.src}
              alt={img.alt || `Ảnh ${i + 1}`}
              fill
              className="object-cover"
              unoptimized
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  }

  const cols = colCount === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={`w-full my-2 grid ${cols} gap-2`}>
      {images.map((img, i) => (
        <div
          key={`${img.src}-${i}`}
          className="relative aspect-square rounded-xl overflow-hidden shadow-sm"
        >
          <Image
            src={img.src}
            alt={img.alt || `Ảnh ${i + 1}`}
            fill
            className="object-cover"
            unoptimized
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thẻ món (menu)
// ---------------------------------------------------------------------------

export function MenuCardBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as MenuCardBlockPayload;
  const items = (p.items || []).filter((it) => it.name?.trim());
  if (items.length === 0) return <PreviewPlaceholder ctx={ctx}>Chưa có món nào</PreviewPlaceholder>;

  const isGrid = p.layout === "grid";
  const accent = "var(--gp-accent)";

  return (
    <div className="w-full my-2 space-y-3">
      {p.title && (
        <h3
          className={`${alignTextClass(resolveBlockAlign(block.payload, "center"))} tracking-[0.5px]`}
          style={
            ctx.variant === "standard"
              ? {
                  ...HEADING_STYLE,
                  fontSize: "var(--gp-title-size, calc(var(--gp-base-size, 14px) * 1.1))",
                }
              : { fontSize: "var(--gp-title-size, calc(var(--gp-base-size, 14px) * 1.1))" }
          }
        >
          {p.title}
        </h3>
      )}
      <div className={isGrid ? "grid grid-cols-2 gap-2.5" : "flex flex-col gap-2.5"}>
        {items.map((item, i) => {
          const img = resolveMediaUrl(item.imageUrl);
          return (
            <div
              key={`${item.name}-${i}`}
              className={`relative rounded-2xl border overflow-hidden ${isGrid ? "flex flex-col" : "flex items-center gap-3 p-2.5"}`}
              style={cardSurface(ctx)}
            >
              {img && (
                <div
                  className={`relative shrink-0 overflow-hidden ${
                    isGrid ? "w-full aspect-square" : "w-[68px] h-[68px] rounded-xl"
                  }`}
                >
                  <Image
                    src={img}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized
                    loading="lazy"
                  />
                </div>
              )}
              {item.badge && (
                <span
                  className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: ctx.tokens.colors.accent,
                    color: readableOn(ctx.tokens.colors.accent),
                  }}
                >
                  {item.badge}
                </span>
              )}
              <div className={`min-w-0 flex-1 ${isGrid ? "p-2.5" : ""}`}>
                <div
                  className={
                    isGrid ? "flex flex-col gap-1" : "flex items-baseline justify-between gap-2"
                  }
                >
                  <span
                    className="font-bold leading-snug min-w-0 break-words"
                    style={{ fontSize: "var(--gp-body-size, var(--gp-base-size, 14px))" }}
                  >
                    {item.name}
                  </span>
                  {item.price && (
                    <span
                      className={`font-bold ${isGrid ? "break-words" : "shrink-0"}`}
                      style={{
                        color: accent,
                        fontSize: "calc(var(--gp-body-size, var(--gp-base-size, 14px)) * 0.93)",
                      }}
                    >
                      {item.price}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p
                    className="opacity-75 leading-snug mt-0.5 line-clamp-2"
                    style={{
                      fontSize: "calc(var(--gp-body-size, var(--gp-base-size, 14px)) * 0.86)",
                    }}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hỏi đáp / thông tin mở rộng (accordion)
// ---------------------------------------------------------------------------

export function AccordionBlock({ block, ctx }: BlockRenderProps) {
  const items = ((block.payload as AccordionBlockPayload).items || []).filter((it) =>
    it.title?.trim()
  );
  if (items.length === 0)
    return <PreviewPlaceholder ctx={ctx}>Chưa có mục hỏi đáp nào</PreviewPlaceholder>;

  const accAlign = resolveBlockAlign(block.payload, "left");
  const accTextAlign = alignTextClass(accAlign);

  return (
    <div className="w-full my-2 flex flex-col gap-2">
      {items.map((item, i) => (
        <details
          key={`${item.title}-${i}`}
          className="group rounded-2xl border overflow-hidden"
          style={cardSurface(ctx)}
        >
          <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span
              className={`font-semibold flex-1 ${accTextAlign}`}
              style={{
                fontFamily: "var(--gp-title-font, var(--gp-font-body))",
                fontSize: "var(--gp-title-size, var(--gp-base-size, 14px))",
              }}
            >
              {item.title}
            </span>
            <ChevronDown className="w-4 h-4 shrink-0 opacity-70 transition-transform group-open:rotate-180" />
          </summary>
          <div
            className={`px-4 pb-3.5 leading-relaxed opacity-85 ${accTextAlign}`}
            style={{ fontSize: "var(--gp-body-size, calc(var(--gp-base-size, 14px) * 0.93))" }}
          >
            {renderLnkBioFormattedText(item.content, accAlign, "var(--gp-accent)")}
          </div>
        </details>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Video YouTube / TikTok
// ---------------------------------------------------------------------------

export function VideoEmbedBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as VideoEmbedBlockPayload;
  const video = parseVideoUrl(p.url);
  if (!video)
    return (
      <PreviewPlaceholder ctx={ctx}>
        Dán link YouTube hoặc TikTok để hiển thị video
      </PreviewPlaceholder>
    );

  const vertical = video.aspect === "9/16";
  const videoAlign = resolveBlockAlign(block.payload, "center");
  const videoMargin =
    videoAlign === "left" ? "mr-auto" : videoAlign === "right" ? "ml-auto" : "mx-auto";

  return (
    <div className="w-full my-2">
      <div
        className={`relative ${videoMargin} overflow-hidden rounded-2xl shadow-lg bg-black ${
          vertical ? "w-full max-w-[340px] aspect-9/16" : "w-full aspect-video"
        }`}
      >
        <iframe
          src={video.embedUrl}
          title={p.caption || "Video"}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
      {p.caption && (
        <p
          className={`opacity-75 ${alignTextClass(resolveBlockAlign(block.payload, "center"))} mt-1.5`}
          style={{ fontSize: "var(--gp-body-size, calc(var(--gp-base-size, 14px) * 0.85))" }}
        >
          {p.caption}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bản đồ / địa chỉ
// ---------------------------------------------------------------------------

export function MapBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as MapBlockPayload;
  const address = p.address?.trim();
  if (!address)
    return <PreviewPlaceholder ctx={ctx}>Nhập địa chỉ để hiển thị bản đồ</PreviewPlaceholder>;

  const align = readBlockStyle(block.payload)?.align;
  const href = p.mapsUrl && isSafeMapsUrl(p.mapsUrl) ? p.mapsUrl : mapsSearchUrl(address);
  const linkClass =
    align === "center"
      ? "flex flex-col items-center justify-center text-center gap-2 px-4 py-3.5 transition-colors hover:brightness-110 select-none"
      : align === "right"
        ? "flex flex-row-reverse items-center gap-3 px-4 py-3 transition-colors hover:brightness-110 select-none"
        : "flex items-center gap-3 px-4 py-3 transition-colors hover:brightness-110 select-none";
  const textWrapClass =
    align === "center"
      ? "min-w-0 text-center"
      : align === "right"
        ? "min-w-0 flex-1 text-right"
        : "min-w-0 flex-1 text-left";

  const body = (
    <>
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{
          backgroundColor: ctx.tokens.colors.accent,
          color: readableOn(ctx.tokens.colors.accent),
        }}
      >
        <MapPin className="w-4 h-4" />
      </span>
      <span className={textWrapClass}>
        <span
          className="block font-bold"
          style={{
            color: "var(--gp-heading-color, inherit)",
            fontFamily: "var(--gp-title-font, var(--gp-font-body))",
            fontSize: "var(--gp-title-size, var(--gp-base-size, 14px))",
          }}
        >
          {p.label || "Chỉ đường"}
        </span>
        <span
          className="block opacity-75 leading-snug"
          style={{ fontSize: "var(--gp-body-size, calc(var(--gp-base-size, 14px) * 0.86))" }}
        >
          {address}
        </span>
      </span>
    </>
  );

  return (
    <div className="w-full my-2 rounded-2xl border overflow-hidden" style={cardSurface(ctx)}>
      {p.showMap && ctx.mode === "public" && (
        <div className="relative w-full aspect-video">
          <iframe
            src={mapsEmbedUrl(address)}
            title={`Bản đồ: ${address}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      )}
      {p.showMap && ctx.mode === "preview" && (
        <div
          className="w-full aspect-video flex items-center justify-center text-xs opacity-60"
          style={{ backgroundColor: tint(8) }}
        >
          Bản đồ Google Maps hiển thị trên trang thật
        </div>
      )}
      {ctx.mode === "public" ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          style={{ textDecoration: "none" }}
        >
          {body}
        </a>
      ) : (
        <div className={linkClass}>{body}</div>
      )}
    </div>
  );
}
