import type { DatePresetKey } from "./types";

export const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Lấy chuỗi ngày YYYY-MM-DD theo múi giờ Việt Nam (UTC+7) từ Date object.
 */
export function getVietnamDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // en-CA xuất định dạng YYYY-MM-DD
}

/**
 * Chuyển đổi ngày YYYY-MM-DD theo giờ Việt Nam sang mốc thời gian UTC (ISO string).
 * Bắt đầu ngày lúc 00:00:00 +07:00 tương ứng 17:00:00 UTC của ngày hôm trước.
 */
export function vietnamDayStartToUtc(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  // 00:00:00 VN (+07:00) = (17:00:00 ngày hôm trước) UTC
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 7 * 60 * 60 * 1000);
  return utcDate.toISOString();
}

/**
 * Chuyển đổi ngày YYYY-MM-DD theo giờ Việt Nam sang mốc kết thúc nửa mở [from, to).
 * Mốc kết thúc của ngày D là 00:00:00 +07:00 của ngày D+1 (tương ứng 17:00:00 UTC ngày D).
 */
export function vietnamDayEndToUtc(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  // 00:00:00 VN của ngày hôm sau (+07:00)
  const utcDate = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0) - 7 * 60 * 60 * 1000);
  return utcDate.toISOString();
}

/**
 * Tính toán khoảng UTC [from, to) cho một khoảng ngày [startDateStr, endDateStr] theo giờ Việt Nam.
 */
export function vietnamDateRangeToUtc(
  startDateStr: string,
  endDateStr: string
): { from: string; to: string } {
  return {
    from: vietnamDayStartToUtc(startDateStr),
    to: vietnamDayEndToUtc(endDateStr),
  };
}

/**
 * Lấy khoảng ngày [startDateStr, endDateStr] cho các preset thường dùng theo múi giờ Việt Nam.
 */
export function getPresetDateStrings(
  preset: DatePresetKey,
  referenceDate: Date = new Date()
): { startDate: string; endDate: string } {
  const todayStr = getVietnamDateString(referenceDate);
  const [year, month, day] = todayStr.split("-").map(Number);

  switch (preset) {
    case "today":
      return { startDate: todayStr, endDate: todayStr };

    case "last7days": {
      // 6 ngày trước + hôm nay = 7 ngày
      const startRef = new Date(Date.UTC(year, month - 1, day - 6));
      const startYear = startRef.getUTCFullYear();
      const startMonth = String(startRef.getUTCMonth() + 1).padStart(2, "0");
      const startDay = String(startRef.getUTCDate()).padStart(2, "0");
      return {
        startDate: `${startYear}-${startMonth}-${startDay}`,
        endDate: todayStr,
      };
    }

    case "last30days": {
      // 29 ngày trước + hôm nay = 30 ngày
      const startRef = new Date(Date.UTC(year, month - 1, day - 29));
      const startYear = startRef.getUTCFullYear();
      const startMonth = String(startRef.getUTCMonth() + 1).padStart(2, "0");
      const startDay = String(startRef.getUTCDate()).padStart(2, "0");
      return {
        startDate: `${startYear}-${startMonth}-${startDay}`,
        endDate: todayStr,
      };
    }

    case "thisMonth": {
      const monthStartStr = `${year}-${String(month).padStart(2, "0")}-01`;
      return {
        startDate: monthStartStr,
        endDate: todayStr,
      };
    }

    case "custom":
    default:
      return { startDate: todayStr, endDate: todayStr };
  }
}

/**
 * Định dạng chuỗi ngày YYYY-MM-DD sang DD/MM/YYYY để hiển thị thân thiện với người dùng Việt Nam.
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Định dạng mốc thời gian ISO sang chuỗi ngày giờ tiếng Việt: DD/MM/YYYY HH:mm.
 */
export function formatVietnamDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: VIETNAM_TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return isoString;
  }
}
