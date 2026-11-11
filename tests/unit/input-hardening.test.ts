import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/utils";
import { isValidDateString } from "@/features/reports/timezone";

describe("safeRedirectPath (chống open redirect)", () => {
  it.each(["/admin", "/admin/pages?x=1", "/admin/reports#top"])(
    "cho phép đường dẫn nội bộ %s",
    (p) => {
      expect(safeRedirectPath(p)).toBe(p);
    }
  );

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "@evil.example",
    "javascript:alert(1)",
    "/admin\n",
    "",
    null,
    undefined,
    123,
  ])("chặn %s và trả về fallback", (p) => {
    expect(safeRedirectPath(p, "/admin")).toBe("/admin");
  });
});

describe("isValidDateString (bộ lọc báo cáo)", () => {
  it.each(["2026-11-11", "2024-02-29", "2026-01-01"])("ngày hợp lệ %s", (d) => {
    expect(isValidDateString(d)).toBe(true);
  });

  it.each(["abc", "", "2026-13-45", "2026-02-31", "2025-02-29", "26-11-11", "1900-01-01", null])(
    "ngày không hợp lệ %s",
    (d) => {
      expect(isValidDateString(d)).toBe(false);
    }
  );
});
