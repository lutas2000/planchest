// `planchest diff` compares the states of pages with a state machine by
// rendering them, and the report lists only the states that look different.
// Skipped when Playwright's Chromium is not installed
// (`npx playwright install chromium`); CI installs it.

import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { launchBrowser } from "../src/browser.ts";
import type { Browser } from "playwright";
import { diff, diffWithStates } from "../src/diff/index.ts";
import { serve } from "../src/diff/serve.ts";
import { looksSame, mentionsMachine } from "../src/diff/states.ts";

const example = new URL("../examples/stride/b/", import.meta.url).pathname;
const PAGE = "prototypes/run/active.html";

function sides() {
  const dir = mkdtempSync(join(tmpdir(), "planchest-states-"));
  cpSync(example, join(dir, "a"), { recursive: true });
  cpSync(example, join(dir, "b"), { recursive: true });
  const file = join(dir, "b", PAGE);
  const html = readFileSync(file, "utf8")
    // Only the paused state shows this note.
    .replace(".paused-note { font-size: var(--text-sm);", ".paused-note { font-size: var(--text-lg);")
    .replace("  presets: [\n", '  presets: [\n    { name: "long-goal", label: "Long goal", context: { goalKm: 21.1 } },\n');
  writeFileSync(file, html);
  return dir;
}

