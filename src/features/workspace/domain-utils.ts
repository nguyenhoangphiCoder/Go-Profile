const DOMAIN_REGEX =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

const IPV4_REGEX = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/**
 * Chuẩn hóa chuỗi tên miền hoặc HTTP Host header về dạng chữ thường thuần:
 * - Bỏ protocol (http://, https://), đường dẫn (/...), khoảng trắng, dấu chấm cuối và :port.
 * - Trả về null nếu là localhost, IPv4 hoặc không đúng định dạng tên miền hợp lệ.
 */
export function normalizeDomainHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim().toLowerCase();
  if (!value) return null;

  // Lấy host đầu tiên nếu x-forwarded-host chứa nhiều giá trị ngăn cách bằng dấu phẩy
  if (value.includes(",")) {
    value = value.split(",")[0]?.trim() ?? "";
  }

  value = value.replace(/^https?:\/\//, "");
  value = value.split("/")[0] ?? "";
  value = value.split("?")[0] ?? "";
  value = value.split("#")[0] ?? "";
  value = value.replace(/:\d+$/, "");
  value = value.replace(/\.+$/, "");

  if (!value || value === "localhost" || value.endsWith(".localhost") || IPV4_REGEX.test(value)) {
    return null;
  }
  if (value.length < 3 || value.length > 253) return null;
  if (!DOMAIN_REGEX.test(value)) return null;

  return value;
}

/**
 * Trả về danh sách tên miền ứng viên để tra cứu trong workspace_domains
 * (ưu tiên đúng host gửi lên, sau đó fallback giữa có/không có tiền tố www.).
 */
export function getDomainLookupCandidates(rawHost: string | null | undefined): string[] {
  const normalized = normalizeDomainHost(rawHost);
  if (!normalized) return [];
  if (normalized.startsWith("www.")) {
    const bare = normalized.slice(4);
    return bare && DOMAIN_REGEX.test(bare) ? [normalized, bare] : [normalized];
  }
  return [normalized, `www.${normalized}`];
}
