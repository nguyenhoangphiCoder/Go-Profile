import { chromium } from "@playwright/test";
import fs from "node:fs";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
  await page.goto("https://beacons.ai/gogang", { waitUntil: "networkidle" });

  const data = await page.evaluate(() => {
    // Check document.body and its children
    const results = [];
    const walk = (el, depth = 0) => {
      if (depth > 4) return;
      const cs = window.getComputedStyle(el);
      if (cs.backgroundImage && cs.backgroundImage !== "none") {
        results.push({
          tag: el.tagName,
          id: el.id,
          class: el.className,
          bgImage: cs.backgroundImage,
          filter: cs.filter,
          styleAttr: el.getAttribute("style")
        });
      }
      for (const child of el.children) {
        walk(child, depth + 1);
      }
    };
    walk(document.body);
    return results;
  });

  fs.writeFileSync("bg_inspect.json", JSON.stringify(data, null, 2));
  console.log("Written bg_inspect.json, count:", data.length);
  await browser.close();
}

main();
