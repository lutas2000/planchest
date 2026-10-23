import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";

// The package root holds template/ and docs/ both in a checkout (src/) and in
// the npm package (dist/).
export const ROOT = new URL("../", import.meta.url).pathname;
export const TEMPLATE = join(ROOT, "template");
export const DOCS = join(ROOT, "docs");

// npm drops .gitignore from packages, so the template keeps it under this name.
const RENAMES: Record<string, string> = { gitignore: ".gitignore" };

export interface InitResult {
  created: string[];
  skipped: string[];
}

/** Copy the template into `target`, never overwriting a file that exists. */
export function init(target: string): InitResult {
  const result: InitResult = { created: [], skipped: [] };
  for (const from of walk(TEMPLATE)) {
    const rel = relative(TEMPLATE, from);
    const name = RENAMES[rel] ?? rel;
    const to = join(target, name);
    if (existsSync(to)) {
      result.skipped.push(name);
      continue;
    }
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    result.created.push(name);
  }
  return result;
}

/** Names of the documents `planchest docs` can print, without `.md`. */
export function docNames(): string[] {
  return readdirSync(DOCS, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name.slice(0, -3))
    .sort();
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.name !== ".DS_Store")
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}
