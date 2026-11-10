import { chromium } from "@playwright/test";
import fs from "node:fs";

async function main() {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1440, height: 1800 }
    });
    const page = await context.newPage();
    console.log("Navigating to https://beacons.ai/gogang...");
    await page.goto("https://beacons.ai/gogang", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log("Page title:", await page.title());

    const nextData = await page.evaluate(() => {
      const el = document.getElementById("__NEXT_DATA__");
      return el ? el.textContent : null;
    });

    if (nextData) {
      fs.writeFileSync("gogang_next_data.json", nextData, "utf8");
      console.log("Saved gogang_next_data.json!");
    } else {
      console.log("No __NEXT_DATA__ found");
      const html = await page.content();
      fs.writeFileSync("gogang_raw.html", html, "utf8");
      console.log("Saved gogang_raw.html");
    }

    await page.screenshot({ path: "public/gogang_screenshot.png", fullPage: true });
    console.log("Saved public/gogang_screenshot.png");

    await browser.close();
  } catch (err) {
    console.error("Error in scrape:", err);
  }
}

main();
