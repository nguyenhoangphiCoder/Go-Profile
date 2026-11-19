"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ImageIcon,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  Trash2,
  Wand2,
} from "lucide-react";
import { THEME_PRESETS, PRIMARY_COLOR_PALETTE } from "@/config/themes";
import {
  FONT_IDS,
  FONT_LABELS,
  PRESET_TOKENS,
  gradientToCss,
  isSafeColor,
  resolveThemeTokens,
  toV2Config,
  type GradientTokens,
  type ThemeOverrides,
  type ThemeTokens,
} from "@/config/theme-tokens";
import {
  contrastRatio,
  extractPaletteFromImage,
  readableOn,
  schemeFromPalette,
  suggestReadableColor,
} from "@/lib/color";
import { resolveMediaUrl } from "@/features/renderer/media";
import {
  archiveThemePresetAction,
  listThemePresetsAction,
  saveThemePresetAction,
} from "@/features/theme-presets/actions";
import type { SavedThemePreset } from "@/features/theme-presets/schemas";
import type { PageThemeConfig } from "../../types";

interface ThemeEditorProps {
  themeConfig: PageThemeConfig;
  onChange: (newTheme: PageThemeConfig) => void;
  /** Ảnh trong trang (avatar, banner, ảnh) dùng để gợi ý bảng màu. */
  imageUrls?: string[];
}

type Group = keyof Omit<ThemeOverrides, "layout">;

// ---------------------------------------------------------------------------
// Ô điều khiển dùng chung
// ---------------------------------------------------------------------------

