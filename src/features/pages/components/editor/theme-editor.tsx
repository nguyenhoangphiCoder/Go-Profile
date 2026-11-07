"use client";

import { useState } from "react";
import { Check, Palette, RotateCcw, Sparkles } from "lucide-react";
import {
  THEME_PRESETS,
  PRIMARY_COLOR_PALETTE,
  resolveTheme,
  type ThemePreset,
} from "@/config/themes";
import type { PageThemeConfig } from "../../types";

interface ThemeEditorProps {
  themeConfig: PageThemeConfig;
  onChange: (newTheme: PageThemeConfig) => void;
}

interface ColorInputFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (hex: string) => void;
}

function normalizeHexForPicker(val: string, fallback = "#2563eb"): string {
  const clean = val.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean;
  if (/^#[0-9a-fA-F]{3}$/.test(clean)) {
    const r = clean[1];
    const g = clean[2];
    const b = clean[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

function ColorInputField({ label, description, value, onChange }: ColorInputFieldProps) {
  const pickerValue = normalizeHexForPicker(value);

  return (
    <div className="p-3 rounded-xl border border-border bg-card/60 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="text-xs font-semibold block text-foreground">{label}</span>
        {description && (
          <span className="text-[11px] text-muted-foreground block truncate">{description}</span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Native Color Picker Swatch */}
        <label className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 shadow-2xs cursor-pointer shrink-0">
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <span
            className="block w-full h-full"
            style={{ backgroundColor: value || pickerValue }}
          />
        </label>

        {/* Hex Text Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#2563eb"
          maxLength={9}
          className="w-24 px-2.5 py-1.5 text-xs font-mono uppercase rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>
    </div>
  );
}

export function ThemeEditor({ themeConfig, onChange }: ThemeEditorProps) {
  const currentPresetKey = themeConfig.preset || "go-original";
  const resolvedTheme = resolveTheme(themeConfig);
  const [syncButtonsWithPrimary, setSyncButtonsWithPrimary] = useState(true);

  const hasCustomOverrides = Boolean(
    themeConfig.custom && Object.keys(themeConfig.custom).length > 0
  );

  // Chọn mẫu có sẵn (reset custom để áp dụng đúng màu mẫu, người dùng có thể chỉnh tiếp ngay bên dưới)
  const handleSelectPreset = (presetKey: string) => {
    onChange({
      preset: presetKey,
      custom: {},
    });
  };

  // Cập nhật một hoặc nhiều thuộc tính custom
  const updateCustomTheme = (patch: Partial<ThemePreset>) => {
    onChange({
      preset: currentPresetKey,
      custom: {
        ...(themeConfig.custom || {}),
        ...patch,
      },
    });
  };

  // Khi người dùng chọn/nhập Màu chủ đạo Bio
  const handlePrimaryColorChange = (
    hex: string,
    swatchMeta?: { textOnCard?: string; borderHex?: string }
  ) => {
    if (syncButtonsWithPrimary) {
      updateCustomTheme({
        accentColor: hex,
        cardBackground: hex,
        cardBorderColor: swatchMeta?.borderHex || hex,
        cardTextColor: swatchMeta?.textOnCard || "#ffffff",
      });
    } else {
      updateCustomTheme({
        accentColor: hex,
      });
    }
  };

  const handleResetCustom = () => {
    onChange({
      preset: currentPresetKey,
      custom: {},
    });
  };

  return (
    <div className="space-y-7">
      {/* PHẦN 1: MÀU CHỦ ĐẠO BIO (NHẬP MÃ MÀU HOẶC CHỌN TỪ BẢNG MÀU) */}
      <div className="p-4 sm:p-5 rounded-2xl border border-primary/25 bg-primary/[0.03] space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Màu chủ đạo Bio (Tự nhập mã màu hoặc chọn từ bảng màu)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Áp dụng cho chữ điểm nhấn Bio, số điện thoại, email, biểu tượng và nút liên kết
              </p>
            </div>
          </div>

          {hasCustomOverrides && (
            <button
              type="button"
              onClick={handleResetCustom}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              title="Khôi phục về màu mặc định của mẫu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Mặc định
            </button>
          )}
        </div>

        {/* Ô nhập mã màu HEX + Color Picker trực tiếp cho Màu chủ đạo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-background border border-border shadow-2xs">
          <div className="flex items-center gap-3">
            <label
              className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-primary/30 shadow-sm cursor-pointer shrink-0 group"
              title="Nhấn để mở bảng pha màu tự do"
            >
              <input
                type="color"
                value={normalizeHexForPicker(resolvedTheme.accentColor)}
                onChange={(e) => handlePrimaryColorChange(e.target.value)}
                className="sr-only"
              />
              <span
                className="block w-full h-full transition-transform group-hover:scale-105"
                style={{ backgroundColor: resolvedTheme.accentColor }}
              />
            </label>
            <div>
              <span className="text-xs font-bold block">Nhập mã màu HEX hoặc nhấn ô màu</span>
              <span className="text-[11px] text-muted-foreground">
                Ví dụ: <code className="font-mono text-primary">#2563EB</code>,{" "}
                <code className="font-mono text-primary">#3598DB</code>,{" "}
                <code className="font-mono text-primary">#78350F</code>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={resolvedTheme.accentColor}
              onChange={(e) => handlePrimaryColorChange(e.target.value)}
              placeholder="#2563eb"
              maxLength={9}
              className="w-28 px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {/* Tuỳ chọn đồng bộ màu chủ đạo với nút liên kết */}
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={syncButtonsWithPrimary}
            onChange={(e) => setSyncButtonsWithPrimary(e.target.checked)}
            className="rounded border-slate-300 text-primary focus:ring-primary/30 w-3.5 h-3.5"
          />
          <span>Đồng bộ màu chủ đạo này cho cả màu nền nút liên kết (Buttons)</span>
        </label>

        {/* Bảng màu gợi ý (Swatches) */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground block">
            Bảng màu chủ đạo gợi ý:
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            {PRIMARY_COLOR_PALETTE.map((swatch) => {
              const isSelected =
                resolvedTheme.accentColor.toLowerCase() === swatch.hex.toLowerCase();

              return (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() =>
                    handlePrimaryColorChange(swatch.hex, {
                      textOnCard: swatch.textOnCard,
                      borderHex: swatch.borderHex,
                    })
                  }
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30 font-semibold"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                  title={`${swatch.name} (${swatch.hex})`}
                >
                  <span
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center border border-black/10 shadow-2xs"
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                  </span>
                  <span className="text-[11px] font-mono uppercase truncate">{swatch.hex}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PHẦN 2: TUỲ CHỈNH CHI TIẾT TỪNG VÙNG MÀU & KIỂU DÁNG */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold">Tuỳ chỉnh chi tiết từng vùng màu</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ColorInputField
            label="Màu nhấn Bio (Accent)"
            description="Chữ in nghiêng *...*, SĐT, Email"
            value={resolvedTheme.accentColor}
            onChange={(hex) => updateCustomTheme({ accentColor: hex })}
          />
          <ColorInputField
            label="Màu nền trang"
            description="Nền tổng thể của trang Bio"
            value={resolvedTheme.backgroundColor}
            onChange={(hex) => updateCustomTheme({ backgroundColor: hex })}
          />
          <ColorInputField
            label="Màu chữ chính"
            description="Tên hồ sơ, tiêu đề & đoạn văn"
            value={resolvedTheme.textColor}
            onChange={(hex) => updateCustomTheme({ textColor: hex })}
          />
          <ColorInputField
            label="Màu nền nút liên kết"
            description="Nền các thẻ nút bấm (Link Buttons)"
            value={resolvedTheme.cardBackground}
            onChange={(hex) => updateCustomTheme({ cardBackground: hex })}
          />
          <ColorInputField
            label="Màu chữ trên nút"
            description="Chữ hiển thị bên trong nút liên kết"
            value={resolvedTheme.cardTextColor}
            onChange={(hex) => updateCustomTheme({ cardTextColor: hex })}
          />
          <ColorInputField
            label="Màu viền nút liên kết"
            description="Đường viền bao quanh nút liên kết"
            value={resolvedTheme.cardBorderColor || resolvedTheme.cardBackground}
            onChange={(hex) => updateCustomTheme({ cardBorderColor: hex })}
          />
        </div>

        {/* Kiểu bo góc & Font chữ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl border border-border bg-card/60 space-y-1.5">
            <label className="text-xs font-semibold block">Kiểu bo góc nút liên kết</label>
            <select
              value={resolvedTheme.borderRadius}
              onChange={(e) =>
                updateCustomTheme({
                  borderRadius: e.target.value as ThemePreset["borderRadius"],
                })
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="full">Bo tròn viên thuốc Lnk.Bio (Full Pill)</option>
              <option value="md">Bo góc vừa (Medium)</option>
              <option value="sm">Bo góc nhẹ (Small)</option>
              <option value="none">Vuông góc (Square)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl border border-border bg-card/60 space-y-1.5">
            <label className="text-xs font-semibold block">Font chữ hiển thị</label>
            <select
              value={resolvedTheme.fontFamily}
              onChange={(e) =>
                updateCustomTheme({
                  fontFamily: e.target.value as ThemePreset["fontFamily"],
                })
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="be-vietnam-pro">Be Vietnam Pro (Hiện đại, rõ nét)</option>
              <option value="inter">Inter (Tối giản, chuẩn quốc tế)</option>
            </select>
          </div>
        </div>
      </div>

      {/* PHẦN 3: MẪU GIAO DIỆN CÓ SẴN (PRESETS) */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div>
          <h3 className="text-sm font-bold">Mẫu phối màu nhanh (Theme Presets)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chọn một mẫu nền tảng bên dưới, sau đó bạn có thể tự do đổi màu ở trên
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
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                    <div
                      className="w-16 h-2 rounded-full opacity-70"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                  </div>
                  {/* Simulated Link Card */}
                  <div
                    className="w-full py-1.5 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-center border truncate shadow-xs"
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
                      Màu chủ đạo: {preset.accentColor}
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
    </div>
  );
}

