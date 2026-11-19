/**
 * Chuyển đường dẫn object trong bucket `public_media` thành URL đầy đủ.
 * URL tuyệt đối (http/https) và đường dẫn tĩnh (/...) được giữ nguyên.
 */
export function resolveMediaUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return "";
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("/")
  ) {
    return pathOrUrl;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/public_media/${pathOrUrl}`;
}

/**
 * Kiểm tra URL ảnh có nằm trong whitelist tối ưu của Next.js Image (ảnh nội bộ `/...` hoặc
 * Supabase Storage public) và không phải SVG/GIF động hay không.
 */
export function isOptimizableImageUrl(src?: string | null): boolean {
  if (!src) return false;
  const clean = src.split("?")[0]?.toLowerCase() ?? "";
  if (clean.endsWith(".svg") || clean.endsWith(".gif")) return false;
  if (src.startsWith("/")) return true;
  return /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//i.test(src);
}
