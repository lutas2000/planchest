import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { compare } from "../src/diff/compare.ts";
import { diff } from "../src/diff/index.ts";
import { extractSections, snapshot } from "../src/diff/pages.ts";

const fixtures = new URL("./fixtures/", import.meta.url).pathname;
const A = join(fixtures, "a");
const B = join(fixtures, "b");

test("extractSections is nesting-aware and keeps document order", () => {
  const html = `<section data-page="x"><section><p>inner</p></section></section><section data-page="y"></section>`;
  const [x, y] = extractSections(html);
  assert.equal(x.id, "x");
  assert.equal(y.id, "y");
  assert.notEqual(x.hash, y.hash);
});

test("snapshot reads pages, sections and SPEC status", () => {
  const snap = snapshot(A);
  const signup = snap.pages.find((p) => p.file === "prototypes/onboarding/signup.html")!;
  assert.equal(signup.status, "review");
  assert.equal(signup.title, "Sign up");
  const dash = snap.pages.find((p) => p.file === "concepts/dashboard/index.html")!;
  assert.deepEqual(dash.sections.map((s) => s.id), ["overview", "settings"]);
  assert.ok(snap.files.some((f) => f.file === "system/tokens/tokens.css"));
});

test("compare classifies pages, sections and other files", () => {
  const c = compare(snapshot(A), snapshot(B));
  const byFile = Object.fromEntries(c.pages.map((p) => [p.file, p]));
  assert.equal(byFile["prototypes/onboarding/signup.html"].change, "changed");
  assert.deepEqual(byFile["prototypes/onboarding/signup.html"].status, { a: "review", b: "approved" });
  assert.equal(byFile["prototypes/onboarding/verify.html"].change, "removed");
  assert.equal(byFile["prototypes/onboarding/welcome.html"].change, "added");
  assert.deepEqual(
    byFile["concepts/dashboard/index.html"].sections,
    [
      { id: "overview", change: "changed" },
      { id: "settings", change: "unchanged" },
      { id: "billing", change: "added" },
    ],
  );
  assert.deepEqual(c.counts, { added: 1, removed: 1, changed: 2, unchanged: 0 });
  assert.deepEqual(c.files.map((f) => f.file), ["prototypes/onboarding/SPEC.md", "system/tokens/tokens.css"]);
});

test("compare honours --paths", () => {
  const c = compare(snapshot(A), snapshot(B), ["concepts"]);
  assert.deepEqual(c.pages.map((p) => p.file), ["concepts/dashboard/index.html"]);
  assert.deepEqual(c.files, []);
});

test("diff between directories writes a self-contained report", () => {
  const out = mkdtempSync(join(tmpdir(), "planchest-test-"));
  try {
    const report = diff(A, B, { cwd: fixtures, out });
    assert.equal(report.a.label, "a");
    assert.equal(report.b.label, "b");
    assert.ok(existsSync(join(out, "index.html")));
    assert.ok(existsSync(join(out, "a/prototypes/onboarding/signup.html")));
    assert.ok(existsSync(join(out, "b/prototypes/onboarding/welcome.html")));
    const json = JSON.parse(readFileSync(join(out, "report.json"), "utf8"));
    assert.equal(json.version, 1);
    assert.equal(json.comparison.counts.changed, 2);
    const page = readFileSync(join(out, "index.html"), "utf8");
    assert.ok(page.includes('"prototypes/onboarding/signup.html"'));
    // summary.html links like #file:section only work if the page follows the hash after load
    assert.match(page, /addEventListener\("hashchange", showHash\)/);
    // three panels (files, preview, summary) and a zoom control
    assert.match(page, /<nav id="nav">/);
    assert.match(page, /<aside id="summary">/);
    assert.match(page, /id="zoom"/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("diff between git refs uses worktrees and removes them", () => {
  const repo = mkdtempSync(join(tmpdir(), "planchest-repo-"));
  const out = join(repo, ".planchest", "diff");
  const git = (...args: string[]) =>
    execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  try {
    git("init", "-q", "-b", "main");
    git("config", "user.email", "t@example.com");
    git("config", "user.name", "t");
    cpSync(A, repo, { recursive: true });
    git("add", "-A");
    git("commit", "-qm", "a");
    git("tag", "v1");
    rmSync(join(repo, "prototypes"), { recursive: true });
    rmSync(join(repo, "concepts"), { recursive: true });
    cpSync(B, repo, { recursive: true });
    git("add", "-A");
    git("commit", "-qm", "b");

    const report = diff("v1", "HEAD", { cwd: repo, out });
    assert.equal(report.a.ref, "v1");
    assert.ok(report.b.commit);
    assert.equal(report.comparison.counts.added, 1);
    assert.equal(git("worktree", "list").split("\n").length, 1, "worktrees were cleaned up");

    const scoped = diff("v1:concepts", "HEAD:concepts", { cwd: repo, out });
    assert.deepEqual(scoped.comparison.pages.map((p) => p.file), ["dashboard/index.html"]);
    assert.equal(git("worktree", "list").split("\n").length, 1);

    assert.throws(() => diff("v1", "nope", { cwd: repo, out }), /neither a directory nor a commit/);
    assert.equal(git("worktree", "list").split("\n").length, 1, "worktree of the first side is removed on failure");
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
