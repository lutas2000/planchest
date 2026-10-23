import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { docNames, init } from "../src/init.ts";

const cli = new URL("../bin/planchest.js", import.meta.url).pathname;

test("init copies the template, restores .gitignore and keeps existing files", () => {
  const dir = mkdtempSync(join(tmpdir(), "planchest-init-"));
  try {
    writeFileSync(join(dir, "DESIGN.md"), "mine");
    const { created, skipped } = init(dir);
    assert.deepEqual(skipped, ["DESIGN.md"]);
    assert.equal(readFileSync(join(dir, "DESIGN.md"), "utf8"), "mine");
    assert.ok(created.includes(".gitignore"));
    assert.ok(!existsSync(join(dir, "gitignore")));
    assert.ok(existsSync(join(dir, "system/tokens/tokens.css")));
    assert.ok(existsSync(join(dir, "concepts/archive/.gitkeep")));
    assert.ok(!created.some((f) => f.endsWith(".DS_Store")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("docs lists and prints the design repo document", () => {
  assert.ok(docNames().includes("design-repo"));
  assert.match(execFileSync("node", [cli, "docs"], { encoding: "utf8" }), /^design-repo$/m);
  assert.match(execFileSync("node", [cli, "docs", "design-repo"], { encoding: "utf8" }), /^# The design repo/);
  assert.throws(() => execFileSync("node", [cli, "docs", "nope"], { stdio: "pipe" }), /no document "nope"/);
});
