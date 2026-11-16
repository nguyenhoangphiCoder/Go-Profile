import type { CSSProperties, ReactNode } from "react";
import type { RenderContext, RenderLink } from "./types";

/**
 * Thẻ bấm của một liên kết.
 * - public: thẻ <a> đi qua /r/{pageLinkId} để ghi nhận click rồi chuyển hướng.
 * - preview: thẻ <div> (không điều hướng khỏi editor, id placement chưa phải page_link_id thật).
 */
export function PageLink({
  ctx,
  link,
  className,
  style,
  title,
  children,
}: {
  ctx: RenderContext;
  link: RenderLink;
  className?: string;
  style?: CSSProperties;
  title?: string;
  children: ReactNode;
}) {
  if (ctx.mode === "public") {
    return (
      <a
        href={`/r/${link.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
        title={title}
      >
        {children}
      </a>
    );
  }
  return (
    <div className={className} style={style} title={title}>
      {children}
    </div>
  );
}

export function MoreDotsIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

/** Tách nhãn "Tiêu đề\nPhụ đề" thành hai phần. */
export function splitLabel(label: string): { title: string; subtitle: string } {
  const [title, ...rest] = (label || "").split("\n");
  return { title, subtitle: rest.join(" ").trim() };
}

/** Màu chữ theme pha trong suốt (dùng cho viền/nền nhạt hợp cả theme sáng lẫn tối). */
export function tint(percent: number): string {
  return `color-mix(in srgb, var(--gp-text) ${percent}%, transparent)`;
}

/** Kiểu chữ tiêu đề (bố cục standard) lấy từ token typography. */
export const HEADING_STYLE: CSSProperties = {
  color: "var(--gp-text)",
  fontFamily: "var(--gp-font-heading)",
  fontWeight: "var(--gp-heading-weight)" as CSSProperties["fontWeight"],
  textTransform: "var(--gp-text-case)" as CSSProperties["textTransform"],
};
