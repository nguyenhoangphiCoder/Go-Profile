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

/** Lớp bo góc cho nút liên kết theo theme (mặc định "full" = viên thuốc). */
export function pillRadiusClass(radius: RenderContext["theme"]["borderRadius"]): string {
  switch (radius) {
    case "none":
      return "rounded-none";
    case "sm":
      return "rounded-xl";
    case "md":
      return "rounded-2xl";
    default:
      return "rounded-full";
  }
}
