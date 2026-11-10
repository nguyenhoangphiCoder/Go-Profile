export interface ThemePreset {
  id: string;
  name: string;
  accentColor: string;
  backgroundColor: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  backgroundBlur?: boolean | string;
  backgroundVariant?: "glass" | "frosted-dark" | "frosted-warm" | "frosted-light" | "default";
  textColor: string;
  cardBackground: string;
  cardTextColor: string;
  cardBorderColor?: string;
  cardBackdropBlur?: boolean;
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
  { name: "Trắng Chuẩn Beacons", hex: "#fefefe", textOnCard: "#fefefe", borderHex: "#fefefe" },
  { name: "Gờ Dark Card", hex: "#313030", textOnCard: "#fefefe", borderHex: "#fefefe" },
  { name: "Gờ Ambient Gray", hex: "#565656", textOnCard: "#fefefe", borderHex: "#fefefe" },
  { name: "Gờ Coffee Brown", hex: "#78350f", textOnCard: "#ffffff", borderHex: "#451a03" },
  { name: "Royal Blue", hex: "#2563eb", textOnCard: "#ffffff", borderHex: "#1d4ed8" },
  { name: "Sky Blue", hex: "#3598db", textOnCard: "#ffffff", borderHex: "#2980b9" },
  { name: "Ocean Cyan", hex: "#0284c7", textOnCard: "#ffffff", borderHex: "#0369a1" },
  { name: "Teal", hex: "#0d9488", textOnCard: "#ffffff", borderHex: "#0f766e" },
  { name: "Emerald Green", hex: "#10b981", textOnCard: "#ffffff", borderHex: "#059669" },
  { name: "Amber Gold", hex: "#d97706", textOnCard: "#ffffff", borderHex: "#b45309" },
  { name: "Sunset Orange", hex: "#ea580c", textOnCard: "#ffffff", borderHex: "#c2410c" },
  { name: "Charcoal Gray", hex: "#334155", textOnCard: "#ffffff", borderHex: "#1e293b" },
];

export const THEME_PRESETS: Record<string, ThemePreset> = {
  "go-original": {
    id: "go-original",
    name: "Gờ Dark Gradient (Chuẩn Lnk.Bio Hồ Phượng Ánh)",
    accentColor: "#3598db",
    backgroundColor: "#171919",
    backgroundGradient:
      "linear-gradient(180deg, #111213 0%, #161819 25%, #232628 65%, #303336 100%)",
    textColor: "#CBD0D5",
    cardBackground: "#6F7172",
    cardTextColor: "#CBD0D5",
    cardBorderColor: "#6F7172",
    borderRadius: "full",
    fontFamily: "be-vietnam-pro",
  },
  "beacons-dark-card": {
    id: "beacons-dark-card",
    name: "Gờ Beacons Dark Card (Chuẩn beacons.ai/gocafe.official)",
    accentColor: "#3598db",
    backgroundColor: "#5d6166",
    backgroundGradient:
      "radial-gradient(ellipse at 50% 30%, #7e8388 0%, #606469 45%, #464a4e 80%, #303336 100%)",
    textColor: "#ffffff",
    cardBackground: "#111213",
    cardTextColor: "#ffffff",
    cardBorderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: "md",
    fontFamily: "be-vietnam-pro",
  },
  "beacons-portrait-card": {
    id: "beacons-portrait-card",
    name: "Gờ Beacons Portrait Card (Chuẩn beacons.ai/gogang)",
    accentColor: "#fefefe",
    backgroundColor: "#101010",
    backgroundImage: "/gogang-bg-source.png",
    textColor: "#fefefe",
    cardBackground: "#101010",
    cardTextColor: "#fefefe",
    cardBorderColor: "#fefefe",
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
    ...(custom.backgroundGradient ? { backgroundGradient: custom.backgroundGradient } : {}),
    ...(custom.backgroundImage ? { backgroundImage: custom.backgroundImage } : {}),
    ...(custom.backgroundBlur !== undefined ? { backgroundBlur: custom.backgroundBlur } : {}),
    ...(custom.backgroundVariant ? { backgroundVariant: custom.backgroundVariant } : {}),
    ...(custom.textColor ? { textColor: custom.textColor } : {}),
    ...(custom.cardBackground ? { cardBackground: custom.cardBackground } : {}),
    ...(custom.cardTextColor ? { cardTextColor: custom.cardTextColor } : {}),
    ...(custom.cardBorderColor ? { cardBorderColor: custom.cardBorderColor } : {}),
    ...(custom.cardBackdropBlur !== undefined ? { cardBackdropBlur: custom.cardBackdropBlur } : {}),
    ...(custom.borderRadius ? { borderRadius: custom.borderRadius } : {}),
    ...(custom.fontFamily ? { fontFamily: custom.fontFamily } : {}),
  };
}
