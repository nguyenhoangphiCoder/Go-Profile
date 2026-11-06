export interface ThemePreset {
  id: string;
  name: string;
  backgroundColor: string;
  backgroundGradient?: string;
  textColor: string;
  cardBackground: string;
  cardTextColor: string;
  cardBorderColor?: string;
  borderRadius: "none" | "sm" | "md" | "full";
  fontFamily: "inter" | "be-vietnam-pro" | "montserrat";
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  "go-original": {
    id: "go-original",
    name: "Gờ Original (Warm Dark)",
    backgroundColor: "#181411",
    textColor: "#f7f2ed",
    cardBackground: "#2b231d",
    cardTextColor: "#ffffff",
    cardBorderColor: "#42362d",
    borderRadius: "md",
    fontFamily: "be-vietnam-pro",
  },
  "minimal-light": {
    id: "minimal-light",
    name: "Minimal Light",
    backgroundColor: "#f9fafb",
    textColor: "#111827",
    cardBackground: "#ffffff",
    cardTextColor: "#1f2937",
    cardBorderColor: "#e5e7eb",
    borderRadius: "md",
    fontFamily: "inter",
  },
  "modern-clean": {
    id: "modern-clean",
    name: "Modern Clean",
    backgroundColor: "#0f172a",
    textColor: "#f8fafc",
    cardBackground: "#1e293b",
    cardTextColor: "#f1f5f9",
    cardBorderColor: "#334155",
    borderRadius: "full",
    fontFamily: "inter",
  },
  "coffee-morning": {
    id: "coffee-morning",
    name: "Coffee Morning (Warm Light)",
    backgroundColor: "#fcf8f2",
    textColor: "#3d2b1f",
    cardBackground: "#ffffff",
    cardTextColor: "#2e1f14",
    cardBorderColor: "#ebd9c6",
    borderRadius: "md",
    fontFamily: "be-vietnam-pro",
  },
};
