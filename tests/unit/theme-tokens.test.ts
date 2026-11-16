import { describe, expect, it } from "vitest";
import {
  PRESET_TOKENS,
  gradientToCss,
  isSafeColor,
  isSafeImageUrl,
  parseLegacyGradient,
  resolveThemeTokens,
  themeOverridesSchema,
  themeToCssVars,
  themeTokensSchema,
} from "@/config/theme-tokens";
import { THEME_PRESETS } from "@/config/themes";
import { saveDraftSchema } from "@/features/pages/schemas";

describe("kiểm tra giá trị an toàn", () => {
  it.each(["#fff", "#3598db", "#3598db80", "rgba(255, 255, 255, 0.08)", "rgb(1,2,3)", "transparent"])(
    "chấp nhận màu %s",
    (c) => expect(isSafeColor(c)).toBe(true)
  );

  it.each([
    "red; background: url(https://evil)",
    "url(javascript:alert(1))",
    "#12",
    "var(--x)",
    "expression(alert(1))",
    "",
  ])("từ chối màu %s", (c) => expect(isSafeColor(c)).toBe(false));

  it("ảnh nền chỉ nhận đường dẫn tĩnh hoặc https sạch", () => {
    expect(isSafeImageUrl("/gogang-bg-source.png")).toBe(true);
    expect(isSafeImageUrl("https://abc.supabase.co/storage/v1/object/public/x.png")).toBe(true);
    expect(isSafeImageUrl("https://x.y/a.png) ; color:red")).toBe(false);
    expect(isSafeImageUrl("http://x.y/a.png")).toBe(false);
    expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("chuyển đổi gradient v1", () => {
  it("phân tích linear-gradient của preset go-original và dựng lại đúng chuỗi", () => {
    const css = THEME_PRESETS["go-original"].backgroundGradient!;
    const g = parseLegacyGradient(css)!;
    expect(g.kind).toBe("linear");
    expect(g.stops).toHaveLength(4);
    expect(gradientToCss(g)).toBe(css);
  });

  it("phân tích radial-gradient có vị trí", () => {
    const g = parseLegacyGradient(
      "radial-gradient(ellipse at 50% 30%, #7e8388 0%, #606469 45%, #303336 100%)"
    )!;
    expect(g).toMatchObject({ kind: "radial", shape: "ellipse", x: 50, y: 30 });
  });

  it("từ chối gradient chứa url() hoặc ký tự lạ", () => {
    expect(parseLegacyGradient("linear-gradient(180deg, url(x) 0%, #fff 100%)")).toBeNull();
    expect(parseLegacyGradient("url(https://evil)")).toBeNull();
  });
});

describe("resolveThemeTokens", () => {
  it("token của mọi preset đều hợp lệ theo schema", () => {
    for (const tokens of Object.values(PRESET_TOKENS)) {
      expect(themeTokensSchema.safeParse(tokens).success).toBe(true);
    }
  });

  it("theme rỗng hoặc preset lạ dùng go-original", () => {
    expect(resolveThemeTokens(null)).toEqual(PRESET_TOKENS["go-original"]);
    expect(resolveThemeTokens({ preset: "khong-ton-tai" })).toEqual(PRESET_TOKENS["go-original"]);
  });

  it("custom v1 được chuyển sang token", () => {
    const t = resolveThemeTokens({
      preset: "go-original",
      custom: { accentColor: "#ff0000", borderRadius: "sm", cardBackdropBlur: true },
    });
    expect(t.colors.accent).toBe("#ff0000");
    expect(t.shape.radius).toBe("sm");
    expect(t.button.variant).toBe("glass");
  });

  it("màu nền tuỳ chỉnh v1 thay gradient của preset bằng nền đơn sắc", () => {
    const t = resolveThemeTokens({ preset: "go-original", custom: { backgroundColor: "#222222" } });
    expect(t.background.type).toBe("solid");
    expect(themeToCssVars(t)).toMatchObject({ "--gp-bg": "#222222" });
  });

  it("giá trị v1 độc hại trong DB bị thay bằng giá trị preset", () => {
    const t = resolveThemeTokens({
      preset: "go-original",
      custom: { textColor: "red; background:url(https://evil)" },
    });
    expect(t.colors.text).toBe(PRESET_TOKENS["go-original"].colors.text);
  });

  it("overrides v2 được áp dụng sau custom v1", () => {
    const t = resolveThemeTokens({
      preset: "go-original",
      custom: { accentColor: "#ff0000" },
      version: 2,
      overrides: { colors: { accent: "#00ff00" }, button: { variant: "outline" } },
    });
    expect(t.colors.accent).toBe("#00ff00");
    expect(t.button.variant).toBe("outline");
    expect(t.colors.text).toBe(PRESET_TOKENS["go-original"].colors.text);
  });

  it("overrides v2 không hợp lệ bị bỏ qua", () => {
    const t = resolveThemeTokens({ preset: "go-original", overrides: { colors: { accent: "url(x)" } } });
    expect(t.colors.accent).toBe(PRESET_TOKENS["go-original"].colors.accent);
  });
});

describe("saveDraftSchema — theme", () => {
  const base = {
    pageId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    expectedDraftVersion: 1,
    title: "Trang",
    blocks: [],
  };

  it("bỏ giá trị v1 không hợp lệ thay vì làm hỏng lần lưu", () => {
    const res = saveDraftSchema.safeParse({
      ...base,
      theme: { preset: "go-original", custom: { accentColor: "#12", textColor: "#ffffff" } },
    });
    expect(res.success).toBe(true);
    expect(res.data!.theme.custom).toEqual({ textColor: "#ffffff" });
  });

  it("chặn overrides v2 chứa giá trị không hợp lệ hoặc trường lạ", () => {
    expect(
      themeOverridesSchema.safeParse({ colors: { accent: "url(x)" } }).success
    ).toBe(false);
    expect(themeOverridesSchema.safeParse({ customCss: "body{}" }).success).toBe(false);
    const res = saveDraftSchema.safeParse({
      ...base,
      theme: { preset: "go-original", version: 2, overrides: { shape: { radius: "huge" } } },
    });
    expect(res.success).toBe(false);
  });

  it("chấp nhận overrides v2 hợp lệ", () => {
    const res = saveDraftSchema.safeParse({
      ...base,
      theme: {
        preset: "go-original",
        version: 2,
        overrides: {
          typography: { bodyFont: "montserrat", baseSize: 15 },
          spacing: { density: "spacious" },
          background: {
            type: "gradient",
            gradient: {
              kind: "linear",
              angle: 135,
              shape: "ellipse",
              x: 50,
              y: 50,
              stops: [
                { color: "#111111", at: 0 },
                { color: "#333333", at: 100 },
              ],
            },
          },
        },
      },
    });
    expect(res.success).toBe(true);
  });
});
