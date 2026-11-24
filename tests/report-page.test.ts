// The diff report page in a real browser: the panels, the zoom field and
// hash links. Skipped when Playwright's Chromium is not installed
// (`npx playwright install chromium`); CI installs it. PLANCHEST_BROWSER
// picks another Chromium, as it does for `planchest shots`.

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { launchBrowser } from "../src/browser.ts";
import type { Browser } from "playwright";
import { diff } from "../src/diff/index.ts";
import { serve } from "../src/diff/serve.ts";

const fixtures = new URL("./fixtures/", import.meta.url).pathname;
const WIDTH = 1400;

test("the report page lays out its panels, keeps zoom honest and follows the hash", async (t) => {
  let browser: Browser;
  try {
    browser = await launchBrowser(process.cwd());
  } catch {
    t.skip("Chromium is not installed");
    return;
  }
  const out = mkdtempSync(join(tmpdir(), "planchest-report-"));
  diff(join(fixtures, "a"), join(fixtures, "b"), { cwd: fixtures, out });
  const { server, url } = await serve(out, 0);
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page.locator("nav .item").first().waitFor();

    // The first changed page is selected and shown on both sides.
    assert.equal(await page.locator('nav .item[aria-current="true"]').count(), 1);
    assert.ok((await page.locator(".pair .frame").count()) === 2);

    // Hiding the file list gives its space to the preview, not to the summary.
    await page.getByRole("button", { name: "Files" }).click();
    assert.equal(await page.locator("nav").count(), 0);
    const view = (await page.locator(".view").boundingBox())!;
    const aside = (await page.locator("aside").boundingBox())!;
    assert.ok(view.x < 1, `preview starts at the left edge, not at ${view.x}`);
    assert.ok(Math.abs(aside.x + aside.width - WIDTH) < 1, "summary stays on the right edge");
    assert.ok(Math.abs(view.x + view.width - aside.x) < 1, "preview fills up to the summary");

    // A zoom the page clamps shows the clamped value, even when it was already there.
    await page.getByText("Custom").click();
    const zoom = page.locator(".custom label", { hasText: "Zoom" }).locator("input");
    for (let i = 0; i < 2; i++) {
      await zoom.fill("300");
      await zoom.press("Enter");
      assert.equal(await zoom.inputValue(), "200");
    }
    await zoom.fill("0");
    await zoom.press("Enter");
    assert.equal(await zoom.inputValue(), "200");

    // Summary links change the hash; the page follows it.
    await page.evaluate(() => (location.hash = "#concepts/dashboard/index.html:overview"));
    await page.locator(".toolbar .path", { hasText: "#overview" }).waitFor();

    assert.deepEqual(errors, []);
  } finally {
    server.close();
    await browser.close();
    rmSync(out, { recursive: true, force: true });
  }
});
