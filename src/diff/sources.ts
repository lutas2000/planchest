// A source is one side of a diff: a directory on disk, or a git ref
// (optionally narrowed to a path inside the repo) checked out into a
// temporary worktree. Both end up as a plain root directory.

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, isAbsolute, join, relative, resolve } from "node:path";

export interface Source {
  /** What the report calls this side. */
  label: string;
  /** Directory whose files are compared. */
  root: string;
  /** Git ref when this side came from history. */
  ref?: string;
  /** Short commit id for a ref. */
  commit?: string;
  /** Remove any worktree created for this side. Safe to call twice. */
  cleanup(): void;
}

export interface ResolveOptions {
  /** Working directory used to resolve relative paths. */
  cwd: string;
  /** Repository used for refs. Defaults to the one containing cwd. */
  repo?: string;
}

function git(repo: string, args: string[]): string {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function repoToplevel(cwd: string): string | undefined {
  try {
    return git(cwd, ["rev-parse", "--show-toplevel"]);
  } catch {
    return undefined;
  }
}

function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

/**
 * Turn a command-line spec into a Source.
 *
 * - An existing directory is used as is.
 * - `<ref>` checks that commit out into a worktree.
 * - `<ref>:<path>` does the same and compares only `<path>` under it.
 */
export function resolveSource(spec: string, opts: ResolveOptions): Source {
  const asDir = resolve(opts.cwd, spec);
  if (isDirectory(asDir)) {
    const label = isAbsolute(spec) ? basename(spec) : spec.replace(/\/+$/, "");
    return { label, root: asDir, cleanup() {} };
  }

  const found = opts.repo ? resolve(opts.cwd, opts.repo) : repoToplevel(opts.cwd);
  if (!found) {
    throw new Error(`"${spec}" is not a directory and there is no git repository here to read it as a ref.`);
  }
  const repo: string = found;

  const colon = spec.indexOf(":");
  const ref = colon === -1 ? spec : spec.slice(0, colon);
  const sub = colon === -1 ? "" : spec.slice(colon + 1).replace(/^\/+|\/+$/g, "");

  let commit: string;
  try {
    commit = git(repo, ["rev-parse", "--short", "--verify", `${ref}^{commit}`]);
  } catch {
    throw new Error(`"${spec}" is neither a directory nor a commit in ${repo}.`);
  }

  const worktree = mkdtempSync(join(tmpdir(), "planchest-"));
  rmSync(worktree, { recursive: true, force: true });
  git(repo, ["worktree", "add", "--detach", "--quiet", worktree, commit]);

  const root = sub ? join(worktree, sub) : worktree;
  if (!isDirectory(root)) {
    cleanup();
    throw new Error(`"${sub}" does not exist at ${ref} (${commit}).`);
  }

  let done = false;
  function cleanup() {
    if (done) return;
    done = true;
    try {
      git(repo, ["worktree", "remove", "--force", worktree]);
    } catch {
      rmSync(worktree, { recursive: true, force: true });
      try {
        git(repo, ["worktree", "prune"]);
      } catch {
        // The repository may be gone; nothing left to prune.
      }
    }
  }

  return { label: spec, root, ref, commit, cleanup };
}

/** Path of `file` relative to `root`, with forward slashes. */
export function relPath(root: string, file: string): string {
  return relative(root, file).split("\\").join("/");
}
