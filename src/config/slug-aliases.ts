/**
 * Alias cố định (đường dẫn cũ đã in trên QR / chia sẻ) -> slug chính.
 * Dùng chung cho proxy (chuyển hướng 308 trước khi render) và trang /[slug].
 */
export const SLUG_ALIASES: Record<string, string> = {
  "gocafe.official": "gocafe",
  "gocafe-official": "gocafe",
  "hophuonganh.gocafe": "hophuonganh-gocafe",
  "gogang.official": "gogang",
  gogang: "gogang",
};

export function resolveLookupSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  return SLUG_ALIASES[normalized] || normalized;
}
