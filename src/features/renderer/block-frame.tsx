import type { CSSProperties, ReactNode } from "react";
import { FONT_STACKS } from "@/config/theme-tokens";
import type { BlockStyle } from "@/features/pages/types";
import { blockStyleSchema } from "./blocks/payload-schemas";
import { tint } from "./primitives";

const PADDING_Y: Record<NonNullable<BlockStyle["paddingY"]>, string> = {
  none: "",
  sm: "py-2",
  md: "py-4",
  lg: "py-7",
};

const PADDING_TOP: Record<NonNullable<BlockStyle["paddingTop"]>, string> = {
  none: "pt-0",
  sm: "pt-3",
  md: "pt-6",
  lg: "pt-10",
  xl: "pt-16",
};

const PADDING_BOTTOM: Record<NonNullable<BlockStyle["paddingBottom"]>, string> = {
  none: "pb-0",
  sm: "pb-3",
  md: "pb-6",
  lg: "pb-10",
  xl: "pb-16",
};

const MAX_WIDTH: Record<NonNullable<BlockStyle["maxWidth"]>, string> = {
  sm: "max-w-2xl mx-auto",
  md: "max-w-4xl mx-auto",
  lg: "max-w-6xl mx-auto",
  full: "max-w-none",
};

const RADIUS: Record<NonNullable<BlockStyle["radius"]>, string> = {
  none: "rounded-none",
  md: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
};

const SHADOW: Record<NonNullable<BlockStyle["shadow"]>, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-xl",
};

const ANIMATION_CLASS: Record<NonNullable<BlockStyle["animation"]>, string> = {
  none: "",
  "fade-up": "gp-anim-fade-up",
  "fade-in": "gp-anim-fade-in",
  "zoom-in": "gp-anim-zoom-in",
  "slide-left": "gp-anim-slide-left",
};

const GRADIENT_ANGLE: Record<NonNullable<BlockStyle["bgGradientDir"]>, string> = {
  "to-r": "90deg",
  "to-br": "135deg",
  "to-b": "180deg",
};

const ALIGN: Record<NonNullable<BlockStyle["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const FONT_SIZE_SCALE: Record<NonNullable<BlockStyle["fontSize"]>, string> = {
  sm: "calc(var(--gp-page-base-size, 14px) * 0.85)",
  md: "var(--gp-page-base-size, 14px)",
  lg: "calc(var(--gp-page-base-size, 14px) * 1.18)",
  xl: "calc(var(--gp-page-base-size, 14px) * 1.36)",
};

