export type CropAspectKey = "1:1" | "4:5" | "4:3" | "16:9" | "2:1" | "original";

export interface CropAspectOption {
  key: CropAspectKey;
  label: string;
  /** Tỉ lệ width / height; null khi giữ tỉ lệ gốc của ảnh. */
  ratio: number | null;
}

export const CROP_ASPECT_OPTIONS: readonly CropAspectOption[] = [
  { key: "1:1", label: "1:1 Vuông", ratio: 1 },
  { key: "4:5", label: "4:5 Dọc", ratio: 4 / 5 },
  { key: "4:3", label: "4:3", ratio: 4 / 3 },
  { key: "16:9", label: "16:9", ratio: 16 / 9 },
  { key: "2:1", label: "2:1 Banner", ratio: 2 },
  { key: "original", label: "Tỉ lệ gốc", ratio: null },
] as const;

export type AspectHint = "circle" | "banner" | "standard";

/** Chọn tỉ lệ cắt mặc định dựa trên loại khung ảnh. */
export function defaultAspectForHint(hint: AspectHint = "standard"): CropAspectKey {
  if (hint === "circle") return "1:1";
  if (hint === "banner") return "2:1";
  return "1:1";
}

/** Chỉ cắt các định dạng ảnh raster tĩnh (bỏ qua GIF động và SVG vector). */
export function isCroppableMimeType(mimeType: string): boolean {
  return mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp";
}

/** Kiểm tra URL có vẻ là GIF/SVG không nên cắt bằng canvas. */
export function isCroppableUrl(url: string): boolean {
  const clean = url.split("?")[0]?.toLowerCase() ?? "";
  return !clean.endsWith(".gif") && !clean.endsWith(".svg");
}

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Tính kích thước hiển thị (px) của khung cắt vừa khít trong vùng sân khấu (maxW x maxH)
 * theo tỉ lệ aspectRatio (width / height).
 */
export function computeCropBoxSize(aspectRatio: number, maxW: number, maxH: number): Size {
  const safeRatio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1;
  if (maxW / maxH > safeRatio) {
    const height = Math.round(maxH);
    const width = Math.round(height * safeRatio);
    return { width, height };
  }
  const width = Math.round(maxW);
  const height = Math.round(width / safeRatio);
  return { width, height };
}

/**
 * Tỉ lệ thu phóng cơ sở (zoom = 1) để ảnh phủ kín hoàn toàn khung cắt (object-cover).
 */
export function computeCoverScale(natural: Size, cropBox: Size): number {
  if (natural.width <= 0 || natural.height <= 0) return 1;
  return Math.max(cropBox.width / natural.width, cropBox.height / natural.height);
}

/**
 * Giới hạn tọa độ dịch chuyển (offsetX, offsetY) sao cho ảnh không bao giờ hở viền khung cắt.
 */
export function clampCropOffset(offset: Point, natural: Size, cropBox: Size, zoom: number): Point {
  const baseScale = computeCoverScale(natural, cropBox);
  const effectiveScale = baseScale * Math.max(1, zoom);
  const displayW = natural.width * effectiveScale;
  const displayH = natural.height * effectiveScale;

  const maxX = Math.max(0, (displayW - cropBox.width) / 2);
  const maxY = Math.max(0, (displayH - cropBox.height) / 2);

  const clampedX = Math.min(maxX, Math.max(-maxX, offset.x));
  const clampedY = Math.min(maxY, Math.max(-maxY, offset.y));

  return {
    x: clampedX === 0 ? 0 : clampedX,
    y: clampedY === 0 ? 0 : clampedY,
  };
}

/**
 * Chuyển trạng thái (offset, zoom) trên giao diện sang vùng cắt chính xác (pixel) trên ảnh gốc.
 */
export function computeSourceCropRect(
  natural: Size,
  cropBox: Size,
  offset: Point,
  zoom: number
): CropRect {
  const safeZoom = Math.max(1, zoom);
  const baseScale = computeCoverScale(natural, cropBox);
  const effectiveScale = baseScale * safeZoom;
  const clamped = clampCropOffset(offset, natural, cropBox, safeZoom);

  const displayW = natural.width * effectiveScale;
  const displayH = natural.height * effectiveScale;

  const srcW = Math.min(natural.width, cropBox.width / effectiveScale);
  const srcH = Math.min(natural.height, cropBox.height / effectiveScale);
  const rawX = ((displayW - cropBox.width) / 2 - clamped.x) / effectiveScale;
  const rawY = ((displayH - cropBox.height) / 2 - clamped.y) / effectiveScale;

  const x = Math.max(0, Math.min(natural.width - srcW, rawX));
  const y = Math.max(0, Math.min(natural.height - srcH, rawY));

  return { x, y, width: srcW, height: srcH };
}

/**
 * Giữ nguyên tâm vùng đang nhìn khi người dùng thay đổi mức zoom.
 */
export function adjustOffsetForZoom(
  offset: Point,
  oldZoom: number,
  newZoom: number,
  natural: Size,
  cropBox: Size
): Point {
  const ratio = oldZoom > 0 ? newZoom / oldZoom : 1;
  return clampCropOffset({ x: offset.x * ratio, y: offset.y * ratio }, natural, cropBox, newZoom);
}

/** Tạo tên file sạch sau khi cắt. */
export function buildCroppedFilename(
  originalName: string | null | undefined,
  mimeType: string
): string {
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const base = (originalName || "image")
    .replace(/\.[^/.]+$/, "")
    .replace(/-cropped$/i, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  return `${base || "image"}-cropped.${ext}`;
}

export interface ExportCroppedImageOptions {
  image: HTMLImageElement;
  cropBox: Size;
  offset: Point;
  zoom: number;
  maxOutputDimension?: number;
  preferredMimeType?: string;
  originalFilename?: string | null;
  quality?: number;
}

/**
 * Vẽ vùng đã cắt lên canvas ở độ phân giải sắc nét và xuất ra đối tượng File để tải lên.
 */
export async function exportCroppedImageFile({
  image,
  cropBox,
  offset,
  zoom,
  maxOutputDimension = 1440,
  preferredMimeType,
  originalFilename,
  quality = 0.92,
}: ExportCroppedImageOptions): Promise<File> {
  const natural: Size = {
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
  const rect = computeSourceCropRect(natural, cropBox, offset, zoom);

  const longestSide = Math.max(rect.width, rect.height);
  const scaleDown = longestSide > maxOutputDimension ? maxOutputDimension / longestSide : 1;
  const outWidth = Math.max(1, Math.round(rect.width * scaleDown));
  const outHeight = Math.max(1, Math.round(rect.height * scaleDown));

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Trình duyệt không hỗ trợ xử lý ảnh (Canvas 2D).");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, outWidth, outHeight);

  const outputMime =
    preferredMimeType === "image/png"
      ? "image/png"
      : preferredMimeType === "image/webp"
        ? "image/webp"
        : "image/jpeg";

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputMime, outputMime === "image/png" ? undefined : quality);
  });

  if (!blob) {
    throw new Error("Không thể xuất ảnh đã cắt. Vui lòng thử lại.");
  }

  const finalMime = blob.type || outputMime;
  const filename = buildCroppedFilename(originalFilename, finalMime);
  return new File([blob], filename, { type: finalMime });
}
