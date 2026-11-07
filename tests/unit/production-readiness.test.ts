import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Mock Supabase server client for health check tests
const mockSelect = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        limit: mockSelect,
      }),
    }),
  })),
}));

import { GET as getHealth } from "@/app/api/health/route";
import { runSmokeCheck } from "@/lib/production-verify";
import { shouldSkipClickTracking } from "@/features/public/bot-detector";

describe("Phase 10 — Triển khai Production và Xác minh Vận hành (P10.01 - P10.08)", () => {
  const rootDir = process.cwd();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("P10.01 & P10.02: Cấu hình vercel.json định nghĩa đúng region sin1, security headers và no-store cho /r/*, /admin/*", () => {
    const vercelConfigPath = path.join(rootDir, "vercel.json");
    expect(fs.existsSync(vercelConfigPath)).toBe(true);

    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf-8"));
    expect(vercelConfig.framework).toBe("nextjs");
    expect(vercelConfig.regions).toContain("sin1");

    const headers = vercelConfig.headers as Array<{
      source: string;
      headers: Array<{ key: string; value: string }>;
    }>;
    expect(headers.length).toBeGreaterThanOrEqual(3);

    const globalHeaders = headers.find((h) => h.source === "/(.*)");
    expect(globalHeaders).toBeDefined();
    expect(
      globalHeaders?.headers.some(
        (h) => h.key === "X-Content-Type-Options" && h.value === "nosniff"
      )
    ).toBe(true);
    expect(
      globalHeaders?.headers.some((h) => h.key === "X-Frame-Options" && h.value === "DENY")
    ).toBe(true);

    const redirectHeaders = headers.find((h) => h.source === "/r/(.*)");
    expect(redirectHeaders).toBeDefined();
    expect(
      redirectHeaders?.headers.some(
        (h) => h.key === "Cache-Control" && h.value.includes("no-store")
      )
    ).toBe(true);
  });

  it("P10.04: Kiểm tra tính toàn vẹn của migration production và đảm bảo build script không tự ý chạy db migrate", () => {
    const pkgPath = path.join(rootDir, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

    // Build script tuyệt đối không được chứa lệnh tự động migrate DB trên production
    expect(pkg.scripts.build).toBe("next build");
    expect(pkg.scripts.build).not.toContain("supabase db push");
    expect(pkg.scripts.build).not.toContain("migrate");

    // Kiểm tra full_schema_migration.sql tồn tại và đầy đủ các thành phần
    const fullSchemaPath = path.join(rootDir, "supabase", "full_schema_migration.sql");
    expect(fs.existsSync(fullSchemaPath)).toBe(true);
    const fullSchemaSql = fs.readFileSync(fullSchemaPath, "utf-8");
    expect(fullSchemaSql).toContain("CREATE TABLE IF NOT EXISTS public.pages");
    expect(fullSchemaSql).toContain("CREATE OR REPLACE FUNCTION public.publish_page");
    expect(fullSchemaSql).toContain("CREATE OR REPLACE FUNCTION public.get_click_report");
  });

  it("P10.05 & P10.06: Bản bootstrap production (production_bootstrap.sql) khởi tạo đủ 3 trang thật nhưng KHÔNG chèn click_events giả lập", () => {
    const bootstrapPath = path.join(rootDir, "supabase", "production_bootstrap.sql");
    expect(fs.existsSync(bootstrapPath)).toBe(true);

    const sql = fs.readFileSync(bootstrapPath, "utf-8");

    // Phải có đủ 3 slug thương hiệu chính
    expect(sql).toContain("'gocafe'");
    expect(sql).toContain("'tuyendung'");
    expect(sql).toContain("'nhuongquyen'");

    // Phải sử dụng cơ chế idempotent ON CONFLICT
    expect(sql).toContain("ON CONFLICT (id) DO NOTHING");
    expect(sql).toContain("ON CONFLICT (slug) DO NOTHING");

    // Tuyệt đối KHÔNG chứa lệnh INSERT INTO public.click_events
    expect(sql).not.toContain("INSERT INTO public.click_events");
  });

  it("P10.07: Health check endpoint (/api/health) trả về 200 OK khi DB kết nối tốt và 503 khi DB gặp sự cố", async () => {
    // 1. Khi DB hoạt động bình thường
    mockSelect.mockResolvedValueOnce({ data: [{ slug: "admin" }], error: null });
    const okRes = await getHealth();
    expect(okRes.status).toBe(200);
    expect(okRes.headers.get("Cache-Control")).toContain("no-store");

    const okBody = await okRes.json();
    expect(okBody.status).toBe("ok");
    expect(okBody.timezone).toBe("Asia/Ho_Chi_Minh");
    expect(okBody.checks.env).toBe("ok");
    expect(okBody.checks.database).toBe("ok");
    expect(typeof okBody.latencyMs).toBe("number");

    // 2. Khi DB gặp lỗi kết nối
    mockSelect.mockResolvedValueOnce({ data: null, error: { message: "Connection refused" } });
    const errRes = await getHealth();
    expect(errRes.status).toBe(503);

    const errBody = await errRes.json();
    expect(errBody.status).toBe("error");
    expect(errBody.checks.database).toBe("error");
  });

  it("P10.07 & P10.08: Công cụ Smoke Test gắn User-Agent Bot để phân biệt và không làm bẩn thống kê click thật trên production", async () => {
    const smokeTestUserAgent = "Gocafe-Production-SmokeTest/1.0 (Bot)";
    const headers = new Headers({
      "user-agent": smokeTestUserAgent,
    });

    // Bộ lọc bot phải nhận diện được User-Agent của Smoke Test để không ghi click_events
    expect(shouldSkipClickTracking("GET", headers, smokeTestUserAgent)).toBe(true);

    // Kiểm tra hàm runSmokeCheck xử lý response và đo latency chính xác
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    const checkResult = await runSmokeCheck("Test Health", "/api/health", async (res) => ({
      ok: res.status === 200,
      detail: `HTTP ${res.status}`,
    }));

    expect(checkResult.passed).toBe(true);
    expect(checkResult.statusCode).toBe(200);
    expect(checkResult.latencyMs).toBeGreaterThanOrEqual(0);

    vi.unstubAllGlobals();
  });
});
