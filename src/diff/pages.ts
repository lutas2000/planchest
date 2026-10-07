// Walk one side of a diff and describe every file in it. HTML files are
// pages; a page may be split into sections with `data-page` so one
// concept index.html can hold several screens.

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { relPath } from "./sources.ts";

/** Directories never compared or copied. */
export const SKIPPED_DIRS = new Set([".git", "node_modules", ".planchest"]);

export interface Section {
  id: string;
  hash: string;
}

export interface Page {
  /** Path relative to the source root. */
  file: string;
  hash: string;
  /** `data-page` sections, in document order. Empty for single-screen pages. */
  sections: Section[];
  /** `status:` from the SPEC.md next to the page, if any. */
  status?: string;
  /** `<title>` text, if any. */
  title?: string;
}

export interface FileEntry {
  file: string;
  hash: string;
}

export interface Snapshot {
  pages: Page[];
  /** Every non-HTML file, so the report can list changes outside pages. */
  files: FileEntry[];
}

function sha(text: string | Buffer): string {
  return createHash("sha1").update(text).digest("hex").slice(0, 12);
}

export function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRS.has(entry.name)) continue;
      yield* walk(join(dir, entry.name));
    } else if (entry.isFile()) {
      yield join(dir, entry.name);
    }
  }
}

/** Split out each `<section data-page="…">…</section>`, nesting-aware. */
export function extractSections(html: string): Section[] {
  const sections: Section[] = [];
  const open = /<section\b[^>]*\bdata-page\s*=\s*"([^"]+)"[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = open.exec(html))) {
    const start = m.index;
    let depth = 1;
    let pos = open.lastIndex;
    const tag = /<\/?section\b[^>]*>/g;
    tag.lastIndex = pos;
    let t: RegExpExecArray | null;
    let end = html.length;
    while ((t = tag.exec(html))) {
      depth += t[0].startsWith("</") ? -1 : 1;
      if (depth === 0) {
        end = tag.lastIndex;
        break;
      }
    }
    sections.push({ id: m[1], hash: sha(html.slice(start, end)) });
    open.lastIndex = end;
  }
  return sections;
}

function specStatus(dir: string): string | undefined {
  const spec = join(dir, "SPEC.md");
  if (!existsSync(spec)) return undefined;
  const m = /^status:\s*([^\s#]+)/m.exec(readFileSync(spec, "utf8"));
  return m?.[1];
}

export function snapshot(root: string): Snapshot {
  const pages: Page[] = [];
  const files: FileEntry[] = [];
  for (const abs of walk(root)) {
    const file = relPath(root, abs);
    if (abs.endsWith(".html") || abs.endsWith(".htm")) {
      const html = readFileSync(abs, "utf8");
      const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1].trim() || undefined;
      pages.push({
        file,
        hash: sha(html),
        sections: extractSections(html),
        status: specStatus(dirname(abs)),
        title,
      });
    } else {
      files.push({ file, hash: sha(readFileSync(abs)) });
    }
  }
  pages.sort((a, b) => a.file.localeCompare(b.file));
  files.sort((a, b) => a.file.localeCompare(b.file));
  return { pages, files };
}

export function fileSize(path: string): number {
  return statSync(path).size;
}
