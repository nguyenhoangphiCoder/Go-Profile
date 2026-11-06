import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { isReservedSlug } from "@/config/reserved-slugs";

describe("Utils & Config", () => {
  it("cn merges class names properly", () => {
    expect(cn("px-2 py-1", "bg-white", { "text-red-500": true, "text-blue-500": false })).toBe(
      "px-2 py-1 bg-white text-red-500"
    );
  });

  it("isReservedSlug identifies reserved system slugs", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("ADMIN")).toBe(true);
    expect(isReservedSlug("api")).toBe(true);
    expect(isReservedSlug("login")).toBe(true);
    expect(isReservedSlug("r")).toBe(true);
    expect(isReservedSlug("gocafe")).toBe(false);
    expect(isReservedSlug("tuyendung")).toBe(false);
  });
});
