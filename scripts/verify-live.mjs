import { chromium } from "playwright";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("https://janvanwassenhove.github.io/RuntimeRumble/", {
    waitUntil: "networkidle",
  });
  await page
    .getByRole("button", { name: "TRAINING ROOM", exact: true })
    .waitFor();
  await page.screenshot({ path: "test-results/live-title.png" });
  await page
    .getByRole("button", { name: "TRAINING ROOM", exact: true })
    .click();
  await page.getByRole("button", { name: /03 \/ HEAVY CLASS/ }).click();
  await page.getByRole("button", { name: "CHOOSE ARENA →" }).click();
  await page.getByRole("button", { name: /KEYNOTE STAGE/ }).click();
  await page.getByRole("button", { name: "EXECUTE! ↗" }).click();
  await page.locator("#hud").waitFor({ state: "visible" });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "test-results/live-fight.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "RESUME →" }).waitFor();
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "Live GitHub Pages verified: title, selection, keynote fight, pause; no runtime errors.",
  );
} finally {
  await browser.close();
}
