import type { CSSProperties } from "react";
import { z } from "zod";
import { THEME_PRESETS, resolveTheme, type ThemePreset } from "./themes";

/**
 * THEME V2 — DESIGN TOKENS
 *
 * Giao diện trang được mô tả bằng một cây token có cấu trúc (màu, nền, chữ, hình khối, nút,
 * khoảng cách). Mọi giá trị đều thuộc danh sách cho phép hoặc qua kiểm tra định dạng, nên
 * không có đường nào để chèn CSS tự do.
 *
 * Dữ liệu lưu trong `page_revisions.theme`:
 *   { preset, custom? (v1, cũ), version?: 2, overrides? (v2) }
 * Thứ tự áp dụng: token của preset -> custom v1 (nếu có) -> overrides v2 (nếu có).
 * Dữ liệu v1 được chuyển sang token khi đọc, không cần chạy migration database.
 */

// ---------------------------------------------------------------------------
// Danh sách giá trị cho phép
// ---------------------------------------------------------------------------

export const LAYOUT_IDS = ["standard", "beacons-card", "beacons-portrait"] as const;
export const FONT_IDS = ["be-vietnam-pro", "inter", "montserrat", "lexend-deca"] as const;
export const RADIUS_IDS = ["none", "sm", "md", "lg", "full"] as const;
export const SHADOW_IDS = ["none", "sm", "md", "lg"] as const;
export const BUTTON_VARIANTS = ["filled", "outline", "soft", "glass"] as const;
export const BACKGROUND_EFFECTS = ["none", "ambient", "frosted-warm", "frosted-light"] as const;
export const DENSITY_IDS = ["compact", "comfortable", "spacious"] as const;

export type FontId = (typeof FONT_IDS)[number];

export const FONT_LABELS: Record<FontId, string> = {
  "be-vietnam-pro": "Be Vietnam Pro",
  inter: "Inter",
  montserrat: "Montserrat",
  "lexend-deca": "Lexend Deca",
};

const FONT_STACKS: Record<FontId, string> = {
  "be-vietnam-pro": "var(--font-be-vietnam-pro), sans-serif",
  inter: "var(--font-inter), sans-serif",
  montserrat: "var(--font-montserrat), sans-serif",
  "lexend-deca": "var(--font-lexend-deca), sans-serif",
};

const RADIUS_CSS: Record<(typeof RADIUS_IDS)[number], string> = {
  none: "0px",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  full: "9999px",
};

const SHADOW_CSS: Record<(typeof SHADOW_IDS)[number], string> = {
  none: "none",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

export const GLASS_SHADOW =
  "0 6px 20px -2px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.15)";

const DENSITY_GAP_PX: Record<(typeof DENSITY_IDS)[number], number> = {
  compact: 12,
  comfortable: 21,
  spacious: 30,
};

// ---------------------------------------------------------------------------
// Kiểm tra định dạng an toàn
// ---------------------------------------------------------------------------

const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_COLOR =
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i;

/** Chỉ chấp nhận #hex, rgb()/rgba() dạng số và "transparent". */
export function isSafeColor(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  return v === "transparent" || HEX_COLOR.test(v) || RGB_COLOR.test(v);
}

const SAFE_PATH = /^\/[A-Za-z0-9/_\-.]+$/;
const SAFE_HTTPS_URL = /^https:\/\/[A-Za-z0-9.-]+(?::\d+)?\/[A-Za-z0-9/_\-.%~]*$/;

/** Đường dẫn ảnh nền: file tĩnh trong /public hoặc URL https không chứa ký tự đặc biệt CSS. */
export function isSafeImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1024) return false;
  return SAFE_PATH.test(value) || SAFE_HTTPS_URL.test(value);
}

// ---------------------------------------------------------------------------
// Schema token
// ---------------------------------------------------------------------------

const colorSchema = z.string().trim().max(64).refine(isSafeColor, "Mã màu không hợp lệ");

export const gradientSchema = z
  .object({
    kind: z.enum(["linear", "radial"]),
    angle: z.number().min(0).max(360),
    shape: z.enum(["circle", "ellipse"]),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    stops: z
      .array(z.object({ color: colorSchema, at: z.number().min(0).max(100) }).strict())
      .min(2)
      .max(5),
  })
  .strict();

