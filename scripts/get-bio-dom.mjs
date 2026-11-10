import fs from "node:fs";

const html = fs.readFileSync("gogang_raw.html", "utf8");
const idx = html.indexOf("Chuỗi 45+");
if (idx !== -1) {
  console.log("Around Bio:", html.slice(idx - 600, idx + 800));
}
