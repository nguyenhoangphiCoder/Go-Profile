import { test, expect } from "@playwright/test";

test("smoke test home page has brand title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Gờ Cafe Profile/);
});

