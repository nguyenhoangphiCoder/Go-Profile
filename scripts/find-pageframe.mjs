import fs from "node:fs";

const html = fs.readFileSync("gogang_raw.html", "utf8");

// Search for PageFrameWrapper in html
const idx = html.indexOf("PageFrameWrapper");
console.log("PageFrameWrapper occurrences:", idx);

// Check CSS links
const cssLinks = html.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi) || [];
console.log("CSS links:", cssLinks);

// Look for style rules referencing PageFrameWrapper
const styleTags = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
for (const st of styleTags) {
  if (st.includes("PageFrameWrapper") || st.includes("PageFrame")) {
    console.log("Found in style tag:", st.slice(0, 400));
  }
}
