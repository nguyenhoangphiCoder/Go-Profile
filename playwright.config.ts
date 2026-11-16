import { defineConfig, devices } from "@playwright/test";

/**
 * Test e2e chạy trên bản build production tại máy (cổng 3100), KHÔNG trỏ vào site thật.
 * - Không đụng dev server đang chạy ở cổng 3000.
 * - Bật trang dữ liệu mẫu /e2e-fixtures/* (ENABLE_RENDER_FIXTURES=1) cho test giao diện.
 * Muốn chạy với một môi trường khác (ví dụ staging): đặt E2E_BASE_URL.
 */
const PORT = 3100;
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  expect: {
    toHaveScreenshot: {
      // Sai khác nhỏ do khử răng cưa font giữa các lần chạy
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx next build && npx next start -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        env: { ENABLE_RENDER_FIXTURES: "1" },
      },
});
