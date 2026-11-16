import Image from "next/image";
import { renderLnkBioFormattedText } from "@/features/public/components/lnkbio-format";
import { resolveSmartIcon } from "@/features/public/components/brand-icons";
import { resolveMediaUrl } from "../media";
import { PageLink } from "../primitives";
import type { BlockRenderProps } from "../types";

export function SocialIconsBlock({ block, ctx }: BlockRenderProps) {
  const links = block.links;
  if (links.length === 0) return null;

  if (ctx.variant !== "standard") {
    return (
      <div className="flex items-center justify-center gap-6 my-1">
        {links.map((link) => (
          <PageLink
            key={link.id}
            ctx={ctx}
            link={link}
            className="text-white hover:text-neutral-300 transition-all hover:scale-110 active:scale-95"
            title={link.label}
          >
            {resolveSmartIcon(link.targetUrl, link.label, "social", "w-5 h-5")}
          </PageLink>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3.5 my-1 flex-wrap">
      {links.map((link) => {
        const iconUrl = resolveMediaUrl(link.mediaUrl);
        return (
          <PageLink
            key={link.id}
            ctx={ctx}
            link={link}
            className="w-10 h-10 @min-[40rem]:w-11 @min-[40rem]:h-11 rounded-full flex items-center justify-center border border-white/20 bg-white/5 hover:bg-white/15 hover:border-white/40 transition-all text-white active:scale-95 shadow-sm"
            title={link.label}
          >
            {iconUrl ? (
              <div className="relative w-5 h-5 rounded-full overflow-hidden">
                <Image
                  src={iconUrl}
                  alt={link.label}
                  fill
                  className="object-cover"
                  unoptimized
                  loading="lazy"
                />
              </div>
            ) : (
              resolveSmartIcon(link.targetUrl, link.label, "social", "w-5 h-5")
            )}
          </PageLink>
        );
      })}
    </div>
  );
}

export function HeadingBlock({ block, ctx }: BlockRenderProps) {
  const payload = block.payload as { text?: string; level?: number };
  const level = payload.level || 1;
  const isCard = ctx.variant === "beacons-card";
  const color = isCard ? "#FFFFFF" : ctx.theme.textColor;

  const sizeClass =
    level === 1
      ? isCard
        ? "text-[14px] @min-[40rem]:text-[15px] text-white leading-snug whitespace-pre-line"
        : "text-[16px] @min-[40rem]:text-[18px]"
      : level === 2
        ? isCard
          ? "text-[14px] @min-[40rem]:text-[15px] text-white leading-snug whitespace-pre-line"
          : "text-[15px] @min-[40rem]:text-[17px]"
        : isCard
          ? "text-[13px] @min-[40rem]:text-[14px] text-white leading-snug whitespace-pre-line"
          : "text-[13px] @min-[40rem]:text-[15px]";

  const className = `font-bold uppercase tracking-[0.5px] ${sizeClass}`;
  const Tag = level === 1 ? "h2" : level === 2 ? "h3" : "h4";

  return (
    <div className={isCard ? "mt-2 mb-1 text-center w-full" : "mt-[28px] mb-[6px] text-center w-full"}>
      <Tag className={className} style={{ color }}>
        {payload.text}
      </Tag>
    </div>
  );
}

export function TextBlock({ block, ctx }: BlockRenderProps) {
  const payload = block.payload as { content?: string; align?: "left" | "center" | "right" };
  const isCard = ctx.variant === "beacons-card";

  return (
    <div
      className={
        isCard
          ? "space-y-3 text-[13px] @min-[40rem]:text-[14px] leading-[1.65] w-full text-neutral-300"
          : "mt-[14px] space-y-2 text-[14px] leading-[1.6] tracking-[0.5px] w-full max-w-[620px] mx-auto"
      }
    >
      {renderLnkBioFormattedText(
        payload.content || "",
        payload.align || (isCard ? "left" : "center"),
        ctx.theme.accentColor
      )}
    </div>
  );
}

export function ImageBlock({ block, ctx }: BlockRenderProps) {
  const payload = block.payload as {
    url?: string;
    imageUrl?: string;
    alt?: string;
    caption?: string;
  };
  const imgUrl = resolveMediaUrl(payload.imageUrl || payload.url);

  if (!imgUrl) {
    if (ctx.mode !== "preview") return null;
    return (
      <div className="w-full my-2 aspect-16/9 bg-white/5 border border-white/15 rounded-2xl flex items-center justify-center text-xs opacity-60">
        Chưa chọn ảnh
      </div>
    );
  }

  return (
    <div className="w-full my-2">
      <div className="relative w-full aspect-16/9 rounded-2xl overflow-hidden shadow-lg">
        <Image
          src={imgUrl}
          alt={payload.alt || "Banner ảnh"}
          fill
          className="object-cover"
          unoptimized
          loading="lazy"
        />
      </div>
      {payload.caption && <p className="text-xs opacity-75 text-center mt-1.5">{payload.caption}</p>}
    </div>
  );
}

/** Chiều cao khoảng trống theo cỡ do editor lưu ("sm".."xl"); dữ liệu cũ dạng số (px) vẫn được hỗ trợ. */
export const SPACER_HEIGHT_PX: Record<string, number> = { sm: 10, md: 20, lg: 32, xl: 48 };

export function resolveSpacerHeight(height: unknown): number {
  if (typeof height === "number" && Number.isFinite(height) && height >= 0) {
    return Math.min(height, 200);
  }
  if (typeof height === "string" && height in SPACER_HEIGHT_PX) {
    return SPACER_HEIGHT_PX[height];
  }
  return 16;
}

export function SpacerBlock({ block }: BlockRenderProps) {
  const height = resolveSpacerHeight((block.payload as { height?: unknown }).height);
  return <div style={{ height: `${height}px` }} aria-hidden="true" />;
}

export function DividerBlock({ block }: BlockRenderProps) {
  const style = (block.payload as { style?: string }).style;
  const styleClass =
    style === "dashed" ? "border-dashed" : style === "dotted" ? "border-dotted" : "border-solid";
  return <div className={`w-full border-t border-white/10 my-2 ${styleClass}`} aria-hidden="true" />;
}
