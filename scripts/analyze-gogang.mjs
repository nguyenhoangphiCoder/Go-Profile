import fs from "node:fs";

const html = fs.readFileSync("gogang_raw.html", "utf8");
console.log("HTML length:", html.length);

// Extract all img tags
const imgs = [];
const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
for (const m of imgMatches) {
  imgs.push(m[1]);
}
console.log("Images found (" + imgs.length + "):", imgs);

// Extract links
const links = [];
const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
for (const m of linkMatches) {
  links.push({ href: m[1], text: m[2].replace(/<[^>]+>/g, " ").trim() });
}
console.log("Links count:", links.length);
fs.writeFileSync("gogang_links.json", JSON.stringify(links, null, 2));

// Extract style tags or inline styles with background or blur
const styles = html.match(/style=["']([^"']*background[^"']*)["']/gi) || [];
console.log("Background styles count:", styles.length);
for (const st of styles.slice(0, 10)) {
  console.log(" -", st);
}

// Search for any window.__ or JSON in script
const jsonMatches = html.match(/(\{"props"[\s\S]*?\}<\/script>)/);
if (jsonMatches) {
  console.log("Found props match!");
}
