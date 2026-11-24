import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));

test("package.json, package-lock.json and the plugin manifest give the same version", () => {
  const { version } = read("package.json");
  const lock = read("package-lock.json");
  assert.equal(lock.version, version, "package-lock.json");
  assert.equal(lock.packages[""].version, version, 'package-lock.json packages[""]');
  assert.equal(read(".claude-plugin/plugin.json").version, version, ".claude-plugin/plugin.json");
});
