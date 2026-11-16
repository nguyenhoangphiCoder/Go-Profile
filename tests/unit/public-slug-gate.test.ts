import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const rpc = vi.fn();
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc }) }));

import { clearSlugGateCache, extractPublicSlug, gatePublicSlug } from "@/lib/public-slug-gate";

const req = (path: string, method = "GET") =>
  new NextRequest(new URL(path, "https://go.example"), { method });

function rewriteTarget(res: Response) {
  return res.headers.get("x-middleware-rewrite");
}

beforeEach(() => {
  rpc.mockReset();
  clearSlugGateCache();
});

describe("extractPublicSlug", () => {
  it("chỉ nhận đường dẫn một cấp, bỏ qua route hệ thống và file tĩnh", () => {
    expect(extractPublicSlug("/gocafe")).toBe("gocafe");
    expect(extractPublicSlug("/gocafe/")).toBe("gocafe");
    expect(extractPublicSlug("/gocafe.official")).toBe("gocafe.official");
    expect(extractPublicSlug("/")).toBeNull();
    expect(extractPublicSlug("/admin")).toBeNull();
    expect(extractPublicSlug("/login")).toBeNull();
    expect(extractPublicSlug("/r/abc")).toBeNull();
    expect(extractPublicSlug("/admin/pages")).toBeNull();
    expect(extractPublicSlug("/robots.txt")).toBeNull();
    expect(extractPublicSlug("/manifest.json")).toBeNull();
  });
});

describe("gatePublicSlug", () => {
  it("trang có thật: cho đi tiếp (null) và chỉ truy vấn 1 lần nhờ bộ nhớ đệm", async () => {
    rpc.mockResolvedValue({ data: { found: true }, error: null });
    expect(await gatePublicSlug(req("/gocafe"))).toBeNull();
    expect(await gatePublicSlug(req("/gocafe"))).toBeNull();
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("get_public_page", { p_slug: "gocafe" });
  });

  it("trang không tồn tại / chưa xuất bản: 404 thật", async () => {
    rpc.mockResolvedValue({ data: { found: false, reason: "PAGE_UNPUBLISHED" }, error: null });
    const res = (await gatePublicSlug(req("/trang-cu")))!;
    expect(res.status).toBe(404);
    expect(rewriteTarget(res)).toMatch(/\/_not-found$/);
  });

  it("alias trong database: chuyển hướng 308 về slug chính", async () => {
    rpc.mockResolvedValue({
      data: { found: true, is_alias: true, canonical_slug: "gocafe" },
      error: null,
    });
    const res = (await gatePublicSlug(req("/ten-cu?utm=qr")))!;
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://go.example/gocafe?utm=qr");
  });

  it("alias cố định và slug viết hoa: 308 ngay, không truy vấn database", async () => {
    const a = (await gatePublicSlug(req("/gocafe.official")))!;
    expect(a.status).toBe(308);
    expect(a.headers.get("location")).toBe("https://go.example/gocafe");
    const b = (await gatePublicSlug(req("/GoCafe")))!;
    expect(b.headers.get("location")).toBe("https://go.example/gocafe");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("slug sai định dạng: 404 ngay, không truy vấn database", async () => {
    for (const path of ["/abc%00def", "/a_b", "/-abc", `/${"a".repeat(81)}`, "/%F0%9F%98%80"]) {
      expect((await gatePublicSlug(req(path)))!.status).toBe(404);
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("lỗi database: không chặn, để trang tự xử lý như cũ", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "timeout" } });
    expect(await gatePublicSlug(req("/gocafe"))).toBeNull();
    rpc.mockRejectedValue(new Error("network"));
    clearSlugGateCache();
    expect(await gatePublicSlug(req("/gocafe"))).toBeNull();
  });

  it("không đụng tới POST (server action) và route hệ thống", async () => {
    expect(await gatePublicSlug(req("/gocafe", "POST"))).toBeNull();
    expect(await gatePublicSlug(req("/admin"))).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });
});
