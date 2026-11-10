import fs from "node:fs";

const html = fs.readFileSync("gogang_raw.html", "utf8");

// Search for any CSS mentioning PageFrameWrapper
const cssMatches = html.match(/[^{}]*PageFrameWrapper[^{}]*\{[^}]*\}/gi) || [];
console.log("PageFrameWrapper CSS rules:", cssMatches);

// Let's also check if there is an ::after or ::before on PageFrameWrapper
const allSelectors = html.match(/[^{}]*PageFrame[^{}]*\{[^}]*\}/gi) || [];
console.log("All PageFrame CSS rules:", allSelectors);
