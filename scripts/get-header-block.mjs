import fs from "node:fs";

const html = fs.readFileSync("gogang_raw.html", "utf8");

// Search for header block
const headerIdx = html.indexOf('link-in-bio__header-block');
if (headerIdx !== -1) {
  console.log("Header block context:", html.slice(headerIdx - 400, headerIdx + 1600));
}
