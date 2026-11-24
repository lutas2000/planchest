// The Viewer's state machine panel in a real browser, against the stride
// example's run screen. Skipped when Playwright's Chromium is not installed
// (`npx playwright install chromium`); CI installs it. PLANCHEST_BROWSER
// picks another Chromium, as it does for `planchest shots`.

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { chromium } from "playwright";
import type { Browser, Frame, Page } from "playwright";
import { serve } from "../src/diff/serve.ts";
import { publishViewer } from "../src/viewer/index.ts";

const example = new URL("../examples/stride/b/", import.meta.url).pathname;

const frameText = (frame: Frame, bind: string) =>
  frame.locator(`[data-bind="${bind}"]`).innerText();
const hash = (page: Page) =>
  page.evaluate(() => Object.fromEntries(new URLSearchParams(location.hash.slice(1))));

test("the Viewer drives a page's state machine and keeps the snapshot in its hash", async (t) => {
  let browser: Browser;
  try {
    browser = await chromium.launch(
      process.env.PLANCHEST_BROWSER ? { executablePath: process.env.PLANCHEST_BROWSER } : {},
    );
  } catch {
    t.skip("Chromium is not installed");
    return;
  }
  const out = mkdtempSync(join(tmpdir(), "planchest-viewer-"));
  publishViewer(example, out);
  const { server, url } = await serve(out, 0);
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url + "#file=prototypes/run/active.html&viewport=Mobile");
    const panel = page.locator("section.machine");
    await panel.waitFor();
    const frame = () => page.frames().find((f) => f.url().endsWith("/run/active.html"))!;
    const pressed = (group: string) =>
      panel.locator(`.${group} button[aria-pressed="true"]`).innerText();

    // The page's report fills the panel; the default is not in the hash.
    assert.equal(await pressed("states"), "Running");
    assert.match(await pressed("presets"), /Default/);
    assert.deepEqual(Object.keys(await hash(page)).sort(), ["file", "viewport"]);

    // Only events that leave the current state are offered.
    assert.deepEqual(await panel.locator(".events button span").allInnerTexts(), ["Pause"]);
    await panel.locator(".events button", { hasText: "Pause" }).click();
    assert.equal(await pressed("states"), "Paused");
    await frame().locator('[data-bind="toggle"]', { hasText: "Resume" }).waitFor();
    assert.equal((await hash(page)).state, "paused");

    // A preset sets the state and the context; the toolbar select follows.
    await panel.locator(".presets button", { hasText: "Almost there" }).click();
    await frame().locator('[data-bind="distance"]', { hasText: "4.86" }).waitFor();
    assert.equal(await pressed("states"), "Running");
    assert.equal(await page.locator(".toolbar select").inputValue(), "p:almost-there");

    // Editing a field is a custom snapshot, kept as a diff from the defaults.
    const distance = panel.locator(".field", { hasText: "Distance" }).locator("input");
    await distance.fill("4.99");
    await frame().locator('[data-bind="distance"]', { hasText: "4.99" }).waitFor();
    assert.equal(await page.locator(".toolbar select").inputValue(), "custom");
    assert.equal(JSON.parse((await hash(page)).ctx).distanceKm, 4.99);
    await panel.locator(".field", { hasText: "GPS" }).locator("select").selectOption("lost");
    assert.match(await frameText(frame(), "gps"), /lost/);

    // A tap inside the page is reported back as a step.
    await frame().locator('[data-bind="toggle"]').click();
    await panel.locator('.states button[aria-pressed="true"]', { hasText: "Paused" }).waitFor();
    assert.match(await panel.locator(".history li").first().innerText(), /In the page/);

    // Back undoes it; a reload restores the snapshot from the hash.
    await panel.getByRole("button", { name: "Back" }).click();
    assert.equal(await pressed("states"), "Running");
    await page.reload();
    await panel.waitFor();
    await frame().locator('[data-bind="distance"]', { hasText: "4.99" }).waitFor();
    assert.match(await frameText(frame(), "gps"), /lost/);

    // Compare: every frame shows the same snapshot.
    await page.getByRole("button", { name: "Compare" }).click();
    await page.waitForFunction(() => document.querySelectorAll("iframe").length > 1);
    await panel.locator(".events button", { hasText: "Pause" }).click();
    for (const f of page.frames().filter((f) => f.url().endsWith("/run/active.html")))
      await f.locator('[data-bind="toggle"]', { hasText: "Resume" }).waitFor();

    // The JSON editor applies a whole context.
    await panel.getByRole("button", { name: "Edit as JSON" }).click();
    const json = panel.locator('textarea[aria-label="Context JSON"]');
    const context = JSON.parse(await json.inputValue());
    await json.fill(JSON.stringify({ ...context, kcal: 999 }));
    await panel.getByRole("button", { name: "Apply" }).click();
    await frame().locator('[data-bind="kcal"]', { hasText: "999" }).waitFor();
    await json.fill("{");
    await panel.getByRole("button", { name: "Apply" }).click();
    await panel.locator(".error").waitFor();

    assert.deepEqual(errors, []);
  } finally {
    server.close();
    await browser.close();
    rmSync(out, { recursive: true, force: true });
  }
});
