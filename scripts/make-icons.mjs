// Renders public/favicon.svg to the PNG sizes the web manifest wants. Playwright is
// already a dev dependency for the browser tests, so it doubles as the rasteriser.
//
//   node scripts/make-icons.mjs
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const svg = await readFile("public/favicon.svg", "utf8");
await mkdir("public/icons", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const page = await browser.newPage({ deviceScaleFactor: 1 });
try {
  for (const [name, size, pad] of [
    ["icon-192", 192, 0],
    ["icon-512", 512, 0],
    ["icon-maskable-512", 512, 56],
  ]) {
    // A maskable icon keeps its artwork inside the safe zone: pad it on the brand colour.
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<body style="margin:0;background:#10131b"><div style="padding:${pad}px">${svg.replace("<svg ", `<svg width="${size - pad * 2}" height="${size - pad * 2}" style="display:block" `)}</div></body>`,
    );
    await page.screenshot({
      path: `public/icons/${name}.png`,
      omitBackground: false,
    });
    console.log(`  ✓ public/icons/${name}.png`);
  }
} finally {
  await browser.close();
}
