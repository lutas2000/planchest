import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { buildCatalog, publishViewer } from "../src/viewer/index.ts";
test("catalog discovers real design content and parsed sections without exposing unrelated files", () => {
  const root = mkdtempSync(join(tmpdir(), "viewer-"));
  try {
    mkdirSync(join(root, "concepts/demo"), { recursive: true });
    writeFileSync(
      join(root, "concepts/demo/index.html"),
      '<title>\n  A &amp; B\n</title><svg><title>Icon</title></svg><section data-page="one"></section>',
    );
    writeFileSync(
      join(root, "concepts/demo/SPEC.md"),
      "status: review\n# Demo",
    );
    writeFileSync(join(root, ".env"), "SECRET");
    symlinkSync("/etc", join(root, "system"));
    const catalog = buildCatalog(root);
    const page = catalog.entries.find((e) => e.format === "html")!;
    assert.equal(page.title, "A & B");
    assert.equal(page.status, "review");
    assert.deepEqual(page.sections, ["one"]);
    assert.equal(page.spec, "concepts/demo/SPEC.md");
    assert.equal(catalog.entries.length, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("prototypes have no catalog status, including legacy specs and platform paths", () => {
  const root = mkdtempSync(join(tmpdir(), "viewer-prototype-"));
  try {
    const files: string[] = [];
    for (const [dir, spec] of [
      ["prototypes/legacy", "status: draft\n# Legacy"],
      ["prototypes/current", "# Current"],
      ["web/prototypes/demo", "status: review\n# Web"],
      ["products/app/mobile/prototypes/demo", "status: approved\n# Mobile"],
    ]) {
      mkdirSync(join(root, dir), { recursive: true });
      writeFileSync(join(root, dir, "index.html"), "<title>Prototype</title>");
      writeFileSync(join(root, dir, "SPEC.md"), spec);
      files.push(`${dir}/index.html`, `${dir}/SPEC.md`);
    }
    // Pass the file list explicitly to exercise metadata for nested platform paths.
    const entries = buildCatalog(root, files).entries;
    assert.ok(entries.length > 0);
    for (const entry of entries) {
      assert.equal(entry.status, undefined, entry.file);
    }
    assert.ok(entries.some((e) => e.file === "prototypes/current/index.html"));
    assert.ok(entries.some((e) => e.file === "web/prototypes/demo/index.html"));
    assert.ok(entries.some((e) => e.file === "products/app/mobile/prototypes/demo/index.html"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("publication preserves assets, protects input and refuses unrelated output", () => {
  const root = mkdtempSync(join(tmpdir(), "viewer-publish-"));
  const source = resolve("examples/stride/a");
  try {
    const out = join(root, "export");
    publishViewer(source, out);
    assert.ok(existsSync(join(out, "repo/prototypes/run/start.html")));
    assert.equal(
      readFileSync(join(out, "repo/prototypes/run/start.html"), "utf8"),
      readFileSync(join(source, "prototypes/run/start.html"), "utf8"),
    );
    assert.ok(existsSync(join(out, "assets")));
    publishViewer(source, out);
    assert.ok(publishViewer(source, join(root, "deep/nested/out")).entries.length);
    assert.throws(() => publishViewer(source, source), /output/);
    assert.throws(() => publishViewer(source, join(source, "prototypes/out")), /output/);
    const unrelated = join(root, "unrelated");
    mkdirSync(unrelated);
    writeFileSync(join(unrelated, "keep"), "keep");
    assert.throws(() => publishViewer(source, unrelated), /unrelated/);
    assert.equal(readFileSync(join(unrelated, "keep"), "utf8"), "keep");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("viewer settings come from planchest.json and are validated", () => {
  const root = mkdtempSync(join(tmpdir(), "viewer-config-"));
  try {
    mkdirSync(join(root, "prototypes/a"), { recursive: true });
    writeFileSync(join(root, "prototypes/a/index.html"), "<title>A</title>");
    assert.equal(buildCatalog(root).viewer, undefined);
    writeFileSync(
      join(root, "planchest.json"),
      JSON.stringify({
        viewer: {
          viewports: [
            { id: "320", label: "Smallest", width: 320, height: 568 },
            { id: "390", width: 390, height: 844 },
          ],
          default: "390",
          compare: ["320", "390"],
        },
      }),
    );
    const viewer = buildCatalog(root).viewer!;
    assert.equal(viewer.default, "390");
    assert.deepEqual(viewer.compare, ["320", "390"]);
    assert.equal(viewer.viewports![1].label, "390 × 844");
    for (const bad of [
      { viewports: [] },
      { viewports: [{ id: "fill", width: 1, height: 1 }] },
      { viewports: [{ id: "a", width: 0, height: 1 }] },
      { viewports: [{ id: "a", width: 1, height: 1 }], default: "b" },
      { viewports: [{ id: "a", width: 1, height: 1 }], compare: ["a"] },
    ]) {
      writeFileSync(join(root, "planchest.json"), JSON.stringify({ viewer: bad }));
      assert.throws(() => buildCatalog(root), /planchest\.json viewer/);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("served previews may fetch design files from an opaque origin only", async () => {
  const { serve } = await import("../src/diff/serve.ts");
  const root = mkdtempSync(join(tmpdir(), "viewer-serve-"));
  mkdirSync(join(root, "repo"), { recursive: true });
  writeFileSync(join(root, "repo/strings.json"), "{}");
  writeFileSync(join(root, "index.html"), "<title>Viewer</title>");
  const { server, url } = await serve(root, 0);
  try {
    const repo = await fetch(url + "repo/strings.json");
    assert.equal(repo.headers.get("access-control-allow-origin"), "null");
    const shell = await fetch(url + "index.html");
    assert.equal(shell.headers.get("access-control-allow-origin"), null);
  } finally {
    server.close();
    rmSync(root, { recursive: true, force: true });
  }
});
