import fs from "node:fs";

const html = fs.readFileSync("gogang_raw.html", "utf8");
const idx = html.indexOf("Chuỗi 45+");
console.log(html.slice(idx - 1500, idx - 600));
