// Copy one side's files into the report directory so the report is
// self-contained: `out/a/…` and `out/b/…` sit next to `out/index.html`.

import { cpSync, mkdirSync, rmSync } from "node:fs";
import { basename } from "node:path";
import { SKIPPED_DIRS } from "./pages.ts";

export function copyRoot(root: string, dest: string): void {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(root, dest, {
    recursive: true,
    dereference: true,
    filter: (src) => !SKIPPED_DIRS.has(basename(src)),
  });
}
