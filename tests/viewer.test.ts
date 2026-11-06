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
