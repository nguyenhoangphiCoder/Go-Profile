import type { ParsedBranchCsvRow } from "./types";

/**
 * Chuẩn hóa chuỗi tìm kiếm tiếng Việt không dấu, chữ thường.
 * VD: "320 Ấp Bắc, Tân Phú" -> "320 ap bac, tan phu"
 */
export function normalizeViSearch(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tự động tách tọa độ (lat, lng) từ các định dạng link Google Maps phổ biến:
 * - https://www.google.com/maps/place/.../@10.801234,106.641234,17z/...
 * - ...!3d10.801234!4d106.641234...
 * - https://maps.google.com/?q=10.801234,106.641234
 * - https://maps.google.com/?ll=10.801234,106.641234
 */
export function extractLatLngFromMapsUrl(url?: string | null): { lat: number; lng: number } | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|ll|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];

  for (const regex of patterns) {
    const m = trimmed.match(regex);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        return { lat, lng };
      }
    }
  }
  return null;
}

/** Tách một dòng CSV có hỗ trợ dấu ngoặc kép và dấu phẩy bên trong chuỗi. */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function toOptionalCoord(raw: string, min: number, max: number): number | null | "invalid" {
  const s = raw.trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < min || n > max) return "invalid";
  return n;
}

/**
 * Phân tích nội dung CSV/TSV danh sách chi nhánh để xem trước và báo lỗi từng dòng trước khi import.
 * Hỗ trợ tự động ánh xạ tên cột tiếng Việt hoặc tiếng Anh ở dòng tiêu đề.
 */
export function parseBranchesCsv(csvText: string): ParsedBranchCsvRow[] {
  const clean = csvText.replace(/^\uFEFF/, "").trim();
  if (!clean) return [];

  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  // Tự nhận dấu phân cách (phẩy, chấm phẩy hoặc tab khi copy từ Excel)
  const headerLine = lines[0];
  const delimiter = headerLine.includes("\t")
    ? "\t"
    : headerLine.split(";").length > headerLine.split(",").length
      ? ";"
      : ",";

  const headers = splitCsvLine(headerLine, delimiter).map((h) => normalizeViSearch(h));

  const findCol = (aliases: string[]) =>
    headers.findIndex((h) => aliases.some((a) => h === a || h.includes(a)));

  const idxCode = findCol(["code", "ma"]);
  const idxName = findCol(["name", "ten", "chi nhanh", "cua hang"]);
  const idxAddress = findCol(["address", "dia chi"]);
  const idxDistrict = findCol(["district", "quan", "huyen"]);
  const idxCity = findCol(["city", "thanh pho", "tinh"]);
  const idxPhone = findCol(["phone", "sdt", "dien thoai", "hotline"]);
  const idxHours = findCol(["hours", "gio", "mo cua"]);
  const idxMaps = findCol(["maps_url", "maps", "google map", "link"]);
  const idxLat = findCol(["lat", "vi do"]);
  const idxLng = findCol(["lng", "lon", "kinh do"]);

  const rows: ParsedBranchCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], delimiter);
    const get = (idx: number) => (idx >= 0 && idx < cols.length ? cols[idx].trim() : "");

    const name = get(idxName);
    const address = get(idxAddress);
    const district = get(idxDistrict);
    const city = get(idxCity) || "TP.HCM";
    const phone = get(idxPhone);
    const hours = get(idxHours);
    const mapsUrl = get(idxMaps);
    const code = get(idxCode);

    const parsedLat = idxLat >= 0 ? toOptionalCoord(get(idxLat), -90, 90) : null;
    const parsedLng = idxLng >= 0 ? toOptionalCoord(get(idxLng), -180, 180) : null;

    let lat: number | null = parsedLat === "invalid" ? null : parsedLat;
    let lng: number | null = parsedLng === "invalid" ? null : parsedLng;

    // Nếu thiếu lat/lng nhưng có link Google Maps -> tự tách tọa độ
    if ((lat === null || lng === null) && mapsUrl) {
      const extracted = extractLatLngFromMapsUrl(mapsUrl);
      if (extracted) {
        lat = extracted.lat;
        lng = extracted.lng;
      }
    }

    const errors: string[] = [];
    if (!name) errors.push("Thiếu tên chi nhánh");
    if (!address) errors.push("Thiếu địa chỉ");
    if (parsedLat === "invalid") errors.push("Vĩ độ (lat) không hợp lệ");
    if (parsedLng === "invalid") errors.push("Kinh độ (lng) không hợp lệ");

    rows.push({
      lineNumber: i + 1,
      code,
      name,
      address,
      district,
      city,
      phone,
      hours,
      mapsUrl,
      lat,
      lng,
      error: errors.length > 0 ? errors.join("; ") : undefined,
    });
  }

  return rows;
}
