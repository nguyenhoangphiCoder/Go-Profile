import fs from "node:fs";

const html = fs.readFileSync("gogang_raw.html", "utf8");

// Search for any style attributes or class with background in gogang_raw.html
const allStyles = [];
const re = /style=["']([^"']+)["']/gi;
let m;
while ((m = re.exec(html)) !== null) {
  if (m[1].includes("background") || m[1].includes("filter") || m[1].includes("blur")) {
    allStyles.push(m[1]);
  }
}

console.log("All matching inline styles:");
allStyles.forEach((s, idx) => console.log(`${idx}: ${s}`));
