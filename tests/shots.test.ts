import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectShots } from "../src/shots.ts";
import { buildCatalog } from "../src/viewer/index.ts";

function repo(sitemap: string) {
  const root = mkdtempSync(join(tmpdir(), "shots-"));
  mkdirSync(join(root, "flows/shots"), { recursive: true });
  writeFileSync(join(root, "flows/sitemap.html"), sitemap);
  return root;
}

test("the sitemap's data-shot images become screenshot jobs relative to the repo", () => {
  const root = repo(`<!doctype html><body>
    <img src="shots/a.png" data-shot="../prototypes/run/start.html">
    <section data-viewport="1440x900">
      <img src="shots/b.png" data-shot="../concepts/home/index.html#today" data-set="state=paused; unit = km">
      <img src="shots/c.png" data-shot="../prototypes/x.html" data-viewport="320x568">
    </section>
    <img src="shots/plain.png">
  </body>`);
  try {
    assert.deepEqual(collectShots(root), [
      { page: "prototypes/run/start.html", out: "flows/shots/a.png", width: 390, height: 844, set: [] },
      {
        page: "concepts/home/index.html#today",
        out: "flows/shots/b.png",
        width: 1440,
        height: 900,
        set: [["state", "paused"], ["unit", "km"]],
      },
      { page: "prototypes/x.html", out: "flows/shots/c.png", width: 320, height: 568, set: [] },
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("screenshots must be PNGs inside the repo, from relative pages", () => {
  for (const [img, message] of [
    [`<img src="shots/a.jpg" data-shot="../p.html">`, /needs a \.png src/],
    [`<img src="shots/a.png" data-shot="https://example.com/">`, /relative paths/],
  ] as const) {
    const root = repo(img);
    try {
      assert.throws(() => collectShots(root), message);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("paths that climb above the repo stay inside it", () => {
  const root = repo(`<img src="../../../outside.png" data-shot="../../../p.html">`);
  try {
    const [shot] = collectShots(root);
    assert.equal(shot.out, "outside.png");
    assert.equal(shot.page, "p.html");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("flow map screenshots are not listed as library entries", () => {
  const root = repo("<title>Sitemap</title>");
  try {
    writeFileSync(join(root, "flows/shots/a.png"), "");
    const files = buildCatalog(root).entries.map((e) => e.file);
    assert.deepEqual(files, ["flows/sitemap.html"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