/** Đọc blockStyle từ payload; giá trị sai (dữ liệu cũ/hỏng) bị bỏ qua. */
export function readBlockStyle(payload: Record<string, unknown>): BlockStyle | null {
  const raw = payload.blockStyle;
  if (!raw) return null;
  const parsed = blockStyleSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export type TextAlign = NonNullable<BlockStyle["align"]>;

export function resolveBlockAlign(
  payload: Record<string, unknown>,
  fallback: TextAlign = "center"
): TextAlign {
  return readBlockStyle(payload)?.align ?? fallback;
}

export function alignTextClass(align: TextAlign): string {
  return ALIGN[align];
}

export function alignJustifyClass(align: TextAlign): string {
  return align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";
}

export function alignItemsClass(align: TextAlign): string {
  return align === "left" ? "items-start" : align === "right" ? "items-end" : "items-center";
}

/**
 * Lớp bao áp dụng style riêng của khối (Block Design System v3):
 * căn lề, khoảng đệm, nền (preset / màu đơn / gradient / ảnh + overlay), viền, bóng, độ rộng,
 * hiệu ứng, ID neo (#anchor) và ẩn theo thiết bị.
 */
export function BlockFrame({
  style,
  index,
  children,
}: {
  style: BlockStyle | null;
  index: number;
  children: ReactNode;
}) {
  if (!style) return <>{children}</>;

  const classes: string[] = ["w-full"];
  const css: CSSProperties = {};
  const hasCustomBg = Boolean(
    style.bgColor || (style.bgGradientFrom && style.bgGradientTo) || style.bgImageUrl
  );

  if (style.anchorId) {
    classes.push("scroll-mt-24");
  }
  if (style.align) classes.push(ALIGN[style.align]);
  if (style.maxWidth) classes.push(MAX_WIDTH[style.maxWidth]);

  // Khoảng đệm: ưu tiên paddingTop/paddingBottom độc lập nếu có; ngược lại dùng paddingY cũ
  if (style.paddingTop) classes.push(PADDING_TOP[style.paddingTop]);
  if (style.paddingBottom) classes.push(PADDING_BOTTOM[style.paddingBottom]);
  if (!style.paddingTop && !style.paddingBottom && style.paddingY) {
    classes.push(PADDING_Y[style.paddingY]);
  }

  const hasExplicitPadding = Boolean(
    style.paddingTop || style.paddingBottom || (style.paddingY && style.paddingY !== "none")
  );

  // Nền preset cũ (tương thích ngược 100%)
  if (style.surface === "card") {
    if (!style.radius) classes.push("rounded-2xl");
    if (!style.borderWidth) classes.push("border");
    classes.push("px-4");
    if (!hasExplicitPadding) classes.push("py-4");
    css.backgroundColor = tint(6);
    css.borderColor = tint(14);
  } else if (style.surface === "cream") {
    if (!style.radius) classes.push("rounded-3xl");
    if (!style.borderWidth) classes.push("border");
    classes.push("px-5 @min-[48rem]:px-10");
    if (!hasExplicitPadding) classes.push("py-6 @min-[48rem]:py-10");
    css.backgroundColor = "#F8F7F4";
    css.borderColor = "rgba(17, 17, 17, 0.06)";
    css.color = "#111111";
    (css as Record<string, string>)["--gp-text"] = "#111111";
    (css as Record<string, string>)["--gp-heading-color"] = "#111111";
  } else if (style.surface === "dark") {
    if (!style.radius) classes.push("rounded-3xl");
    classes.push("px-5 @min-[48rem]:px-10");
    if (!hasExplicitPadding) classes.push("py-6 @min-[48rem]:py-10");
    css.backgroundColor = "#111111";
    css.color = "#FFFFFF";
    (css as Record<string, string>)["--gp-text"] = "#FFFFFF";
    (css as Record<string, string>)["--gp-heading-color"] = "#FFFFFF";
    (css as Record<string, string>)["--gp-surface"] = "#B88A44";
    (css as Record<string, string>)["--gp-surface-text"] = "#FFFFFF";
    (css as Record<string, string>)["--gp-surface-border"] = "rgba(255, 255, 255, 0.22)";
    (css as Record<string, string>)["--gp-btn-bg"] = "#B88A44";
    (css as Record<string, string>)["--gp-btn-text"] = "#FFFFFF";
  }

  // Nền tự do (ghi đè lên preset nếu người dùng chọn màu / gradient / ảnh nền)
  if (hasCustomBg) {
    if (!style.surface || style.surface === "none") {
      classes.push("px-5 @min-[48rem]:px-8");
      if (!hasExplicitPadding) classes.push("py-6 @min-[48rem]:py-8");
      if (!style.radius) classes.push("rounded-2xl");
    }
    if (style.bgColor) {
      css.backgroundColor = style.bgColor;
    }
    if (style.bgGradientFrom && style.bgGradientTo) {
      const angle = GRADIENT_ANGLE[style.bgGradientDir ?? "to-br"];
      css.backgroundImage = `linear-gradient(${angle}, ${style.bgGradientFrom}, ${style.bgGradientTo})`;
    }
    if (style.bgImageUrl) {
      const overlayAlpha = Math.max(0, Math.min(90, style.bgOverlayOpacity ?? 35)) / 100;
      const safeUrl = style.bgImageUrl.replace(/["'()]/g, "");
      css.backgroundImage =
        overlayAlpha > 0
          ? `linear-gradient(rgba(0,0,0,${overlayAlpha}), rgba(0,0,0,${overlayAlpha})), url("${safeUrl}")`
          : `url("${safeUrl}")`;
      css.backgroundSize = "cover";
      css.backgroundPosition = "center";
    }
  }

  // Bo góc, viền, đổ bóng tùy chỉnh
  if (style.radius) classes.push(RADIUS[style.radius]);
  if (style.borderWidth === 1) classes.push("border");
  if (style.borderWidth === 2) classes.push("border-2");
  if (style.borderColor) {
    css.borderColor = style.borderColor;
    if (!style.borderWidth && style.surface !== "card" && style.surface !== "cream") {
      classes.push("border");
    }
  }
  if (style.shadow && style.shadow !== "none") classes.push(SHADOW[style.shadow]);

  // Hiệu ứng xuất hiện
  if (style.animation && style.animation !== "none") {
    const animCls = ANIMATION_CLASS[style.animation];
    if (animCls) {
      classes.push(animCls);
      (css as Record<string, string>)["--gp-anim-delay"] = `${Math.min(index, 10) * 60}ms`;
    }
  }

  // Cỡ chữ, Font & Màu chữ
  if (style.fontSize && style.fontSize !== "md") {
    (css as Record<string, string>)["--gp-base-size"] = FONT_SIZE_SCALE[style.fontSize];
  }
  if (typeof style.titleFontSize === "number") {
    (css as Record<string, string>)["--gp-title-size"] = `${style.titleFontSize}px`;
  }
  if (typeof style.bodyFontSize === "number") {
    (css as Record<string, string>)["--gp-body-size"] = `${style.bodyFontSize}px`;
  }
  if (style.titleFont) {
    const stack = FONT_STACKS[style.titleFont];
    (css as Record<string, string>)["--gp-font-heading"] = stack;
    (css as Record<string, string>)["--gp-title-font"] = stack;
  }
  if (style.bodyFont) {
    const stack = FONT_STACKS[style.bodyFont];
    (css as Record<string, string>)["--gp-font-body"] = stack;
    css.fontFamily = stack;
  }
  if (style.titleColor) {
    (css as Record<string, string>)["--gp-heading-color"] = style.titleColor;
  }
  if (style.bodyColor) {
    (css as Record<string, string>)["--gp-text"] = style.bodyColor;
    css.color = style.bodyColor;
  }
  if (typeof style.buttonHeight === "number") {
    (css as Record<string, string>)["--gp-btn-height"] = `${style.buttonHeight}px`;
  }

  // Ẩn theo độ rộng khung (container query) — đúng cả ở bản xem trước trong editor
  const hide = style.hideOn ?? [];
  if (hide.includes("mobile")) classes.push("@max-[40rem]:hidden");
  if (hide.includes("desktop")) classes.push("@min-[40rem]:hidden");

  if (classes.length === 1 && Object.keys(css).length === 0 && !style.anchorId) {
    return <>{children}</>;
  }
  return (
    <div id={style.anchorId || undefined} className={classes.join(" ")} style={css}>
      {children}
    </div>
  );
}
