import fs from "node:fs";

async function fetchCss() {
  const cssUrls = [
    "https://beacons.ai/_next/static/chunks/0ojtxhfzb-rw3.css",
    "https://beacons.ai/_next/static/chunks/3hqv4wc8mopaf.css",
    "https://beacons.ai/_next/static/chunks/43u4xu3m6d_66.css",
    "https://beacons.ai/_next/static/chunks/30quqom0a555s.css",
    "https://beacons.ai/_next/static/chunks/10u-u0fgzncyb.css"
  ];
  for (const u of cssUrls) {
    try {
      const res = await fetch(u);
      const text = await res.text();
      if (text.includes("PageFrameWrapper")) {
        console.log("Found PageFrameWrapper in", u);
        // Extract the rule
        const m = text.match(/\.PageFrameWrapper[^{]*\{[^}]*\}/g);
        console.log("Rules:", m);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

fetchCss();
