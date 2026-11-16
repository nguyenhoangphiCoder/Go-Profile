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
