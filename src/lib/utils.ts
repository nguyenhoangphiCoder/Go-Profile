import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Chỉ cho phép chuyển hướng tới đường dẫn nội bộ (bắt đầu bằng "/"), chặn open redirect
 * kiểu "https://evil.com", "//evil.com", "/\evil.com" hoặc "@evil.com".
 */
export function safeRedirectPath(value: unknown, fallback = "/admin"): string {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }
  for (const ch of path) {
    if (ch === "\\" || ch.charCodeAt(0) < 0x20) return fallback;
  }
  return path;
}
