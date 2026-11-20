import { FONT_IDS, FONT_STACKS, isSafeColor, type FontId } from "@/config/theme-tokens";

const ALLOWED_TAGS = new Set([
  "p",
  "div",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "span",
  "ul",
  "ol",
  "li",
  "a",
]);

const VOID_TAGS = new Set(["br"]);

const SAFE_ALIGN = new Set(["left", "center", "right", "justify"]);
const SAFE_FONT_WEIGHT = new Set([
  "normal",
  "bold",
  "bolder",
  "lighter",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
]);
const SAFE_FONT_STYLE = new Set(["normal", "italic", "oblique"]);
const SAFE_TEXT_DECORATION_TOKENS = new Set(["none", "underline", "line-through"]);

/** Kiểm tra chuỗi có chứa thẻ HTML định dạng hay chỉ là văn bản thuần cũ. */
export function isRichTextHtml(input: string | null | undefined): boolean {
  if (!input) return false;
  return /<\/?(?:p|div|br|strong|b|em|i|u|s|strike|span|ul|ol|li|a)\b[^>]*>/i.test(input);
}

/** Escape HTML cơ bản khi chuyển văn bản thuần sang HTML ban đầu cho editor. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Chuyển nội dung cũ (plain text có \n) sang HTML sạch để hiển thị trong RichTextEditor. */
export function toEditorHtml(value: string | null | undefined): string {
  if (!value) return "";
  if (isRichTextHtml(value)) return sanitizeRichTextHtml(value);
  return value
    .split("\n")
    .map((line) => (line.trim() === "" ? "<p><br></p>" : `<p>${escapeHtml(line)}</p>`))
    .join("");
}

/** Chỉ giữ lại các thuộc tính CSS inline an toàn (color, font-size, font-family, text-align). */
function sanitizeStyleAttr(rawStyle: string): string {
  const safeParts: string[] = [];
  const declarations = rawStyle.split(";");

  for (const decl of declarations) {
    const colonIdx = decl.indexOf(":");
    if (colonIdx === -1) continue;
    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    const val = decl.slice(colonIdx + 1).trim();
    if (!val || /url\s*\(|expression\s*\(|javascript:/i.test(val)) continue;

    if (prop === "color" && isSafeColor(val)) {
      safeParts.push(`color: ${val}`);
    } else if (prop === "text-align" && SAFE_ALIGN.has(val.toLowerCase())) {
      safeParts.push(`text-align: ${val.toLowerCase()}`);
    } else if (prop === "font-weight" && SAFE_FONT_WEIGHT.has(val.toLowerCase())) {
      safeParts.push(`font-weight: ${val.toLowerCase()}`);
    } else if (prop === "font-style" && SAFE_FONT_STYLE.has(val.toLowerCase())) {
      safeParts.push(`font-style: ${val.toLowerCase()}`);
    } else if (prop === "text-decoration" || prop === "text-decoration-line") {
      const tokens = val
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => SAFE_TEXT_DECORATION_TOKENS.has(t));
      if (tokens.length > 0) {
        safeParts.push(`${prop}: ${tokens.join(" ")}`);
      }
    } else if (prop === "font-size") {
      const m = val.match(/^(\d{1,2}(?:\.\d+)?)\s*px$/i);
      if (m) {
        const num = Math.min(40, Math.max(10, parseFloat(m[1])));
        safeParts.push(`font-size: ${num}px`);
      }
    } else if (prop === "font-family") {
      // Cho phép var(--font-...) thuộc danh sách FONT_IDS hoặc tên font an toàn (chữ cái, số, khoảng trắng, dấu phẩy, gạch nối)
      const matchedFontId = (FONT_IDS as readonly string[]).find(
        (id) => val.includes(`--font-${id}`) || val.toLowerCase().includes(id.replace(/-/g, " "))
      ) as FontId | undefined;
      if (matchedFontId) {
        safeParts.push(`font-family: ${FONT_STACKS[matchedFontId]}`);
      } else if (/^[a-zA-Z0-9\s,'"-]+$/.test(val) && val.length <= 120) {
        safeParts.push(`font-family: ${val}`);
      }
    }
  }

  return safeParts.join("; ");
}

function sanitizeHref(rawHref: string): string | null {
  const trimmed = rawHref.trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed.replace(/"/g, "%22");
  }
  return null;
}

/**
 * Làm sạch HTML rich text theo whitelist chặt (dùng được cả phía client và server SSR).
 * Loại bỏ hoàn toàn <script>, <iframe>, sự kiện on*, URL javascript:, CSS nguy hiểm.
 */
export function sanitizeRichTextHtml(html: string): string {
  if (!html) return "";

  // 1. Gỡ bỏ hoàn toàn các khối thẻ nguy hiểm kèm nội dung bên trong
  const stripped = html
    .replace(/<(script|style|iframe|object|embed|svg|math)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // 2. Lọc từng thẻ HTML
  return stripped.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (match, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";

      const isClosing = match.startsWith("</");
      if (isClosing) {
        return VOID_TAGS.has(tag) ? "" : `</${tag}>`;
      }

      if (VOID_TAGS.has(tag)) {
        return `<${tag}>`;
      }

      const keptAttrs: string[] = [];

      if (tag === "a") {
        const hrefMatch = rawAttrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const rawHref = hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? "") : "";
        const safeHref = sanitizeHref(rawHref);
        if (safeHref) {
          keptAttrs.push(`href="${safeHref}"`);
          if (/^https?:\/\//i.test(safeHref)) {
            keptAttrs.push('target="_blank"');
            keptAttrs.push('rel="noopener noreferrer"');
          }
        }
      }

      const styleMatch = rawAttrs.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const alignMatch = rawAttrs.match(/\balign\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawAlign = (alignMatch?.[1] ?? alignMatch?.[2] ?? alignMatch?.[3] ?? "")
        .trim()
        .toLowerCase();
      let combinedStyle = styleMatch ? (styleMatch[1] ?? styleMatch[2] ?? "") : "";
      if (rawAlign && SAFE_ALIGN.has(rawAlign) && !/text-align\s*:/i.test(combinedStyle)) {
        combinedStyle = combinedStyle
          ? `${combinedStyle}; text-align: ${rawAlign}`
          : `text-align: ${rawAlign}`;
      }
      if (combinedStyle) {
        const safeStyle = sanitizeStyleAttr(combinedStyle);
        if (safeStyle) {
          keptAttrs.push(`style="${safeStyle}"`);
        }
      }

      return keptAttrs.length > 0 ? `<${tag} ${keptAttrs.join(" ")}>` : `<${tag}>`;
    }
  );
}

/** Tính số từ & số ký tự hiển thị thực tế (không tính thẻ HTML). */
export function countRichTextStats(value: string | null | undefined): {
  words: number;
  chars: number;
} {
  if (!value) return { words: 0, chars: 0 };
  const plain = value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(?:p|div|li)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return { words: 0, chars: 0 };
  return {
    words: plain.split(/\s+/).filter(Boolean).length,
    chars: plain.length,
  };
}
