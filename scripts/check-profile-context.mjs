import fs from "node:fs";

const html = fs.readFileSync("gogang_raw.html", "utf8");

// Search for any style tags containing background or desktop
const styleTags = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
console.log("Style tags count:", styleTags.length);

for (let i = 0; i < styleTags.length; i++) {
  const content = styleTags[i];
  if (content.includes("desktop-background") || content.includes(".Profile") || content.includes("background-image")) {
    console.log(`Style tag ${i}:`, content.slice(0, 500));
  }
}

// Also let's check the container around Profile
const profileIdx = html.indexOf('class="Profile');
if (profileIdx !== -1) {
  console.log("Profile context:", html.slice(Math.max(0, profileIdx - 500), profileIdx + 1000));
}
