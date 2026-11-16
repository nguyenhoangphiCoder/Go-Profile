/**
 * Nhận diện và dựng URL nhúng an toàn cho video / bản đồ.
 * Chỉ chấp nhận domain trong whitelist; ID video được tách và kiểm tra định dạng, URL nhúng
 * luôn do hệ thống tự dựng (không bao giờ nhúng nguyên URL người dùng nhập).
 */

export interface VideoEmbed {
  provider: "youtube" | "tiktok";
  id: string;
  embedUrl: string;
  aspect: "16/9" | "9/16";
}

function parseUrl(input: unknown): URL | null {
  if (typeof input !== "string" || input.length > 500) return null;
  try {
    const url = new URL(input.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const TIKTOK_ID = /^\d{10,25}$/;

export function parseVideoUrl(input: unknown): VideoEmbed | null {
  const url = parseUrl(input);
  if (!url) return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");

  let ytId: string | null = null;
  if (host === "youtu.be") {
    ytId = url.pathname.slice(1).split("/")[0];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") ytId = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/);
      if (m) ytId = m[1];
    }
  }
  if (ytId && YT_ID.test(ytId)) {
    const isShort = url.pathname.startsWith("/shorts/");
    return {
      provider: "youtube",
      id: ytId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0`,
      aspect: isShort ? "9/16" : "16/9",
    };
  }

  if (host === "tiktok.com") {
    const m = url.pathname.match(/\/video\/(\d+)/);
    if (m && TIKTOK_ID.test(m[1])) {
      return {
        provider: "tiktok",
        id: m[1],
        embedUrl: `https://www.tiktok.com/player/v1/${m[1]}?rel=0`,
        aspect: "9/16",
      };
    }
  }
  return null;
}

const MAPS_HOSTS = new Set([
  "google.com",
  "google.com.vn",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
]);

/** Link Google Maps người dùng dán vào (chỉ https và domain Google Maps). */
export function isSafeMapsUrl(input: unknown): boolean {
  const url = parseUrl(input);
  if (!url || url.protocol !== "https:") return false;
  const host = url.hostname.replace(/^www\./, "");
  if (!MAPS_HOSTS.has(host)) return false;
  if (host === "goo.gl") return url.pathname.startsWith("/maps");
  if (host === "google.com" || host === "google.com.vn") return url.pathname.startsWith("/maps");
  return true;
}

export function mapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Bản đồ nhúng không cần API key, dựng từ địa chỉ (đã encode). */
export function mapsEmbedUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}
