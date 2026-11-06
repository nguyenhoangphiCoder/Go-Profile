"use client";

import { Check } from "lucide-react";
import { THEME_PRESETS, type ThemePreset } from "@/config/themes";
import type { PageThemeConfig } from "../../types";

interface ThemeEditorProps {
  themeConfig: PageThemeConfig;
  onChange: (newTheme: PageThemeConfig) => void;
}

export function ThemeEditor({ themeConfig, onChange }: ThemeEditorProps) {
  const currentPresetKey = themeConfig.preset || "go-original";

  const handleSelectPreset = (presetKey: string) => {
    onChange({
      preset: presetKey,
      custom: themeConfig.custom,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold">Mẫu giao diện (Themes)</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Chọn phong cách hiển thị màu sắc, thẻ liên kết và font chữ cho trang hồ sơ
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(THEME_PRESETS).map(([key, preset]: [string, ThemePreset]) => {
          const isSelected = currentPresetKey === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectPreset(key)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? "border-primary ring-2 ring-primary/40 shadow-md"
                  : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              {/* Theme Mini Card Preview */}
              <div
                className="w-full h-24 rounded-xl p-3 flex flex-col justify-between mb-3 border border-black/10 shadow-inner"
                style={{
                  backgroundColor: preset.backgroundColor,
                  color: preset.textColor,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="w-5 h-5 rounded-full bg-current opacity-30" />
                  <div className="w-12 h-2 rounded-full bg-current opacity-20" />
                </div>
                {/* Simulated Link Card */}
                <div
                  className="w-full py-1.5 px-2.5 rounded-lg text-[10px] font-semibold text-center border truncate shadow-xs"
                  style={{
                    backgroundColor: preset.cardBackground,
                    color: preset.cardTextColor,
                    borderColor: preset.cardBorderColor || "transparent",
                  }}
                >
                  Liên kết mẫu
                </div>
              </div>

              {/* Theme Name & Badge */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">{preset.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    Bo góc: {preset.borderRadius} • Font: {preset.fontFamily}
                  </span>
                </div>
                {isSelected && (
                  <div className="p-1 rounded-full bg-primary text-primary-foreground">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
