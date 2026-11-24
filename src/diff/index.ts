// `planchest diff`: resolve both sides, compare, copy them into the
// report directory and write the report. Worktrees are removed before
// this returns, whether or not it succeeds.

import { mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { compare } from "./compare.ts";
import { copyRoot } from "./copy.ts";
import { snapshot } from "./pages.ts";
import { writeReport, type Report } from "./report.ts";
import { resolveSource } from "./sources.ts";
import { compareStates } from "./states.ts";

export interface DiffOptions {
  cwd: string;
  out: string;
  repo?: string;
  paths?: string[];
  /** Compare the states of pages with a state machine (default true). */
  states?: boolean;
}

export function diff(specA: string, specB: string, opts: DiffOptions): Report {
  const a = resolveSource(specA, opts);
  let b;
  try {
    b = resolveSource(specB, opts);
  } catch (err) {
    a.cleanup();
    throw err;
  }
  try {
    const comparison = compare(snapshot(a.root), snapshot(b.root), opts.paths);
    const out = resolve(opts.cwd, opts.out);
    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    copyRoot(a.root, join(out, "a"));
    copyRoot(b.root, join(out, "b"));
    const report: Report = {
      version: 1,
      generatedAt: new Date().toISOString(),
      a: { label: a.label, ref: a.ref, commit: a.commit },
      b: { label: b.label, ref: b.ref, commit: b.commit },
      comparison,
    };
    if (opts.paths?.length) report.paths = opts.paths;
    writeReport(out, report);
    return report;
  } finally {
    a.cleanup();
    b.cleanup();
  }
}

/**
 * `diff`, then the states of pages with a state machine, rendered in a
 * browser. Without a browser the report says the states were skipped.
 */
export async function diffWithStates(specA: string, specB: string, opts: DiffOptions): Promise<Report> {
  const report = diff(specA, specB, opts);
  if (opts.states === false) return report;
  const out = resolve(opts.cwd, opts.out);
  try {
    await compareStates(out, report.comparison, opts.cwd);
  } catch (err) {
    report.comparison.states = {
      ...report.comparison.states,
      skipped: err instanceof Error ? err.message.split("\n")[0] : String(err),
    };
  }
  writeReport(out, report);
  return report;
}
