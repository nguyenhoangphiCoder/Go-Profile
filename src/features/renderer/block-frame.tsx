import type { CSSProperties, ReactNode } from "react";
import type { BlockStyle } from "@/features/pages/types";
import { blockStyleSchema } from "./blocks/payload-schemas";
import { tint } from "./primitives";

const PADDING_Y: Record<NonNullable<BlockStyle["paddingY"]>, string> = {
  none: "",
  sm: "py-2",
  md: "py-4",
  lg: "py-7",
};

const ALIGN: Record<NonNullable<BlockStyle["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/** Đọc blockStyle từ payload; giá trị sai (dữ liệu cũ/hỏng) bị bỏ qua. */
export function readBlockStyle(payload: Record<string, unknown>): BlockStyle | null {
  const raw = payload.blockStyle;
  if (!raw) return null;
  const parsed = blockStyleSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/**
 * Lớp bao áp dụng style riêng của khối: căn lề, khoảng đệm, nền thẻ, hiệu ứng, ẩn theo thiết bị.
 * Khối không có style nào được render trực tiếp (không thêm phần tử thừa).
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

  if (style.align) classes.push(ALIGN[style.align]);
  if (style.paddingY) classes.push(PADDING_Y[style.paddingY]);
  if (style.surface === "card") {
    classes.push("rounded-2xl border px-4");
    if (!style.paddingY || style.paddingY === "none") classes.push("py-4");
    css.backgroundColor = tint(6);
    css.borderColor = tint(14);
  }
  if (style.animation === "fade-up") {
    classes.push("gp-anim-fade-up");
    (css as Record<string, string>)["--gp-anim-delay"] = `${Math.min(index, 10) * 60}ms`;
  }
  // Ẩn theo độ rộng khung (container query) — đúng cả ở bản xem trước trong editor
  const hide = style.hideOn ?? [];
  if (hide.includes("mobile")) classes.push("@max-[40rem]:hidden");
  if (hide.includes("desktop")) classes.push("@min-[40rem]:hidden");

  if (classes.length === 1 && Object.keys(css).length === 0) return <>{children}</>;
  return (
    <div className={classes.join(" ")} style={css}>
      {children}
    </div>
  );
}
