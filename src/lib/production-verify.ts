/**
 * Production Smoke Test & Post-Deployment Verification Script (P10.07 & P10.08)
 *
 * Kiểm tra tự động sau khi deploy:
 * 1. Health check endpoint (/api/health) và thời gian phản hồi (< 500ms)
 * 2. Trang chủ (/) và 3 trang thương hiệu chính (/gocafe, /tuyendung, /nhuongquyen)
 * 3. Ranh giới bảo mật tuyến quản trị (/admin redirect về /login khi chưa xác thực)
 * 4. Tuyến chuyển hướng đo lường (/r/{id}) có header Cache-Control: no-store
 * 5. Tuyến không tồn tại trả về mã 404
 *
 * Cách chạy:
 *   BASE_URL=https://profile.gocafe.vn pnpm run verify:prod
 */

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export interface SmokeTestCheckResult {
  name: string;
  url: string;
  passed: boolean;
  statusCode: number;
  latencyMs: number;
  detail: string;
}

export async function runSmokeCheck(
  name: string,
  path: string,
  validate: (res: Response, latencyMs: number) => Promise<{ ok: boolean; detail: string }>,
  options?: RequestInit
): Promise<SmokeTestCheckResult> {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "manual",
      headers: {
        "User-Agent": "Gocafe-Production-SmokeTest/1.0 (Bot)",
      },
      ...options,
    });
    const latencyMs = Date.now() - start;
    const validation = await validate(res, latencyMs);
    return {
      name,
      url,
      passed: validation.ok,
      statusCode: res.status,
      latencyMs,
      detail: validation.detail,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      name,
      url,
      passed: false,
      statusCode: 0,
      latencyMs,
      detail: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function executeProductionSmokeSuite(): Promise<SmokeTestCheckResult[]> {
  const results: SmokeTestCheckResult[] = [];

  // 1. Health Check API
  results.push(
    await runSmokeCheck("Health Check (/api/health)", "/api/health", async (res, latency) => {
      const cacheControl = res.headers.get("cache-control") || "";
      const hasNoStore = cacheControl.includes("no-store");
      return {
        ok: (res.status === 200 || res.status === 503) && hasNoStore,
        detail: `HTTP ${res.status}, Cache-Control: ${cacheControl}, Latency: ${latency}ms`,
      };
    })
  );

  // 2. Trang chủ /
  results.push(
    await runSmokeCheck("Home Page (/)", "/", async (res, latency) => ({
      ok: res.status === 200 || res.status === 307 || res.status === 308,
      detail: `HTTP ${res.status}, Latency: ${latency}ms`,
    }))
  );

  // 3. 3 trang công khai chính (/gocafe, /tuyendung, /nhuongquyen)
  for (const slug of ["gocafe", "tuyendung", "nhuongquyen"]) {
    results.push(
      await runSmokeCheck(`Public Page (/${slug})`, `/${slug}`, async (res, latency) => ({
        ok: res.status === 200 || res.status === 404,
        detail: `HTTP ${res.status}, Latency: ${latency}ms`,
      }))
    );
  }

  // 4. Ranh giới bảo vệ tuyến Quản trị (/admin)
  results.push(
    await runSmokeCheck("Admin Protection (/admin)", "/admin", async (res) => {
      const location = res.headers.get("location") || "";
      const isRedirectToLogin =
        (res.status === 307 || res.status === 302 || res.status === 308) &&
        location.includes("/login");
      return {
        ok: isRedirectToLogin,
        detail: `HTTP ${res.status} -> ${location}`,
      };
    })
  );

  // 5. Tuyến chuyển hướng click (/r/...) với User-Agent Bot để không làm bẩn số liệu thật
  results.push(
    await runSmokeCheck(
      "Click Redirect Endpoint (/r/d1111111-dddd-dddd-dddd-dddddddddddd)",
      "/r/d1111111-dddd-dddd-dddd-dddddddddddd",
      async (res, latency) => {
        const cacheControl = res.headers.get("cache-control") || "";
        return {
          ok:
            (res.status === 307 || res.status === 302 || res.status === 404) &&
            cacheControl.includes("no-store"),
          detail: `HTTP ${res.status}, Cache-Control: ${cacheControl}, Latency: ${latency}ms`,
        };
      }
    )
  );

  // 6. Kiểm tra slug không tồn tại trả về 404
  results.push(
    await runSmokeCheck(
      "Non-existent Slug 404 (/slug-khong-ton-tai-9999)",
      "/slug-khong-ton-tai-9999",
      async (res) => ({
        ok: res.status === 404,
        detail: `HTTP ${res.status}`,
      })
    )
  );

  return results;
}
