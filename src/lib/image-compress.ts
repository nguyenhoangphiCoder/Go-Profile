/**
 * Tự động nén ảnh (JPG/PNG/WebP) sang WebP nhẹ (< 1920px, quality 0.84) ở phía trình duyệt
 * trước khi tải lên Kho hình ảnh, giúp Landing Page tải nhanh trên 4G và tiết kiệm Storage.
 */
export async function compressImageToWebp(
  file: File,
  options?: { maxDimension?: number; quality?: number; minBytesToCompress?: number }
): Promise<File> {
  const maxDim = options?.maxDimension ?? 1920;
  const quality = options?.quality ?? 0.84;
  const minBytes = options?.minBytesToCompress ?? 180 * 1024; // Bỏ qua ảnh đã nhỏ < 180KB

  if (typeof window === "undefined" || typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  if (file.size < minBytes && file.type === "image/webp") return file;

  try {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = objectUrl;
      });

      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      if (!origW || !origH) return file;

      const scale = Math.min(1, maxDim / Math.max(origW, origH));
      const targetW = Math.max(1, Math.round(origW * scale));
      const targetH = Math.max(1, Math.round(origH * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;

      ctx.drawImage(img, 0, 0, targetW, targetH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/webp", quality)
      );
      if (!blob || blob.size >= file.size) return file;

      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      return new File([blob], `${baseName}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return file;
  }
}
