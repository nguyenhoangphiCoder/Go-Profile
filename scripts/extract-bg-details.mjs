import fs from "node:fs";

const html = fs.readFileSync("gogang_raw.html", "utf8");

// Search for background element
const bodyDiv = html.match(/<body[\s\S]*?<\/body>/i);
if (bodyDiv) {
  const bodyContent = bodyDiv[0];
  // Find elements with id or class related to background
  const bgMatch = bodyContent.match(/class="[^"]*(?:bg|background)[^"]*"/gi) || [];
  console.log("Bg classes:", bgMatch);
}

// Search for background-image
const bgUrls = html.match(/background-image:[^;"]+/gi) || [];
console.log("bgUrls:", bgUrls);

// Let's find the exact header / background wrapper div
const mainMatch = html.match(/<div[^>]*style="[^"]*background-position[^"]*"[^>]*>/i);
if (mainMatch) {
  console.log("Main wrapper:", mainMatch[0]);
}

// Look for header title and bio
const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
console.log("H1:", h1Match ? h1Match[0] : "none");

// Bio
const bioMatch = html.match(/Chuỗi 45\+[^<]*/i);
console.log("Bio:", bioMatch ? bioMatch[0] : "none");
