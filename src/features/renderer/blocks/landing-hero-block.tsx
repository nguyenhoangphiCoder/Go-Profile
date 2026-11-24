import type { HeroSectionBlockPayload } from "@/features/pages/types";
import { resolveMediaUrl } from "../media";
import type { BlockRenderProps } from "../types";

function isSafeHref(url?: string | null): boolean {
  if (!url) return false;
  const u = url.trim();
  return u.startsWith("/") || u.startsWith("#") || /^https?:\/\//i.test(u) || /^tel:/i.test(u);
}

/**
 * Khối Banner mở đầu (Hero Section) dành riêng cho Landing Page.
 * Thiết kế theo phong cách Gờ Minimal Luxury: thoáng, chữ không chân Lexend Deca, nhấn vàng đồng.
 */
export function HeroSectionBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as HeroSectionBlockPayload;
  const layout = p.layout || "split";
  const imgSrc = resolveMediaUrl(p.imageUrl);
  const videoSrc =
    p.videoUrl && /^https?:\/\//i.test(p.videoUrl.trim()) ? p.videoUrl.trim() : undefined;
  const overlayOpacity =
    typeof p.overlayOpacity === "number" ? Math.min(85, Math.max(0, p.overlayOpacity)) : 55;
  const heightClass =
    p.height === "compact"
      ? "py-10 @min-[48rem]:py-14"
      : p.height === "tall"
        ? "py-24 @min-[48rem]:py-36"
        : "py-16 @min-[48rem]:py-24";
  const title = p.title?.trim() || ctx.pageTitle || "GỜ CAFÉ";
  const subtitle = p.subtitle?.trim();
  const eyebrow = p.eyebrow?.trim();
  const isPublic = ctx.mode === "public";

  const hasPrimary = Boolean(p.primaryCtaLabel?.trim());
  const hasSecondary = Boolean(p.secondaryCtaLabel?.trim());

  const renderCtas = (centered: boolean, onDark = false) => {
    if (!hasPrimary && !hasSecondary) return null;
    return (
      <div
        className={`flex flex-wrap items-center gap-3 pt-2 ${
          centered ? "justify-center" : "justify-start"
        }`}
      >
        {hasPrimary && (
          <a
            href={isPublic && isSafeHref(p.primaryCtaHref) ? p.primaryCtaHref : undefined}
            onClick={isPublic ? undefined : (e) => e.preventDefault()}
            className="inline-flex items-center justify-center px-6 h-12 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={
              onDark
                ? { backgroundColor: "#FFFFFF", color: "#111111" }
                : { backgroundColor: "var(--gp-surface)", color: "var(--gp-surface-text)" }
            }
          >
            {p.primaryCtaLabel}
          </a>
        )}
        {hasSecondary && (
          <a
            href={isPublic && isSafeHref(p.secondaryCtaHref) ? p.secondaryCtaHref : undefined}
            onClick={isPublic ? undefined : (e) => e.preventDefault()}
            className={`inline-flex items-center justify-center px-6 h-12 rounded-xl text-sm font-semibold border transition-colors ${
              onDark ? "hover:bg-white/10" : "hover:opacity-80"
            }`}
            style={
              onDark
                ? { borderColor: "rgba(255, 255, 255, 0.5)", color: "#FFFFFF" }
                : { borderColor: "var(--gp-surface-border)", color: "var(--gp-text)" }
            }
          >
            {p.secondaryCtaLabel}
          </a>
        )}
      </div>
    );
  };

  if (layout === "full-bg") {
    return (
      <section
        id={p.anchorId || undefined}
        className={`relative overflow-hidden rounded-3xl px-6 @min-[48rem]:px-14 text-center ${heightClass}`}
        style={{
          backgroundColor: "#111111",
          color: "#FFFFFF",
        }}
      >
        {videoSrc ? (
          <video
            src={videoSrc}
            poster={imgSrc || undefined}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : imgSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={imgSrc} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        {(videoSrc || imgSrc) && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})` }}
          />
        )}
        <div className="relative z-10 max-w-3xl mx-auto space-y-5">
          {eyebrow && (
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--gp-accent)" }}
            >
              {eyebrow}
            </p>
          )}
          <h1
            className="text-3xl @min-[48rem]:text-5xl font-bold leading-tight tracking-tight"
            style={{ fontFamily: "var(--gp-font-heading)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm @min-[48rem]:text-lg text-white/85 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
              {subtitle}
            </p>
          )}
          {renderCtas(true, true)}
        </div>
      </section>
    );
  }

  if (layout === "centered" || !imgSrc) {
    return (
      <section
        id={p.anchorId || undefined}
        className="py-10 @min-[48rem]:py-16 text-center max-w-3xl mx-auto space-y-5"
      >
        {eyebrow && (
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--gp-accent)" }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="text-3xl @min-[48rem]:text-5xl font-bold leading-tight tracking-tight"
          style={{ fontFamily: "var(--gp-font-heading)", color: "var(--gp-heading-color)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-base @min-[48rem]:text-lg opacity-80 leading-relaxed whitespace-pre-line">
            {subtitle}
          </p>
        )}
        {renderCtas(true)}
        {imgSrc && (
          <div className="pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={title}
              className="w-full max-h-[480px] object-cover rounded-3xl border"
              style={{ borderColor: "var(--gp-surface-border)" }}
            />
          </div>
        )}
      </section>
    );
  }

  // Default: split (2 cột trên Desktop, xếp dọc trên Mobile)
  return (
    <section
      id={p.anchorId || undefined}
      className="py-8 @min-[48rem]:py-14 grid grid-cols-1 @min-[48rem]:grid-cols-12 gap-8 @min-[48rem]:gap-12 items-center"
    >
      <div className="@min-[48rem]:col-span-6 space-y-5 text-left">
        {eyebrow && (
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--gp-accent)" }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="text-3xl @min-[48rem]:text-5xl font-bold leading-tight tracking-tight"
          style={{ fontFamily: "var(--gp-font-heading)", color: "var(--gp-heading-color)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-base @min-[48rem]:text-lg opacity-80 leading-relaxed whitespace-pre-line">
            {subtitle}
          </p>
        )}
        {renderCtas(false)}
      </div>
      <div className="@min-[48rem]:col-span-6 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={title}
          className={
            /\.png(?:\?|$)/i.test(imgSrc)
              ? "w-full max-w-[420px] max-h-[420px] object-contain mx-auto drop-shadow-md"
              : "w-full aspect-[4/3] object-cover rounded-3xl border shadow-sm"
          }
          style={
            /\.png(?:\?|$)/i.test(imgSrc) ? undefined : { borderColor: "var(--gp-surface-border)" }
          }
        />
      </div>
    </section>
  );
}