test("states that look different are listed, and the report shows them", async (t) => {
  let browser: Browser;
  try {
    browser = await launchBrowser(process.cwd());
  } catch {
    t.skip("Chromium is not installed");
    return;
  }
  const dir = sides();
  const out = join(dir, "out");
  try {
    const report = await diffWithStates("a", "b", { cwd: dir, out });
    const page = report.comparison.pages.find((p) => p.file === PAGE)!;
    const changes = Object.fromEntries(page.states!.map((s) => [s.id, s.change]));
    assert.deepEqual(changes, {
      default: "unchanged",
      "just-started": "unchanged",
      "almost-there": "unchanged",
      "weak-gps": "unchanged",
      "paused-halfway": "changed",
      "long-goal": "added",
    });
    assert.equal(page.states!.find((s) => s.id === "paused-halfway")!.b!.state, "paused");
    assert.deepEqual(report.comparison.states, { viewport: { width: 1280, height: 800 } });
    const json = JSON.parse(readFileSync(join(out, "report.json"), "utf8"));
    assert.equal(json.comparison.pages.find((p: any) => p.file === PAGE).states.length, 6);

    // The report lists the two states that differ and counts the rest.
    const { server, url } = await serve(out, 0);
    try {
      const tab = await browser.newPage({ viewport: { width: 1400, height: 900 } });
      const errors: string[] = [];
      tab.on("pageerror", (e) => errors.push(e.message));
      await tab.goto(url);
      const items = tab.locator("nav .item.state");
      await items.first().waitFor();
      assert.deepEqual(await items.allInnerTexts(), ["@Paused halfway", "@Long goal"]);
      assert.match(await tab.locator("nav .same").innerText(), /4 states look the same/);

      // Selecting a state sends each side its snapshot; the hash keeps it.
      await items.first().click();
      for (const side of ["a", "b"])
        await tab
          .frameLocator(`iframe[src="${side}/${PAGE}"]`)
          .locator('[data-bind="toggle"]', { hasText: "Resume" })
          .waitFor();
      assert.equal(await tab.evaluate(() => location.hash), "#" + encodeURIComponent(PAGE) + "@paused-halfway");
      await tab.reload();
      await tab.locator('nav .item.state[aria-current="true"]', { hasText: "Paused halfway" }).waitFor();

      // A state only one side has leaves the other side empty.
      await items.nth(1).click();
      await tab.locator(".frame.missing", { hasText: "Not in A" }).waitFor();
      assert.deepEqual(errors, []);
    } finally {
      server.close();
    }
  } finally {
    await browser.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("--no-states and pages without a state machine never need a browser", async () => {
  const dir = sides();
  try {
    const off = await diffWithStates("a", "b", { cwd: dir, out: join(dir, "off"), states: false });
    assert.equal(off.comparison.states, undefined);
    assert.equal(off.comparison.pages.find((p) => p.file === PAGE)!.states, undefined);
    // Without the machine, there is nothing to render.
    for (const side of ["a", "b"]) {
      const file = join(dir, side, PAGE);
      writeFileSync(file, readFileSync(file, "utf8").replace(/<script>[\s\S]*<\/script>/, ""));
    }
    const plain = await diffWithStates("a", "b", { cwd: dir, out: join(dir, "plain") });
    assert.equal(plain.comparison.states?.skipped, undefined);
    assert.ok(plain.comparison.pages.every((p) => !p.states));
    // The plain diff is unchanged.
    assert.deepEqual(diff("a", "b", { cwd: dir, out: join(dir, "sync") }).comparison.counts, plain.comparison.counts);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("screenshots that differ only by rendering noise look the same", async (t) => {
  let browser: Browser;
  try {
    browser = await launchBrowser(process.cwd());
  } catch {
    t.skip("Chromium is not installed");
    return;
  }
  try {
    const page = await browser.newPage({ viewport: { width: 40, height: 40 } });
    const shot = async (color: string) => {
      await page.setContent(`<body style="margin:0;background:${color}">`);
      return page.screenshot();
    };
    const base = await shot("rgb(100, 100, 100)");
    assert.ok(await looksSame(page, base, base));
    assert.ok(await looksSame(page, base, await shot("rgb(104, 100, 100)")));
    assert.equal(await looksSame(page, base, await shot("rgb(160, 100, 100)")), false);
  } finally {
    await browser.close();
  }
});

// A page that renders its default and each preset; `onState` runs on each
// snapshot the diff sends.
const machinePage = (onState = "") => `<!doctype html><html><body><p id="s"></p><script>
const machine = { states: ["one", "two"], presets: [{ name: "second", state: "two" }] };
let snap = { state: "one", context: {} };
const report = () => parent.postMessage({ type: "planchest:machine", ...machine, ...snap }, "*");
addEventListener("message", (e) => {
  if (e.data?.type !== "planchest:state") return;
  snap = { state: e.data.state, context: e.data.context };
  document.getElementById("s").textContent = snap.state;
  ${onState}
  report();
});
report();
</script></body></html>`;

test("a failure part way through leaves the plain diff and says why", async (t) => {
  try {
    const b = await launchBrowser(process.cwd());
    await b.close();
  } catch {
    t.skip("Chromium is not installed");
    return;
  }
  const dir = mkdtempSync(join(tmpdir(), "planchest-states-"));
  try {
    for (const side of ["a", "b"]) {
      mkdirSync(join(dir, side), { recursive: true });
      writeFileSync(join(dir, side, "1-fine.html"), machinePage());
      // Reloading while the diff waits for it breaks the comparison.
      writeFileSync(join(dir, side, "2-broken.html"), machinePage('if (snap.state === "two") location.reload();'));
    }
    const plain = diff("a", "b", { cwd: dir, out: join(dir, "plain") }).comparison;
    const report = await diffWithStates("a", "b", { cwd: dir, out: join(dir, "out") });
    assert.match(report.comparison.states?.skipped ?? "", /\S/);
    assert.ok(report.comparison.pages.every((p) => !p.states));
    assert.deepEqual(report.comparison.counts, plain.counts);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a state machine in a script the page loads is found too", () => {
  const dir = mkdtempSync(join(tmpdir(), "planchest-states-"));
  try {
    mkdirSync(join(dir, "run", "lib"), { recursive: true });
    writeFileSync(join(dir, "run", "lib", "machine.js"), 'parent.postMessage({ type: "planchest:machine" }, "*");');
    writeFileSync(join(dir, "run", "a.html"), '<script src="lib/machine.js?v=1"></script>');
    writeFileSync(join(dir, "run", "b.html"), "<script src=/run/lib/machine.js></script>");
    writeFileSync(join(dir, "run", "c.html"), '<script src="https://example.com/x.js"></script>');
    writeFileSync(join(dir, "run", "d.html"), '<script src="../../outside.js"></script>');
    writeFileSync(join(dir, "run", "e.html"), "<p>planchest:machine</p>");
    assert.deepEqual(
      ["a", "b", "c", "d", "e", "missing"].map((f) => mentionsMachine(dir, `run/${f}.html`)),
      [true, true, false, false, true, false],
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
