import fs from 'node:fs';

async function main() {
  try {
    const res = await fetch("https://beacons.ai/gogang", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Length:", text.length);
    const m = text.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (m) {
      fs.writeFileSync("beacons_gogang.json", m[1]);
      console.log("Saved beacons_gogang.json successfully!");
    } else {
      console.log("Snippet:", text.slice(0, 300));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
