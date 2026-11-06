const KNOWN_BOT_PATTERNS = [
  "googlebot",
  "bingbot",
  "yandexbot",
  "baiduspider",
  "duckduckbot",
  "slurp",
  "facebot",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "pinterestbot",
  "applebot",
  "telegrambot",
  "whatsapp",
  "skypeuripreview",
  "slackbot",
  "discordbot",
  "semrushbot",
  "ahrefsbot",
  "mj12bot",
  "dotbot",
  "petalbot",
  "bytespider",
];

export function isBotUserAgent(userAgent?: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return KNOWN_BOT_PATTERNS.some((pattern) => ua.includes(pattern));
}

export function isPrefetchRequest(headers: Headers): boolean {
  const purpose = headers.get("purpose") || headers.get("sec-purpose") || headers.get("x-purpose");
  if (purpose && purpose.toLowerCase().includes("prefetch")) {
    return true;
  }
  if (purpose && purpose.toLowerCase().includes("preview")) {
    return true;
  }
  if (headers.get("x-moz")?.toLowerCase() === "prefetch") {
    return true;
  }
  return false;
}

export function shouldSkipClickTracking(
  method: string,
  headers: Headers,
  userAgent?: string | null
): boolean {
  // Bỏ qua nếu phương thức là HEAD
  if (method.toUpperCase() === "HEAD") {
    return true;
  }

  // Bỏ qua nếu là yêu cầu tải trước (prefetch/preview)
  if (isPrefetchRequest(headers)) {
    return true;
  }

  // Bỏ qua nếu là bot/crawler nhận dạng được
  if (isBotUserAgent(userAgent)) {
    return true;
  }

  return false;
}
