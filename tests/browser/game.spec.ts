import { test, expect } from "@playwright/test";
test("boots, selects every fighter, and completes a playable match", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /One robot. Five/ }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/title.png" });
  await page
    .getByRole("button", { name: "TRAINING ROOM", exact: true })
    .click();
  for (const id of ["voxxy", "droid", "biggy", "richie", "microduck"]) {
    await page.locator(`[data-fighter="${id}"]`).click();
    await expect(page.locator(`[data-fighter="${id}"]`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  await page.screenshot({ path: "test-results/select.png" });
  await page.locator('[data-fighter="voxxy"]').click();
  await page.getByRole("button", { name: "CHOOSE ARENA →" }).click();
  await page.getByRole("button", { name: "EXECUTE! ↗" }).click();
  await expect(page.locator("#hud")).toBeVisible();
  await page.waitForFunction(() => (window as any).rumble.phase === "fight");
  await page.evaluate(() => {
    const g = (window as any).rumble;
    g.fighters[0].body.setTranslation({ x: -1, y: 1.2, z: 0 }, true);
    g.fighters[1].body.setTranslation({ x: 1, y: 1.7, z: 0 }, true);
  });
  await page.keyboard.press("j");
  await page.waitForFunction(() => (window as any).rumble.fighters[1].hp < 100);
  const hp = await page.evaluate(() => (window as any).rumble.fighters[1].hp);
  expect(hp).toBeLessThan(100);
  await page.screenshot({ path: "test-results/fight.png" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "RESUME →" })).toBeVisible();
  const timer = await page.evaluate(() => (window as any).rumble.timer);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).rumble.timer)).toBe(timer);
  await page.getByRole("button", { name: "RESUME →" }).click();
  // Best-of-three match and round reset in versus, without waiting out real-time rounds.
  await page.evaluate(() => {
    const g = (window as any).rumble;
    g.start("versus", "richie", "microduck", 0);
    g.phase = "fight";
    g.fighters[1].hp = 0;
  });
  await page.waitForFunction(() => (window as any).rumble.phase === "roundEnd");
  await page.evaluate(() => {
    (window as any).rumble.phaseTime = 0;
  });
  await page.waitForFunction(() => (window as any).rumble.round === 2);
  expect(await page.evaluate(() => (window as any).rumble.fighters[1].hp)).toBe(
    100,
  );
  await page.evaluate(() => {
    const g = (window as any).rumble;
    g.phase = "fight";
    g.fighters[1].hp = 0;
  });
  await page.waitForFunction(() => (window as any).rumble.phase === "roundEnd");
  await page.evaluate(() => {
    (window as any).rumble.phaseTime = 0;
  });
  await expect(page.getByRole("button", { name: "REMATCH →" })).toBeVisible();
  expect(errors).toEqual([]);
});
test("combat: block, grab, hazard, Overclock and individual special abilities", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => (window as any).rumble);
  const r = await page.evaluate(() => {
    const g = (window as any).rumble;
    g.start("training", "voxxy", "droid", 0);
    g.phase = "fight";
    const [a, b] = g.fighters;
    const n = () => ({
      move: 0,
      jump: false,
      crouch: false,
      block: false,
      light: false,
      heavy: false,
      grab: false,
      special: false,
      secondary: false,
      overclock: false,
    });
    a.body.setTranslation({ x: -0.8, y: a.def.height / 2, z: 0 }, true);
    b.body.setTranslation({ x: 0.8, y: b.def.height / 2, z: 0 }, true);
    b.previous.block = true;
    b.face = -1;
    a.attack = { kind: "heavy", t: 0.3, hit: false, duration: 1 };
    g.strike(a, b);
    const blocked = 100 - b.hp;
    b.hp = 100;
    b.stun = 0;
    a.attack = { kind: "grab", t: 0.3, hit: false, duration: 1 };
    g.strike(a, b);
    const grabbed = 100 - b.hp;
    a.meter = 100;
    g.updateFighter(a, b, { ...n(), overclock: true }, 1 / 60);
    const oc = a.oc;
    a.body.setTranslation({ x: 0, y: a.def.height / 2, z: 0 }, true);
    a.hazardCooldown = 0;
    g.hazardTime = 8.1;
    g.hazards(1 / 60);
    const launch = a.body.linvel().y;
    g.start("training", "microduck", "biggy", 0);
    g.beginAttack(g.fighters[0], "special", n());
    const roller = g.fighters[0].roller;
    g.beginAttack(g.fighters[1], "secondary", n());
    const brace = g.fighters[1].brace;
    return { blocked, grabbed, oc, launch, roller, brace };
  });
  expect(r.blocked).toBeLessThan(3);
  expect(r.grabbed).toBeGreaterThan(8);
  expect(r.oc).toBe(5);
  expect(r.launch).toBeGreaterThan(10);
  expect(r.roller).toBe(5);
  expect(r.brace).toBe(3);
});
test("mobile menu and touch controls remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /One robot. Five/ }).click();
  await page.locator('[data-fighter="richie"]').click();
  await page.getByRole("button", { name: "CHOOSE ARENA →" }).click();
  await page.getByRole("button", { name: "EXECUTE! ↗" }).click();
  await expect(page.locator("#hud")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile.png" });
});
