import { describe, expect, it } from "vitest";
import { getDomainLookupCandidates, normalizeDomainHost } from "@/features/workspace/domain-utils";

describe("Multi-Tenant Custom Domain Host Normalization (MT-3)", () => {
  it("chuẩn hóa tên miền đầy đủ protocol, port, path, chữ hoa và dấu chấm cuối", () => {
    expect(normalizeDomainHost("https://Go-Cafe.com:443/ve-chung-toi")).toBe("go-cafe.com");
    expect(normalizeDomainHost("HTTP://WWW.Shop.DoiTac.VN.")).toBe("www.shop.doitac.vn");
    expect(normalizeDomainHost("go-cafe.com, proxy.internal")).toBe("go-cafe.com");
  });

  it("loại bỏ localhost, IPv4 và chuỗi không hợp lệ", () => {
    expect(normalizeDomainHost("localhost:3000")).toBeNull();
    expect(normalizeDomainHost("app.localhost:3000")).toBeNull();
    expect(normalizeDomainHost("127.0.0.1:3000")).toBeNull();
    expect(normalizeDomainHost("not a domain")).toBeNull();
    expect(normalizeDomainHost("")).toBeNull();
    expect(normalizeDomainHost(null)).toBeNull();
  });

  it("sinh ứng viên tra cứu khớp cả tên miền gốc và www.", () => {
    expect(getDomainLookupCandidates("go-cafe.com")).toEqual(["go-cafe.com", "www.go-cafe.com"]);
    expect(getDomainLookupCandidates("www.go-cafe.com:443")).toEqual([
      "www.go-cafe.com",
      "go-cafe.com",
    ]);
    expect(getDomainLookupCandidates("localhost:3000")).toEqual([]);
  });
});
