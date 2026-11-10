import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
  console.log("Navigating to http://localhost:3000/gogang...");
  await page.goto("http://localhost:3000/gogang", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "public/gogang_local_result.png", fullPage: true });
  console.log("Saved public/gogang_local_result.png!");
  await browser.close();
}

main();
