import { test, expect } from "@playwright/test";

test.describe("Phase 09 — Staging Verification & E2E Acceptance", () => {
  test("Trang chủ / hiển thị thông tin thương hiệu Gờ Cafe", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Gờ Cafe/);
  });

  test("Trang đăng nhập /login hiển thị đúng form và trường nhập liệu", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("Truy cập trang quản trị /admin khi chưa đăng nhập bị chuyển hướng về /login", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Truy cập slug chưa tồn tại trả về giao diện 404 thân thiện", async ({ page }) => {
    const response = await page.goto("/non-existent-slug-xyz-12345");
    expect(response?.status()).toBe(404);
  });
});
