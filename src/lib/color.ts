/**
 * Tiện ích màu: đọc mã màu, tính độ tương phản WCAG 2.1, gợi ý màu dễ đọc.
 * Kênh alpha (nếu có) được bỏ qua — coi như màu đặc.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseColor(input: string | null | undefined): Rgb | null {
  if (!input) return null;
  const v = input.trim().toLowerCase();

  const hex = v.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  const rgb = v.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgb) {
    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((n) => Math.min(255, Number(n)));
    return { r, g, b };
  }
  return null;
}

export function toHex({ r, g, b }: Rgb): string {
  const h = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Độ sáng tương đối theo WCAG 2.1. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const ch = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** Tỉ lệ tương phản (1..21). Trả về null nếu không đọc được màu. */
export function contrastRatio(a: string, b: string): number | null {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return null;
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

/**
 * Gợi ý màu chữ đạt tỉ lệ `minRatio` trên nền `background`, giữ sắc độ gần với `color` nhất:
 * pha dần `color` về trắng hoặc đen (hướng nào đạt được ít thay đổi hơn).
 */
export function suggestReadableColor(color: string, background: string, minRatio = 4.5): string {
  const c = parseColor(color);
  const bg = parseColor(background);
  if (!c || !bg) return color;
  if ((contrastRatio(color, background) ?? 0) >= minRatio) return toHex(c);

  const targets: Rgb[] = [
    { r: 255, g: 255, b: 255 },
    { r: 0, g: 0, b: 0 },
  ];
  let best: { hex: string; t: number } | null = null;
  for (const target of targets) {
    for (let t = 0.05; t <= 1.0001; t += 0.05) {
      const hex = toHex(mix(c, target, t));
      if ((contrastRatio(hex, background) ?? 0) >= minRatio) {
        if (!best || t < best.t) best = { hex, t };
        break;
      }
    }
  }
  return best?.hex ?? (relativeLuminance(bg) > 0.5 ? "#000000" : "#ffffff");
}

/** Màu chữ đen hoặc trắng dễ đọc hơn trên nền đã cho. */
export function readableOn(background: string): string {
  const bg = parseColor(background);
  if (!bg) return "#ffffff";
  return (contrastRatio("#ffffff", background) ?? 0) >= (contrastRatio("#000000", background) ?? 0)
    ? "#ffffff"
    : "#000000";
}

function saturation({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === min) return 0;
  const l = (max + min) / 2;
  return l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
}

/**
 * Gom màu điểm ảnh (dạng mảng RGBA) thành tối đa `count` màu chủ đạo, khác biệt nhau rõ ràng.
 * Tách riêng khỏi phần đọc ảnh để test được.
 */
export function dominantColors(pixels: ArrayLike<number>, count = 6): string[] {
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const key = `${r >> 4},${g >> 4},${b >> 4}`;
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.n++;
    buckets.set(key, bucket);
  }

  const sorted = [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .map((x) => ({ r: x.r / x.n, g: x.g / x.n, b: x.b / x.n }));

  const picked: Rgb[] = [];
  for (const c of sorted) {
    const distinct = picked.every(
      (p) => Math.abs(p.r - c.r) + Math.abs(p.g - c.g) + Math.abs(p.b - c.b) > 90
    );
    if (distinct) picked.push(c);
    if (picked.length >= count) break;
  }
  return picked.map(toHex);
}

export interface SuggestedScheme {
  background: string;
  text: string;
  accent: string;
  surface: string;
  surfaceText: string;
  surfaceBorder: string;
}

/** Dựng bộ màu trang từ bảng màu trích từ ảnh: nền tối nhất, nhấn/nút là màu rực nhất. */
export function schemeFromPalette(palette: string[]): SuggestedScheme | null {
  const colors = palette.map((hex) => ({ hex, rgb: parseColor(hex)! })).filter((c) => c.rgb);
  if (colors.length === 0) return null;

  const byLum = [...colors].sort((a, b) => relativeLuminance(a.rgb) - relativeLuminance(b.rgb));
  const darkest = byLum[0].hex;
  const background = toHex(mix(parseColor(darkest)!, { r: 0, g: 0, b: 0 }, 0.35));
  const vivid = [...colors].sort((a, b) => saturation(b.rgb) - saturation(a.rgb))[0].hex;

  const accent = suggestReadableColor(vivid, background, 3);
  const surface = vivid;
  return {
    background,
    text: suggestReadableColor(byLum[byLum.length - 1].hex, background, 7),
    accent,
    surface,
    surfaceText: readableOn(surface),
    surfaceBorder: surface,
  };
}

/**
 * Đọc ảnh (cùng origin hoặc có CORS) và trích màu chủ đạo. Chỉ chạy trên trình duyệt.
 * Ném lỗi nếu ảnh không tải được hoặc bị chặn CORS.
 */
export async function extractPaletteFromImage(url: string, count = 6): Promise<string[]> {
  const img = new window.Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Không tải được ảnh"));
    img.src = url;
  });

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ canvas");
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  return dominantColors(data, count);
}
