export interface ThemePreset {
  id: string;
  name: string;
  accentColor: string;
  backgroundColor: string;
  backgroundGradient?: string;
  textColor: string;
  cardBackground: string;
  cardTextColor: string;
  cardBorderColor?: string;
  borderRadius: "none" | "sm" | "md" | "full";
  fontFamily: "inter" | "be-vietnam-pro" | "montserrat";
}

export interface ColorSwatchItem {
  name: string;
  hex: string;
  textOnCard: string;
  borderHex: string;
}

export const PRIMARY_COLOR_PALETTE: ColorSwatchItem[] = [
  { name: "Royal Blue (Mặc định)", hex: "#2563eb", textOnCard: "#ffffff", borderHex: "#1d4ed8" },
  { name: "Sky Blue (Lnk.Bio)", hex: "#3598db", textOnCard: "#ffffff", borderHex: "#2980b9" },
  { name: "Ocean Cyan", hex: "#0284c7", textOnCard: "#ffffff", borderHex: "#0369a1" },
  { name: "Indigo", hex: "#4f46e5", textOnCard: "#ffffff", borderHex: "#4338ca" },
  { name: "Violet", hex: "#7c3aed", textOnCard: "#ffffff", borderHex: "#6d28d9" },
  { name: "Teal", hex: "#0d9488", textOnCard: "#ffffff", borderHex: "#0f766e" },
  { name: "Emerald Green", hex: "#10b981", textOnCard: "#ffffff", borderHex: "#059669" },
  { name: "Rose Pink", hex: "#e11d48", textOnCard: "#ffffff", borderHex: "#be123c" },
  { name: "Sunset Orange", hex: "#ea580c", textOnCard: "#ffffff", borderHex: "#c2410c" },
  { name: "Amber Gold", hex: "#d97706", textOnCard: "#ffffff", borderHex: "#b45309" },
  { name: "Gờ Coffee Brown", hex: "#78350f", textOnCard: "#ffffff", borderHex: "#451a03" },
  { name: "Charcoal Gray", hex: "#334155", textOnCard: "#ffffff", borderHex: "#1e293b" },
];

export const THEME_PRESETS: Record<string, ThemePreset> = {
  "go-original": {
    id: "go-original",
    name: "Gờ Light Blue (Trắng & Xanh Lnk.Bio)",
    accentColor: "#2563eb",
    backgroundColor: "#ffffff",
    textColor: "#0f172a",
    cardBackground: "#2563eb",
    cardTextColor: "#ffffff",
    cardBorderColor: "#1d4ed8",
    borderRadius: "full",
    fontFamily: "be-vietnam-pro",
  },
  "minimal-light": {
    id: "minimal-light",
    name: "Minimal White (Trắng Tinh Khôi)",
    accentColor: "#1d4ed8",
    backgroundColor: "#ffffff",
    textColor: "#0f172a",
    cardBackground: "#eff6ff",
    cardTextColor: "#1d4ed8",
    cardBorderColor: "#93c5fd",
    borderRadius: "full",
    fontFamily: "inter",
  },
  "modern-clean": {
    id: "modern-clean",
    name: "Ocean Blue (Viền Xanh Hiện Đại)",
    accentColor: "#2563eb",
    backgroundColor: "#f8fafc",
    textColor: "#1e3a8a",
    cardBackground: "#ffffff",
    cardTextColor: "#2563eb",
    cardBorderColor: "#3b82f6",
    borderRadius: "full",
    fontFamily: "inter",
  },
  "coffee-morning": {
    id: "coffee-morning",
    name: "Sky Breeze (Xanh Dịu Nhẹ)",
    accentColor: "#0284c7",
    backgroundColor: "#f0f9ff",
    textColor: "#0c4a6e",
    cardBackground: "#0284c7",
    cardTextColor: "#ffffff",
    cardBorderColor: "#0369a1",
    borderRadius: "full",
    fontFamily: "be-vietnam-pro",
  },
  "lnkbio-dark": {
    id: "lnkbio-dark",
    name: "Lnk.Bio Dark (Nguyên Bản Tối)",
    accentColor: "#3598db",
    backgroundColor: "#171919",
    textColor: "#cbd0d5",
    cardBackground: "#6f7172",
    cardTextColor: "#cbd0d5",
    cardBorderColor: "#6f7172",
    borderRadius: "full",
    fontFamily: "be-vietnam-pro",
  },
};

/**
 * Kết hợp mẫu giao diện gốc (preset) với các tuỳ chỉnh màu sắc/kiểu dáng riêng của người dùng (custom)
 */
export function resolveTheme(
  themeConfig?: {
    preset?: string;
    custom?: Partial<ThemePreset>;
  } | null
): ThemePreset {
  const presetKey = themeConfig?.preset || "go-original";
  const basePreset = THEME_PRESETS[presetKey] || THEME_PRESETS["go-original"];
  const custom = themeConfig?.custom;

  if (!custom) {
    return basePreset;
  }

  return {
    ...basePreset,
    ...(custom.accentColor ? { accentColor: custom.accentColor } : {}),
    ...(custom.backgroundColor ? { backgroundColor: custom.backgroundColor } : {}),
    ...(custom.textColor ? { textColor: custom.textColor } : {}),
    ...(custom.cardBackground ? { cardBackground: custom.cardBackground } : {}),
    ...(custom.cardTextColor ? { cardTextColor: custom.cardTextColor } : {}),
    ...(custom.cardBorderColor ? { cardBorderColor: custom.cardBorderColor } : {}),
    ...(custom.borderRadius ? { borderRadius: custom.borderRadius } : {}),
    ...(custom.fontFamily ? { fontFamily: custom.fontFamily } : {}),
  };
}