const colorsSchema = z
  .object({
    background: colorSchema,
    text: colorSchema,
    accent: colorSchema,
    surface: colorSchema,
    surfaceText: colorSchema,
    surfaceBorder: colorSchema,
  })
  .strict();

const backgroundSchema = z
  .object({
    type: z.enum(["solid", "gradient", "image"]),
    gradient: gradientSchema.optional(),
    imageUrl: z.string().refine(isSafeImageUrl, "Đường dẫn ảnh không hợp lệ").optional(),
    effect: z.enum(BACKGROUND_EFFECTS),
  })
  .strict();

const typographySchema = z
  .object({
    bodyFont: z.enum(FONT_IDS),
    headingFont: z.enum(FONT_IDS),
    baseSize: z.number().int().min(12).max(18),
    headingWeight: z.union([z.literal(500), z.literal(600), z.literal(700), z.literal(800)]),
    textCase: z.enum(["uppercase", "normal"]),
  })
  .strict();

const shapeSchema = z
  .object({
    radius: z.enum(RADIUS_IDS),
    borderWidth: z.number().min(0).max(4),
    shadow: z.enum(SHADOW_IDS),
  })
  .strict();

const buttonSchema = z.object({ variant: z.enum(BUTTON_VARIANTS) }).strict();

const spacingSchema = z
  .object({
    maxWidth: z.number().int().min(360).max(800),
    density: z.enum(DENSITY_IDS),
  })
  .strict();

export const themeTokensSchema = z
  .object({
    layout: z.enum(LAYOUT_IDS),
    colors: colorsSchema,
    background: backgroundSchema,
    typography: typographySchema,
    shape: shapeSchema,
    button: buttonSchema,
    spacing: spacingSchema,
  })
  .strict();

export type ThemeTokens = z.infer<typeof themeTokensSchema>;
export type GradientTokens = z.infer<typeof gradientSchema>;

/** Phần ghi đè v2: mỗi nhóm token đều tuỳ chọn và có thể chỉ ghi đè một vài trường. */
export const themeOverridesSchema = z
  .object({
    layout: z.enum(LAYOUT_IDS).optional(),
    colors: colorsSchema.partial().optional(),
    background: backgroundSchema.partial().optional(),
    typography: typographySchema.partial().optional(),
    shape: shapeSchema.partial().optional(),
    button: buttonSchema.partial().optional(),
    spacing: spacingSchema.partial().optional(),
  })
  .strict();

export type ThemeOverrides = z.infer<typeof themeOverridesSchema>;

// ---------------------------------------------------------------------------
// Chuyển đổi theme v1 -> token v2
// ---------------------------------------------------------------------------

/** Tách danh sách theo dấu phẩy ở cấp ngoài cùng (bỏ qua dấu phẩy trong rgba(...)). */
function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of input) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Phân tích chuỗi gradient CSS cũ (v1) thành cấu trúc token.
 * Hỗ trợ `linear-gradient(<góc>deg, <màu> <vị trí>%, ...)` và
 * `radial-gradient(<circle|ellipse> at <x>% <y>%, ...)`. Chuỗi khác trả về null.
 */
export function parseLegacyGradient(css: unknown): GradientTokens | null {
  if (typeof css !== "string" || css.length > 500) return null;
  const m = css.trim().match(/^(linear|radial)-gradient\((.*)\)$/i);
  if (!m) return null;
  const kind = m[1].toLowerCase() as "linear" | "radial";
  const parts = splitTopLevel(m[2]);
  if (parts.length < 2) return null;

  let angle = 180;
  let shape: "circle" | "ellipse" = "ellipse";
  let x = 50;
  let y = 50;

  const head = parts[0];
  if (kind === "linear") {
    const a = head.match(/^(\d+(?:\.\d+)?)deg$/i);
    if (a) {
      angle = Math.min(360, Number(a[1]));
      parts.shift();
    }
  } else {
    const r = head.match(/^(circle|ellipse)?\s*(?:at\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%)?$/i);
    if (r && (r[1] || r[2])) {
      if (r[1]) shape = r[1].toLowerCase() as "circle" | "ellipse";
      if (r[2]) x = Math.min(100, Number(r[2]));
      if (r[3]) y = Math.min(100, Number(r[3]));
      parts.shift();
    }
  }

  const stops: GradientTokens["stops"] = [];
  parts.forEach((part, i) => {
    const s = part.match(/^(.+?)\s+(\d+(?:\.\d+)?)%$/);
    const color = (s ? s[1] : part).trim();
    if (!isSafeColor(color)) return;
    const at = s ? Math.min(100, Number(s[2])) : Math.round((i / Math.max(1, parts.length - 1)) * 100);
    stops.push({ color, at });
  });

  if (stops.length < 2 || stops.length > 5) return null;
  return { kind, angle, shape, x, y, stops };
}