function normalizeHexForPicker(val: string, fallback = "#2563eb"): string {
  const clean = val.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean;
  if (/^#[0-9a-fA-F]{8}$/.test(clean)) return clean.slice(0, 7);
  if (/^#[0-9a-fA-F]{3}$/.test(clean)) {
    const [, r, g, b] = clean;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

function ColorField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (color: string) => void;
}) {
  // Giữ chuỗi đang gõ cục bộ; chỉ báo lên khi là mã màu hợp lệ (tránh lưu "#12" dở dang)
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }
  const invalid = !isSafeColor(draft);

  return (
    <div className="p-3 rounded-xl border border-border bg-card/60 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="text-xs font-semibold block text-foreground">{label}</span>
        {description && (
          <span className="text-[11px] text-muted-foreground block truncate">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <label className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 shadow-2xs cursor-pointer shrink-0">
          <input
            type="color"
            value={normalizeHexForPicker(value)}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
            aria-label={label}
          />
          <span className="block w-full h-full" style={{ backgroundColor: value }} />
        </label>
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (isSafeColor(e.target.value)) onChange(e.target.value.trim());
          }}
          placeholder="#2563eb"
          maxLength={9}
          aria-invalid={invalid}
          className={`w-24 px-2.5 py-1.5 text-xs font-mono uppercase rounded-lg border bg-background focus:outline-none focus:ring-2 ${
            invalid
              ? "border-red-500 focus:ring-red-500/30"
              : "border-input focus:ring-primary/30 focus:border-primary"
          }`}
        />
      </div>
    </div>
  );
}

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold block">{label}</span>
      <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-border bg-muted/40">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={`flex-1 min-w-fit px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              value === o.value
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-xs font-semibold block">{label}</span>
      <select
        value={String(value)}
        onChange={(e) => {
          const picked = options.find((o) => String(o.value) === e.target.value);
          if (picked) onChange(picked.value);
        }}
        className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({
  title,
  description,
  onReset,
  canReset,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  onReset?: () => void;
  canReset?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-border bg-card/40">
      <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <span className="text-sm font-bold block">{title}</span>
          {description && (
            <span className="text-[11px] text-muted-foreground block truncate">{description}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canReset && onReset && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onReset();
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              title="Khôi phục nhóm này về mặc định của mẫu"
            >
              <RotateCcw className="w-3 h-3" />
              Mặc định
            </button>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </div>
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Kiểm tra độ tương phản
// ---------------------------------------------------------------------------

interface ContrastIssue {
  label: string;
  ratio: number;
  min: number;
  fix: () => void;
}

function backgroundSamples(t: ThemeTokens): string[] {
  if (t.background.type === "gradient" && t.background.gradient) {
    return t.background.gradient.stops.map((s) => s.color);
  }
  return [t.colors.background];
}

function worstAgainst(fg: string, backgrounds: string[]): { ratio: number; bg: string } {
  let worst = { ratio: Infinity, bg: backgrounds[0] };
  for (const bg of backgrounds) {
    const r = contrastRatio(fg, bg);
    if (r !== null && r < worst.ratio) worst = { ratio: r, bg };
  }
  return worst;
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

export function ThemeEditor({ themeConfig, onChange, imageUrls = [] }: ThemeEditorProps) {
  const presetKey =
    themeConfig.preset && THEME_PRESETS[themeConfig.preset] ? themeConfig.preset : "go-original";
  const tokens = useMemo(() => resolveThemeTokens(themeConfig), [themeConfig]);
  const v2 = useMemo(() => toV2Config(themeConfig), [themeConfig]);
  const isStandard = tokens.layout === "standard";
  const [syncButtons, setSyncButtons] = useState(true);

  const hasOverrides =
    Object.keys(v2.overrides).length > 0 ||
    Boolean(themeConfig.custom && Object.keys(themeConfig.custom).length > 0);

  // ---- Ghi thay đổi (luôn ở dạng v2) ----
  const writeOverrides = (overrides: ThemeOverrides) =>
    onChange({ preset: presetKey, version: 2, overrides });

  function update<G extends Group>(group: G, patch: NonNullable<ThemeOverrides[G]>) {
    writeOverrides({
      ...v2.overrides,
      [group]: { ...(v2.overrides[group] as object), ...(patch as object) },
    });
  }

  const resetGroup = (group: Group) => {
    const next = { ...v2.overrides };
    delete next[group];
    writeOverrides(next);
  };

  const setAccent = (hex: string, swatch?: { textOnCard?: string; borderHex?: string }) => {
    if (syncButtons && isStandard) {
      update("colors", {
        accent: hex,
        surface: hex,
        surfaceBorder: swatch?.borderHex || hex,
        surfaceText: swatch?.textOnCard || readableOn(hex),
      });
    } else {
      update("colors", { accent: hex });
    }
  };

  // ---- Độ tương phản ----
  const contrastIssues: ContrastIssue[] = useMemo(() => {
    if (!isStandard) return [];
    const issues: ContrastIssue[] = [];
    const bgs = backgroundSamples(tokens);

    const text = worstAgainst(tokens.colors.text, bgs);
    if (text.ratio < 4.5) {
      issues.push({
        label: "Chữ chính trên nền trang",
        ratio: text.ratio,
        min: 4.5,
        fix: () => update("colors", { text: suggestReadableColor(tokens.colors.text, text.bg) }),
      });
    }

    const accent = worstAgainst(tokens.colors.accent, bgs);
    if (accent.ratio < 3) {
      issues.push({
        label: "Màu nhấn (SĐT, email, chữ nghiêng) trên nền",
        ratio: accent.ratio,
        min: 3,
        fix: () =>
          update("colors", { accent: suggestReadableColor(tokens.colors.accent, accent.bg, 3) }),
      });
    }

    if (tokens.button.variant === "filled" || tokens.button.variant === "glass") {
      const r = contrastRatio(tokens.colors.surfaceText, tokens.colors.surface);
      if (r !== null && r < 4.5) {
        issues.push({
          label: "Chữ trên nút liên kết",
          ratio: r,
          min: 4.5,
          fix: () =>
            update("colors", {
              surfaceText: suggestReadableColor(tokens.colors.surfaceText, tokens.colors.surface),
            }),
        });
      }
    } else {
      const label = worstAgainst(tokens.colors.text, bgs);
      if (label.ratio < 4.5 && text.ratio >= 4.5) {
        issues.push({
          label: "Chữ trên nút (kiểu viền/nhạt)",
          ratio: label.ratio,
          min: 4.5,
          fix: () => update("colors", { text: suggestReadableColor(tokens.colors.text, label.bg) }),
        });
      }
    }
    return issues;
    // update đóng gói v2.overrides hiện tại, đã nằm trong tokens/themeConfig
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, isStandard]);

  // ---- Bảng màu từ ảnh ----
  const sourceImages = useMemo(
    () => [...new Set(imageUrls.map((u) => resolveMediaUrl(u)).filter(Boolean))].slice(0, 3),
    [imageUrls]
  );
  const [palette, setPalette] = useState<string[] | null>(null);
  const [paletteError, setPaletteError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtractPalette = async () => {
    setIsExtracting(true);
    setPaletteError(null);
    try {
      const all: string[] = [];
      for (const url of sourceImages) {
        try {
          all.push(...(await extractPaletteFromImage(url, 4)));
        } catch {
          // Ảnh lỗi/chặn CORS: bỏ qua, thử ảnh tiếp theo
        }
      }
      const unique = [...new Set(all)].slice(0, 8);
      if (unique.length === 0) {
        setPaletteError("Không đọc được màu từ ảnh (ảnh lỗi hoặc máy chủ ảnh chặn truy cập).");
      }
      setPalette(unique);
    } finally {
      setIsExtracting(false);
    }
  };

  const applySchemeFromPalette = () => {
    if (!palette) return;
    const scheme = schemeFromPalette(palette);
    if (!scheme) return;
    writeOverrides({
      ...v2.overrides,
      colors: { ...v2.overrides.colors, ...scheme },
      background: { ...v2.overrides.background, type: "solid" },
    });
  };

  // ---- Mẫu đã lưu ----
  const [savedPresets, setSavedPresets] = useState<SavedThemePreset[]>([]);
  const [presetsError, setPresetsError] = useState<string | null>(null);
  const [presetName, setPresetName] = useState("");
  const [isSavingPreset, startSavingPreset] = useTransition();

  useEffect(() => {
    let cancelled = false;
    listThemePresetsAction().then((res) => {
      if (cancelled) return;
      if (res.success) setSavedPresets(res.data);
      else setPresetsError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSavePreset = () => {
    startSavingPreset(async () => {
      const res = await saveThemePresetAction({ name: presetName, config: v2 });
      if (res.success) {
        setSavedPresets((list) => [res.data, ...list]);
        setPresetName("");
        setPresetsError(null);
      } else {
        setPresetsError(res.error);
      }
    });
  };

  const handleArchivePreset = (preset: SavedThemePreset) => {
    if (!window.confirm(`Xoá mẫu "${preset.name}"? Các trang đang dùng không bị ảnh hưởng.`))
      return;
    startSavingPreset(async () => {
      const res = await archiveThemePresetAction(preset.id);
      if (res.success) setSavedPresets((list) => list.filter((p) => p.id !== preset.id));
      else setPresetsError(res.error);
    });
  };

  // ---- Nền gradient ----
  const gradient: GradientTokens = tokens.background.gradient ?? {
    kind: "linear",
    angle: 180,
    shape: "ellipse",
    x: 50,
    y: 50,
    stops: [
      { color: tokens.colors.background, at: 0 },
      { color: tokens.colors.surface, at: 100 },
    ],
  };
  const setGradient = (patch: Partial<GradientTokens>) =>
    update("background", { type: "gradient", gradient: { ...gradient, ...patch } });

  const isOverridden = (group: Group) => Boolean(v2.overrides[group]);

  return (
    <div className="space-y-4">
      {/* MẪU GIAO DIỆN */}
      <Section
        title="Mẫu giao diện"
        description="Chọn điểm bắt đầu, sau đó tinh chỉnh ở các nhóm bên dưới"
        defaultOpen
        canReset={hasOverrides}
        onReset={() => writeOverrides({})}
      >
        <div className="grid grid-cols-2 gap-2.5">
          {Object.entries(THEME_PRESETS).map(([key, preset]) => {
            const t = PRESET_TOKENS[key];
            const selected = presetKey === key;
            const bg =
              t.background.type === "gradient" && t.background.gradient
                ? gradientToCss(t.background.gradient)
                : t.colors.background;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ preset: key, version: 2, overrides: {} })}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  selected
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-primary/50 bg-card"
                }`}
              >
                <div
                  className="w-full h-16 rounded-lg p-2 flex flex-col justify-end gap-1 mb-1.5 border border-black/10"
                  style={{ background: bg }}
                >
                  <div
                    className="w-1/2 h-1.5 rounded-full opacity-80"
                    style={{ backgroundColor: t.colors.text }}
                  />
                  <div
                    className="w-full h-4 rounded-full border"
                    style={{
                      backgroundColor: t.colors.surface,
                      borderColor: t.colors.surfaceBorder,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-semibold leading-tight line-clamp-2">
                    {preset.name}
                  </span>
                  {selected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Mẫu của tôi */}
        <div className="pt-2 space-y-2 border-t border-border">
          <span className="text-xs font-bold block">Mẫu của tôi</span>
          {savedPresets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {savedPresets.map((p) => (
                <div
                  key={p.id}
                  className="inline-flex items-center rounded-lg border border-border bg-background text-xs"
                >
                  <button
                    type="button"
                    onClick={() => onChange(p.config)}
                    className="px-2.5 py-1.5 font-medium hover:text-primary cursor-pointer"
                    title="Áp dụng mẫu này"
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchivePreset(p)}
                    className="px-1.5 py-1.5 text-muted-foreground hover:text-red-600 border-l border-border cursor-pointer"
                    aria-label={`Xoá mẫu ${p.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              maxLength={60}
              placeholder="Tên mẫu, ví dụ: Gờ Giáng Sinh"
              className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={handleSavePreset}
              disabled={isSavingPreset || presetName.trim().length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground disabled:opacity-50 cursor-pointer"
            >
              {isSavingPreset ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Lưu thành mẫu
            </button>
          </div>
          {presetsError && <p className="text-[11px] text-amber-600">{presetsError}</p>}
        </div>
      </Section>

      {!isStandard && (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-400">
          Mẫu Beacons dùng bố cục và màu cố định theo bản gốc. Ở mẫu này chỉ đổi được{" "}
          <strong>màu nhấn</strong> và <strong>font chữ</strong>. Chọn một mẫu khác để tuỳ biến đầy
          đủ.
        </div>
      )}

      {/* CẢNH BÁO TƯƠNG PHẢN */}
      {contrastIssues.length > 0 && (
        <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Một số màu khó đọc (chuẩn WCAG)
          </div>
          {contrastIssues.map((issue) => (
            <div key={issue.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0">
                {issue.label}:{" "}
                <span className="font-mono font-semibold">{issue.ratio.toFixed(1)}:1</span>{" "}
                <span className="text-muted-foreground">(cần ≥ {issue.min}:1)</span>
              </span>
              <button
                type="button"
                onClick={issue.fix}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-amber-500/40 hover:bg-amber-500/10 font-medium cursor-pointer"
              >
                <Wand2 className="w-3 h-3" />
                Sửa tự động
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MÀU SẮC */}
      <Section
        title="Màu sắc"
        description="Màu nhấn, nền, chữ và nút liên kết"
        defaultOpen
        canReset={isOverridden("colors")}
        onReset={() => resetGroup("colors")}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold">Màu chủ đạo gợi ý</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {PRIMARY_COLOR_PALETTE.map((swatch) => {
              const selected = tokens.colors.accent.toLowerCase() === swatch.hex.toLowerCase();
              return (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() =>
                    setAccent(swatch.hex, {
                      textOnCard: swatch.textOnCard,
                      borderHex: swatch.borderHex,
                    })
                  }
                  title={`${swatch.name} (${swatch.hex})`}
                  aria-label={`${swatch.name} (${swatch.hex})`}
                  className={`h-9 rounded-lg border flex items-center justify-center cursor-pointer ${
                    selected ? "ring-2 ring-primary border-primary" : "border-black/10"
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                >
                  {selected && (
                    <Check className="w-3.5 h-3.5" style={{ color: readableOn(swatch.hex) }} />
                  )}
                </button>
              );
            })}
          </div>
          {isStandard && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={syncButtons}
                onChange={(e) => setSyncButtons(e.target.checked)}
                className="rounded border-slate-300 w-3.5 h-3.5"
              />
              Đồng bộ màu chủ đạo cho nút liên kết
            </label>
          )}
        </div>

        {/* Gợi ý từ ảnh */}
        {sourceImages.length > 0 && (
          <div className="p-3 rounded-xl border border-dashed border-border space-y-2">
            <button
              type="button"
              onClick={handleExtractPalette}
              disabled={isExtracting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
            >
              {isExtracting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              Gợi ý màu từ ảnh đại diện / banner
            </button>
            {palette && palette.length > 0 && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {palette.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setAccent(hex)}
                      title={`Dùng ${hex} làm màu chủ đạo`}
                      className="w-8 h-8 rounded-lg border border-black/10 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                {isStandard && (
                  <button
                    type="button"
                    onClick={applySchemeFromPalette}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Tạo bộ màu tự động từ ảnh
                  </button>
                )}
              </>
            )}
            {paletteError && <p className="text-[11px] text-amber-600">{paletteError}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <ColorField
            label="Màu nhấn"
            description="Chữ nghiêng *...*, SĐT, email"
            value={tokens.colors.accent}
            onChange={(c) => update("colors", { accent: c })}
          />
          {isStandard && (
            <>
              <ColorField
                label="Màu nền trang"
                description="Dùng khi nền là màu đơn sắc"
                value={tokens.colors.background}
                onChange={(c) => update("colors", { background: c })}
              />
              <ColorField
                label="Màu chữ chính"
                description="Nội dung, đoạn văn, tiểu sử"
                value={tokens.colors.text}
                onChange={(c) => update("colors", { text: c })}
              />
              <ColorField
                label="Màu chữ tiêu đề"
                description="Tên trang, tiêu đề mục"
                value={tokens.colors.headingText || tokens.colors.text}
                onChange={(c) => update("colors", { headingText: c })}
              />
              <ColorField
                label="Màu nút liên kết"
                value={tokens.colors.surface}
                onChange={(c) => update("colors", { surface: c })}
              />
              <ColorField
                label="Màu chữ trên nút"
                value={tokens.colors.surfaceText}
                onChange={(c) => update("colors", { surfaceText: c })}
              />
              <ColorField
                label="Màu viền nút"
                value={tokens.colors.surfaceBorder}
                onChange={(c) => update("colors", { surfaceBorder: c })}
              />
            </>
          )}
        </div>
      </Section>

      {isStandard && (
        <>
          {/* NỀN */}
          <Section
            title="Nền trang"
            description="Màu đơn sắc, dải màu và hiệu ứng nền mờ"
            canReset={isOverridden("background")}
            onReset={() => resetGroup("background")}
          >
            <Segmented
              label="Kiểu nền"
              value={tokens.background.type === "gradient" ? "gradient" : "solid"}
              options={[
                { value: "solid", label: "Màu đơn sắc" },
                { value: "gradient", label: "Dải màu (gradient)" },
              ]}
              onChange={(v) =>
                v === "gradient" ? setGradient({}) : update("background", { type: "solid" })
              }
            />

            {tokens.background.type === "gradient" && (
              <div className="space-y-3 p-3 rounded-xl border border-border">
                <div
                  className="h-10 rounded-lg border border-black/10"
                  style={{ background: gradientToCss(gradient) }}
                />
                <Segmented
                  label="Dạng dải màu"
                  value={gradient.kind}
                  options={[
                    { value: "linear", label: "Thẳng" },
                    { value: "radial", label: "Toả tròn" },
                  ]}
                  onChange={(kind) => setGradient({ kind })}
                />
                {gradient.kind === "linear" && (
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold">Góc: {gradient.angle}°</span>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={15}
                      value={gradient.angle}
                      onChange={(e) => setGradient({ angle: Number(e.target.value) })}
                      className="w-full"
                    />
                  </label>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {gradient.stops.map((stop, i) => (
                    <ColorField
                      key={i}
                      label={`Màu ${i + 1}`}
                      description={`Vị trí ${stop.at}%`}
                      value={stop.color}
                      onChange={(c) =>
                        setGradient({
                          stops: gradient.stops.map((s, j) => (j === i ? { ...s, color: c } : s)),
                        })
                      }
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  {gradient.stops.length < 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        const last = gradient.stops[gradient.stops.length - 1];
                        const stops = [...gradient.stops, { color: last.color, at: 100 }].map(
                          (s, i, arr) => ({ ...s, at: Math.round((i / (arr.length - 1)) * 100) })
                        );
                        setGradient({ stops });
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] border border-border hover:bg-muted cursor-pointer"
                    >
                      + Thêm màu
                    </button>
                  )}
                  {gradient.stops.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const stops = gradient.stops.slice(0, -1).map((s, i, arr) => ({
                          ...s,
                          at: Math.round((i / (arr.length - 1)) * 100),
                        }));
                        setGradient({ stops });
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] border border-border hover:bg-muted cursor-pointer"
                    >
                      − Bớt màu
                    </button>
                  )}
                </div>
              </div>
            )}

            <SelectField
              label="Hiệu ứng nền"
              value={tokens.background.effect}
              options={[
                { value: "none", label: "Không" },
                { value: "ambient", label: "Quầng sáng mờ (xanh)" },
                { value: "frosted-warm", label: "Quầng sáng ấm (cà phê)" },
                { value: "frosted-light", label: "Quầng sáng nhạt (nền sáng)" },
              ]}
              onChange={(effect) => update("background", { effect })}
            />
          </Section>

          {/* NÚT & HÌNH KHỐI */}
          <Section
            title="Nút liên kết"
            description="Kiểu nút, bo góc, viền và bóng đổ"
            canReset={isOverridden("button") || isOverridden("shape")}
            onReset={() => {
              const next = { ...v2.overrides };
              delete next.button;
              delete next.shape;
              writeOverrides(next);
            }}
          >
            <div className="space-y-1.5">
              <span className="text-xs font-semibold block">Kiểu nút</span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["filled", "Đặc"],
                    ["outline", "Viền"],
                    ["soft", "Nhạt"],
                    ["glass", "Kính mờ"],
                  ] as const
                ).map(([variant, label]) => (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => update("button", { variant })}
                    aria-pressed={tokens.button.variant === variant}
                    className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                      tokens.button.variant === variant
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span
                      className="block w-full py-1.5 rounded-full border text-[10px] mb-1"
                      style={
                        variant === "outline"
                          ? {
                              borderColor: tokens.colors.surfaceBorder,
                              color: tokens.colors.surfaceText,
                              background: tokens.colors.background,
                            }
                          : variant === "soft"
                            ? {
                                borderColor: "transparent",
                                color: tokens.colors.surfaceText,
                                background: `color-mix(in srgb, ${tokens.colors.surface} 22%, ${tokens.colors.background})`,
                              }
                            : {
                                borderColor: tokens.colors.surfaceBorder,
                                color: tokens.colors.surfaceText,
                                background: tokens.colors.surface,
                              }
                      }
                    >
                      LIÊN KẾT
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block space-y-1">
                <span className="text-xs font-semibold block">
                  Chiều cao nút: {tokens.button.height}px
                </span>
                <input
                  type="range"
                  min={36}
                  max={80}
                  step={2}
                  value={tokens.button.height}
                  onChange={(e) => update("button", { height: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
              <div className="flex gap-1.5">
                {(
                  [
                    [44, "Mỏng (44px)"],
                    [54, "Vừa (54px)"],
                    [64, "Dày (64px)"],
                  ] as const
                ).map(([h, label]) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => update("button", { height: h })}
                    className={`flex-1 py-1 px-2 rounded-lg border text-[11px] font-medium cursor-pointer transition-colors ${
                      tokens.button.height === h
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Segmented
              label="Bo góc"
              value={tokens.shape.radius}
              options={[
                { value: "none", label: "Vuông" },
                { value: "sm", label: "Nhẹ" },
                { value: "md", label: "Vừa" },
                { value: "lg", label: "Lớn" },
                { value: "full", label: "Viên thuốc" },
              ]}
              onChange={(radius) => update("shape", { radius })}
            />
            <Segmented
              label="Độ dày viền"
              value={tokens.shape.borderWidth}
              options={[0, 1, 1.5, 2, 3].map((w) => ({
                value: w,
                label: w === 0 ? "Không" : `${w}px`,
              }))}
              onChange={(borderWidth) => update("shape", { borderWidth })}
            />
            <Segmented
              label="Bóng đổ"
              value={tokens.shape.shadow}
              options={[
                { value: "none", label: "Không" },
                { value: "sm", label: "Nhẹ" },
                { value: "md", label: "Vừa" },
                { value: "lg", label: "Đậm" },
              ]}
              onChange={(shadow) => update("shape", { shadow })}
            />
          </Section>

          {/* BỐ CỤC */}
          <Section
            title="Bố cục"
            description="Khoảng cách giữa các nút và độ rộng trang"
            canReset={isOverridden("spacing")}
            onReset={() => resetGroup("spacing")}
          >
            <Segmented
              label="Khoảng cách"
              value={tokens.spacing.density}
              options={[
                { value: "compact", label: "Gọn" },
                { value: "comfortable", label: "Vừa" },
                { value: "spacious", label: "Thoáng" },
              ]}
              onChange={(density) => update("spacing", { density })}
            />
            <Segmented
              label="Độ rộng tối đa (trên máy tính)"
              value={tokens.spacing.maxWidth}
              options={[480, 560, 620, 720].map((w) => ({ value: w, label: `${w}px` }))}
              onChange={(maxWidth) => update("spacing", { maxWidth })}
            />
          </Section>
        </>
      )}

      {/* CHỮ */}
      <Section
        title="Chữ"
        description="Font, cỡ chữ và kiểu tiêu đề"
        canReset={isOverridden("typography")}
        onReset={() => resetGroup("typography")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField
            label="Font nội dung"
            value={tokens.typography.bodyFont}
            options={FONT_IDS.map((id) => ({ value: id, label: FONT_LABELS[id] }))}
            onChange={(bodyFont) => update("typography", { bodyFont })}
          />
          {isStandard && (
            <SelectField
              label="Font tiêu đề"
              value={tokens.typography.headingFont}
              options={FONT_IDS.map((id) => ({ value: id, label: FONT_LABELS[id] }))}
              onChange={(headingFont) => update("typography", { headingFont })}
            />
          )}
        </div>
        {isStandard && (
          <>
            <label className="block space-y-1">
              <span className="text-xs font-semibold">
                Cỡ chữ nội dung: {tokens.typography.baseSize}px
              </span>
              <input
                type="range"
                min={12}
                max={18}
                step={1}
                value={tokens.typography.baseSize}
                onChange={(e) => update("typography", { baseSize: Number(e.target.value) })}
                className="w-full"
              />
            </label>
            <Segmented
              label="Độ đậm tiêu đề"
              value={tokens.typography.headingWeight}
              options={([500, 600, 700, 800] as const).map((w) => ({
                value: w,
                label: { 500: "Vừa", 600: "Hơi đậm", 700: "Đậm", 800: "Rất đậm" }[w],
              }))}
              onChange={(headingWeight) => update("typography", { headingWeight })}
            />
          </>
        )}
      </Section>
    </div>
  );
}
