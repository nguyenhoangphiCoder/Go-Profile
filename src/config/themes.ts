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
    name: "Gờ Light Blue (Trắng & Xanh)",
    backgroundColor: "#f8fafc",
    textColor: "#0f172a",
    cardBackground: "#ffffff",
    cardTextColor: "#1e40af",
    cardBorderColor: "#bfdbfe",
    borderRadius: "md",
    fontFamily: "be-vietnam-pro",
  },
  "minimal-light": {
    id: "minimal-light",
    name: "Minimal White (Trắng Tinh Khôi)",
    backgroundColor: "#ffffff",
    textColor: "#0f172a",
    cardBackground: "#f8fafc",
    cardTextColor: "#1e293b",
    cardBorderColor: "#e2e8f0",
    borderRadius: "md",
    fontFamily: "inter",
  },
  "modern-clean": {
    id: "modern-clean",
    name: "Ocean Blue (Xanh Hiện Đại)",
    backgroundColor: "#eff6ff",
    textColor: "#1e3a8a",
    cardBackground: "#ffffff",
    cardTextColor: "#1d4ed8",
    cardBorderColor: "#93c5fd",
    borderRadius: "full",
    fontFamily: "inter",
  },
  "coffee-morning": {
    id: "coffee-morning",
    name: "Sky Breeze (Xanh Dịu Nhẹ)",
    backgroundColor: "#f0f9ff",
    textColor: "#0c4a6e",
    cardBackground: "#ffffff",
    cardTextColor: "#0369a1",
    cardBorderColor: "#bae6fd",
    borderRadius: "md",
    fontFamily: "be-vietnam-pro",
  },
};
