import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { clientEnv } from "@/lib/env.client";
import { isReservedSlug } from "@/config/reserved-slugs";
import { resolveLookupSlug } from "@/config/slug-aliases";
import type { Database } from "@/types/database.generated";

/**
 * Kiểm tra trang công khai /{slug} TRƯỚC khi render.
 *
 * Với Cache Components, khung trang được gửi ngay với mã 200 nên notFound()/redirect() trong
 * page không còn đổi được mã HTTP (thành soft 404 và chuyển hướng phía trình duyệt). Proxy chạy
 * trước khi render, nên trả được 404 và 308 thật — quan trọng cho SEO và mã QR đã in.
 *
 * Lỗi mạng / database: trả về null để trang tự xử lý như cũ (không chặn khách).
 */

const SLUG_REGEX = /^[a-z0-9]+([.-][a-z0-9]+)*$/;

// File tĩnh trong public/ (không thuộc danh sách loại trừ của matcher) không phải trang công khai
const STATIC_FILE =
  /.(?:ico|txt|xml|json|webmanifest|pdf|mp4|webm|mp3|woff2?|ttf|js|css|map|avif)$/i;

type GateResult = { kind: "found" } | { kind: "missing" } | { kind: "alias"; canonical: string };

// Bộ nhớ đệm ngắn hạn theo từng instance: trang có thật giữ 60 giây, trang không tồn tại
// chỉ 10 giây để trang vừa xuất bản không bị báo 404 lâu.
const FOUND_TTL_MS = 60_000;
const MISSING_TTL_MS = 10_000;
const MAX_CACHE_ENTRIES = 500;
const cache = new Map<string, { result: GateResult; expires: number }>();

export function clearSlugGateCache() {
  cache.clear();
}

function readCache(slug: string): GateResult | null {
  const hit = cache.get(slug);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    cache.delete(slug);
    return null;
  }
  return hit.result;
}

function writeCache(slug: string, result: GateResult) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  const ttl = result.kind === "missing" ? MISSING_TTL_MS : FOUND_TTL_MS;
  cache.set(slug, { result, expires: Date.now() + ttl });
}

/** Lấy slug từ đường dẫn một cấp (/abc). Trả null nếu không phải đường dẫn trang công khai. */
export function extractPublicSlug(pathname: string): string | null {
  const m = pathname.match(/^\/([^/]+)\/?$/);
  if (!m) return null;
  let raw: string;
  try {
    raw = decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
  if (isReservedSlug(raw) || STATIC_FILE.test(raw)) return null;
  return raw;
}

async function lookup(slug: string): Promise<GateResult | null> {
  const cached = readCache(slug);
  if (cached) return cached;

  const supabase = createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await supabase.rpc("get_public_page", { p_slug: slug });
  if (error || !data) return null;

  const page = data as { found?: boolean; is_alias?: boolean; canonical_slug?: string };
  const result: GateResult = !page.found
    ? { kind: "missing" }
    : page.is_alias && page.canonical_slug
      ? { kind: "alias", canonical: page.canonical_slug }
      : { kind: "found" };
  writeCache(slug, result);
  return result;
}

function notFoundResponse(request: NextRequest) {
  // Trang /_not-found được dựng tĩnh lúc build → render giao diện 404 với mã 404 thật
  return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
}

function redirectTo(request: NextRequest, slug: string) {
  const url = request.nextUrl.clone();
  url.pathname = `/${slug}`;
  return NextResponse.redirect(url, 308);
}

export async function gatePublicSlug(request: NextRequest): Promise<NextResponse | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const raw = extractPublicSlug(request.nextUrl.pathname);
  if (raw === null) return null;

  const normalized = raw.trim().toLowerCase();
  const lookupSlug = resolveLookupSlug(normalized);

  // Alias cố định trong code (gocafe.official -> gocafe...) và slug viết hoa: chuyển hướng ngay
  if (lookupSlug !== raw && SLUG_REGEX.test(lookupSlug)) {
    return redirectTo(request, lookupSlug);
  }
  if (lookupSlug.length > 80 || !SLUG_REGEX.test(lookupSlug)) {
    return notFoundResponse(request);
  }

  let result: GateResult | null;
  try {
    result = await lookup(lookupSlug);
  } catch {
    result = null;
  }
  if (!result) return null;
  if (result.kind === "missing") return notFoundResponse(request);
  if (result.kind === "alias") return redirectTo(request, result.canonical);
  return null;
}
