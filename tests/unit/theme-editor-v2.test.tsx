import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  contrastRatio,
  dominantColors,
  readableOn,
  schemeFromPalette,
  suggestReadableColor,
} from "@/lib/color";
import {
  PRESET_TOKENS,
  diffTokens,
  resolveThemeTokens,
  themeTokensSchema,
  toV2Config,
} from "@/config/theme-tokens";
import { themePresetConfigSchema, saveThemePresetSchema } from "@/features/theme-presets/schemas";
import { useUndoHistory } from "@/features/pages/components/editor/use-undo-history";

describe("độ tương phản WCAG", () => {
  it("đen trên trắng là 21:1, cùng màu là 1:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#3598db", "#3598db")).toBeCloseTo(1, 5);
    expect(contrastRatio("không phải màu", "#fff")).toBeNull();
  });

  it("gợi ý màu đạt ngưỡng yêu cầu", () => {
    const fixed = suggestReadableColor("#777777", "#808080", 4.5);
    expect(contrastRatio(fixed, "#808080")!).toBeGreaterThanOrEqual(4.5);
    // Màu đã đạt thì giữ nguyên
    expect(suggestReadableColor("#ffffff", "#000000")).toBe("#ffffff");
  });

  it("readableOn chọn đen/trắng phù hợp", () => {
    expect(readableOn("#fde047")).toBe("#000000");
    expect(readableOn("#1e1b4b")).toBe("#ffffff");
  });
});

describe("trích bảng màu", () => {
  it("gom điểm ảnh thành các màu chủ đạo khác biệt, bỏ điểm trong suốt", () => {
    const px: number[] = [];
    for (let i = 0; i < 60; i++) px.push(200, 30, 30, 255); // đỏ
    for (let i = 0; i < 30; i++) px.push(20, 20, 20, 255); // đen
    for (let i = 0; i < 90; i++) px.push(0, 255, 0, 0); // trong suốt
    const colors = dominantColors(px, 5);
    expect(colors).toEqual(["#c81e1e", "#141414"]);
  });

  it("dựng bộ màu dễ đọc từ bảng màu", () => {
    const s = schemeFromPalette(["#c81e1e", "#141414", "#f5f5f5"])!;
    expect(contrastRatio(s.text, s.background)!).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(s.surfaceText, s.surface)!).toBeGreaterThanOrEqual(4.5);
    expect(schemeFromPalette([])).toBeNull();
  });
});

describe("chuyển cấu hình sang v2", () => {
  it("mẫu mới đều sinh token hợp lệ", () => {
    for (const key of ["minimal-light", "modern-clean", "vibrant-contrast"]) {
      expect(themeTokensSchema.safeParse(PRESET_TOKENS[key]).success).toBe(true);
    }
    expect(PRESET_TOKENS["vibrant-contrast"].typography.bodyFont).toBe("montserrat");
  });

  it("diffTokens chỉ ghi các trường thay đổi", () => {
    const base = PRESET_TOKENS["go-original"];
    const next = { ...base, colors: { ...base.colors, accent: "#ff0000" } };
    expect(diffTokens(base, next)).toEqual({ colors: { accent: "#ff0000" } });
    expect(diffTokens(base, base)).toEqual({});
  });

  it("toV2Config gộp custom v1 vào overrides mà không đổi giao diện", () => {
    const v1 = {
      preset: "go-original",
      custom: { accentColor: "#ff0000", borderRadius: "sm" as const, backgroundColor: "#222222" },
    };
    const v2 = toV2Config(v1);
    expect(v2.version).toBe(2);
    expect(v2).not.toHaveProperty("custom");
    expect(resolveThemeTokens(v2)).toEqual(resolveThemeTokens(v1));
  });

  it("toV2Config giữ nguyên overrides v2 hiện có", () => {
    const cfg = { preset: "minimal-light", version: 2, overrides: { spacing: { density: "spacious" as const } } };
    expect(resolveThemeTokens(toV2Config(cfg))).toEqual(resolveThemeTokens(cfg));
  });
});

describe("schema mẫu giao diện đã lưu", () => {
  it("chấp nhận cấu hình v2 hợp lệ", () => {
    const res = saveThemePresetSchema.safeParse({
      name: " Gờ Giáng Sinh ",
      config: { preset: "go-original", version: 2, overrides: { colors: { accent: "#dc2626" } } },
    });
    expect(res.success).toBe(true);
    expect(res.data!.name).toBe("Gờ Giáng Sinh");
  });

  it("chặn preset lạ, tên rỗng và trường thừa", () => {
    expect(themePresetConfigSchema.safeParse({ preset: "hack", version: 2, overrides: {} }).success).toBe(false);
    expect(
      themePresetConfigSchema.safeParse({ preset: "go-original", version: 2, overrides: {}, custom: {} }).success
    ).toBe(false);
    expect(
      saveThemePresetSchema.safeParse({
        name: "   ",
        config: { preset: "go-original", version: 2, overrides: {} },
      }).success
    ).toBe(false);
  });
});

describe("useUndoHistory", () => {
  it("gom thay đổi liên tiếp, hoàn tác và làm lại", () => {
    vi.useFakeTimers();
    const apply = vi.fn();
    const { result, rerender } = renderHook(({ s }) => useUndoHistory(s, apply, { debounceMs: 300 }), {
      initialProps: { s: { v: 0 } },
    });

    const s1 = { v: 1 };
    rerender({ s: s1 });
    rerender({ s: { v: 2 } }); // trong khoảng debounce → gom thành 1 bước
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(apply).toHaveBeenLastCalledWith({ v: 0 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    // Component áp dụng snapshot → hook không ghi thêm bước mới
    rerender({ s: { v: 0 } });
    act(() => result.current.redo());
    expect(apply).toHaveBeenLastCalledWith({ v: 2 });
    vi.useRealTimers();
  });

  it("thay đổi mới sau khi hoàn tác xoá nhánh làm lại", () => {
    vi.useFakeTimers();
    const apply = vi.fn();
    const { result, rerender } = renderHook(({ s }) => useUndoHistory(s, apply, { debounceMs: 100 }), {
      initialProps: { s: { v: 0 } },
    });
    rerender({ s: { v: 1 } });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => result.current.undo());
    rerender({ s: { v: 0 } });
    rerender({ s: { v: 5 } });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.canRedo).toBe(false);
    expect(result.current.canUndo).toBe(true);
    vi.useRealTimers();
  });
});