function layoutOf(theme: ThemePreset): ThemeTokens["layout"] {
  if (theme.id === "beacons-dark-card") return "beacons-card";
  if (theme.id === "beacons-portrait-card") return "beacons-portrait";
  return "standard";
}

function legacyFont(font: unknown): FontId {
  return (FONT_IDS as readonly string[]).includes(font as string) ? (font as FontId) : "be-vietnam-pro";
}

function legacyEffect(theme: ThemePreset): ThemeTokens["background"]["effect"] {
  if (theme.backgroundVariant === "frosted-warm") return "frosted-warm";
  if (theme.backgroundVariant === "frosted-light") return "frosted-light";
  return theme.backgroundBlur || theme.backgroundVariant ? "ambient" : "none";
}

/**
 * Chuyển một theme v1 (đã gộp preset + custom) thành token v2.
 * Giá trị không an toàn được thay bằng giá trị tương ứng của `fallback` (token của preset gốc).
 */
export function legacyThemeToTokens(theme: ThemePreset, fallback?: ThemeTokens): ThemeTokens {
  const pick = (value: unknown, fb: string) => (isSafeColor(value) ? value.trim() : fb);
  const fbc = fallback?.colors;

  const gradient = parseLegacyGradient(theme.backgroundGradient);
  const layout = layoutOf(theme);
  const imageUrl =
    layout === "beacons-portrait" && isSafeImageUrl(theme.backgroundImage)
      ? theme.backgroundImage
      : undefined;

  return {
    layout,
    colors: {
      background: pick(theme.backgroundColor, fbc?.background ?? "#171919"),
      text: pick(theme.textColor, fbc?.text ?? "#CBD0D5"),
      accent: pick(theme.accentColor, fbc?.accent ?? "#3598db"),
      surface: pick(theme.cardBackground, fbc?.surface ?? "#6F7172"),
      surfaceText: pick(theme.cardTextColor, fbc?.surfaceText ?? "#CBD0D5"),
      surfaceBorder: pick(
        theme.cardBorderColor || theme.cardBackground,
        fbc?.surfaceBorder ?? "#6F7172"
      ),
    },
    background: {
      type: imageUrl ? "image" : gradient ? "gradient" : "solid",
      ...(gradient ? { gradient } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      effect: legacyEffect(theme),
    },
    typography: {
      bodyFont: legacyFont(theme.fontFamily),
      headingFont: legacyFont(theme.fontFamily),
      baseSize: 14,
      headingWeight: 700,
      textCase: "uppercase",
    },
    shape: {
      radius: (RADIUS_IDS as readonly string[]).includes(theme.borderRadius)
        ? theme.borderRadius
        : "full",
      borderWidth: 1.5,
      shadow: "sm",
    },
    button: { variant: theme.cardBackdropBlur ? "glass" : "filled" },
    spacing: { maxWidth: 620, density: "comfortable" },
  };
}

/** Token của các preset có sẵn (sinh từ THEME_PRESETS để chỉ có một nguồn định nghĩa). */
export const PRESET_TOKENS: Record<string, ThemeTokens> = Object.fromEntries(
  Object.entries(THEME_PRESETS).map(([key, preset]) => [key, legacyThemeToTokens(preset)])
);

export function mergeTokens(base: ThemeTokens, o: ThemeOverrides): ThemeTokens {
  return {
    layout: o.layout ?? base.layout,
    colors: { ...base.colors, ...o.colors },
    background: { ...base.background, ...o.background },
    typography: { ...base.typography, ...o.typography },
    shape: { ...base.shape, ...o.shape },
    button: { ...base.button, ...o.button },
    spacing: { ...base.spacing, ...o.spacing },
  };
}

export interface ThemeConfigInput {
  preset?: string;
  custom?: Partial<ThemePreset> | Record<string, unknown>;
  version?: number;
  overrides?: unknown;
}

/** Tính token cuối cùng cho một trang từ dữ liệu theme đã lưu (v1, v2 hoặc trống). */
export function resolveThemeTokens(config?: ThemeConfigInput | null): ThemeTokens {
  const presetKey = config?.preset && PRESET_TOKENS[config.preset] ? config.preset : "go-original";
  const base = PRESET_TOKENS[presetKey];
  let tokens = base;

  const custom = config?.custom as Partial<ThemePreset> | undefined;
  if (custom && Object.keys(custom).length > 0) {
    tokens = legacyThemeToTokens(resolveTheme({ preset: presetKey, custom }), base);
    // v1: preset có gradient thì "Màu nền trang" tuỳ chỉnh bị gradient che mất.
    // Khi người dùng đã chọn màu nền riêng (và không chọn gradient riêng) thì dùng nền đơn sắc.
    if (
      tokens.layout === "standard" &&
      isSafeColor(custom.backgroundColor) &&
      !custom.backgroundGradient
    ) {
      tokens = { ...tokens, background: { ...tokens.background, type: "solid", gradient: undefined } };
    }
  }

  if (config?.overrides) {
    const parsed = themeOverridesSchema.safeParse(config.overrides);
    if (parsed.success) tokens = mergeTokens(tokens, parsed.data);
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Token -> CSS
// ---------------------------------------------------------------------------

export function gradientToCss(g: GradientTokens): string {
  const stops = g.stops.map((s) => `${s.color} ${s.at}%`).join(", ");
  return g.kind === "linear"
    ? `linear-gradient(${g.angle}deg, ${stops})`
    : `radial-gradient(${g.shape} at ${g.x}% ${g.y}%, ${stops})`;
}

export function backgroundToCss(t: ThemeTokens): string {
  if (t.background.type === "gradient" && t.background.gradient) {
    return gradientToCss(t.background.gradient);
  }
  return t.colors.background;
}

/**
 * Biến CSS gắn ở phần tử gốc của trang. Component con dùng `var(--gp-*)`.
 */
export function themeToCssVars(t: ThemeTokens): CSSProperties {
  return {
    "--gp-bg": backgroundToCss(t),
    "--gp-text": t.colors.text,
    "--gp-accent": t.colors.accent,
    "--gp-surface": t.colors.surface,
    "--gp-surface-text": t.colors.surfaceText,
    "--gp-surface-border": t.colors.surfaceBorder,
    "--gp-radius": RADIUS_CSS[t.shape.radius],
    "--gp-border-w": `${t.shape.borderWidth}px`,
    "--gp-shadow": SHADOW_CSS[t.shape.shadow],
    "--gp-font-body": FONT_STACKS[t.typography.bodyFont],
    "--gp-font-heading": FONT_STACKS[t.typography.headingFont],
    "--gp-heading-weight": String(t.typography.headingWeight),
    "--gp-base-size": `${t.typography.baseSize}px`,
    "--gp-text-case": t.typography.textCase === "uppercase" ? "uppercase" : "none",
    "--gp-gap": `${DENSITY_GAP_PX[t.spacing.density]}px`,
    "--gp-max-w": `${t.spacing.maxWidth}px`,
  } as CSSProperties;
}

/** Style cho nút liên kết theo kiểu nút đã chọn (bố cục standard). */
export function buttonStyle(t: ThemeTokens): CSSProperties {
  const base: CSSProperties = {
    borderRadius: "var(--gp-radius)",
    borderWidth: "var(--gp-border-w)",
    borderStyle: "solid",
    boxShadow: "var(--gp-shadow)",
    textDecoration: "none",
  };
  switch (t.button.variant) {
    case "outline":
      return {
        ...base,
        backgroundColor: "transparent",
        color: "var(--gp-text)",
        borderColor: "var(--gp-surface-border)",
        boxShadow: "none",
      };
    case "soft":
      return {
        ...base,
        backgroundColor: "color-mix(in srgb, var(--gp-surface) 22%, transparent)",
        color: "var(--gp-text)",
        borderColor: "transparent",
      };
    case "glass":
      return {
        ...base,
        backgroundColor: "var(--gp-surface)",
        color: "var(--gp-surface-text)",
        borderColor: "var(--gp-surface-border)",
        boxShadow: GLASS_SHADOW,
      };
    default:
      return {
        ...base,
        backgroundColor: "var(--gp-surface)",
        color: "var(--gp-surface-text)",
        borderColor: "var(--gp-surface-border)",
      };
  }
}
