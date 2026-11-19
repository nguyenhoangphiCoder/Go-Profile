import Image from "next/image";
import { renderLnkBioFormattedText } from "@/features/public/components/lnkbio-format";
import { resolveSmartIcon } from "@/features/public/components/brand-icons";
import { isOptimizableImageUrl, resolveMediaUrl } from "../media";
import { HEADING_STYLE, PageLink, tint } from "../primitives";

const SOCIAL_STYLE = {
  color: "var(--gp-text)",
  borderColor: tint(22),
  backgroundColor: tint(6),
};
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
            className="w-10 h-10 @min-[40rem]:w-11 @min-[40rem]:h-11 rounded-full flex items-center justify-center border transition-all active:scale-95 shadow-sm hover:scale-105"
            style={SOCIAL_STYLE}
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

  const headingFontSize =
    level === 1
      ? "var(--gp-title-size, calc(var(--gp-base-size, 14px) * 1.22))"
      : level === 2
        ? "var(--gp-title-size, calc(var(--gp-base-size, 14px) * 1.12))"
        : "var(--gp-title-size, var(--gp-base-size, 14px))";

  const className = isCard
    ? "font-bold tracking-[0.5px] text-white leading-snug whitespace-pre-line"
    : "tracking-[0.5px]";
  const Tag = level === 1 ? "h2" : level === 2 ? "h3" : "h4";

  return (
    <div
      className={isCard ? "mt-2 mb-1 text-center w-full" : "mt-[28px] mb-[6px] text-center w-full"}
    >
      <Tag
        className={className}
        style={
          isCard
            ? {
                color: "#FFFFFF",
                fontFamily: "var(--gp-font-heading)",
                fontSize: headingFontSize,
                textTransform: "var(--gp-text-case)" as React.CSSProperties["textTransform"],
              }
            : { ...HEADING_STYLE, fontSize: headingFontSize }
        }
      >
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
          ? "space-y-3 leading-[1.65] w-full text-neutral-300"
          : "mt-[14px] space-y-2 leading-[1.6] tracking-[0.5px] w-full max-w-(--gp-max-w) mx-auto"
      }
      style={{ fontSize: "var(--gp-body-size, var(--gp-base-size, 14px))" }}
    >
      {renderLnkBioFormattedText(
        payload.content || "",
        payload.align || (isCard ? "left" : "center"),
        "var(--gp-accent)"
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
          sizes="(max-width: 640px) 100vw, 620px"
          className="object-cover"
          unoptimized={!isOptimizableImageUrl(imgUrl)}
          loading="lazy"
        />
      </div>
      {payload.caption && (
        <p
          className="opacity-75 text-center mt-1.5"
          style={{ fontSize: "var(--gp-body-size, calc(var(--gp-base-size, 14px) * 0.85))" }}
        >
          {payload.caption}
        </p>
      )}
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

export function DividerBlock({ block, ctx }: BlockRenderProps) {
  const style = (block.payload as { style?: string }).style;
  const styleClass =
    style === "dashed" ? "border-dashed" : style === "dotted" ? "border-dotted" : "border-solid";
  if (ctx.variant !== "standard") {
    return (
      <div className={`w-full border-t border-white/10 my-2 ${styleClass}`} aria-hidden="true" />
    );
  }
  return (
    <div
      className={`w-full border-t my-2 ${styleClass}`}
      style={{ borderColor: tint(15) }}
      aria-hidden="true"
    />
  );
}
