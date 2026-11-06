export const RESERVED_SLUGS = [
  "admin",
  "api",
  "login",
  "logout",
  "auth",
  "r",
  "static",
  "_next",
  "dashboard",
  "settings",
  "assets",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
] as const;

export function isReservedSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  return (RESERVED_SLUGS as readonly string[]).includes(normalized);
}

