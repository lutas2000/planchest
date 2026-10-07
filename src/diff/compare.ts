// Compare two snapshots file by file. The result is what the report
// renders and what `report.json` holds for the diff skill.

import type { Page, Snapshot } from "./pages.ts";

export type Change = "added" | "removed" | "changed" | "unchanged";

export interface SectionDiff {
  id: string;
  change: Change;
}

export interface PageDiff {
  file: string;
  change: Change;
  /** Present when either side has `data-page` sections. */
  sections?: SectionDiff[];
  status?: { a?: string; b?: string };
  title?: string;
}

export interface FileDiff {
  file: string;
  change: Exclude<Change, "unchanged">;
}

export interface Comparison {
  pages: PageDiff[];
  /** Non-page files that differ. */
  files: FileDiff[];
  counts: Record<Change, number>;
}

function diffSections(a?: Page, b?: Page): SectionDiff[] | undefined {
  const as = a?.sections ?? [];
  const bs = b?.sections ?? [];
  if (as.length === 0 && bs.length === 0) return undefined;
  const ids = [...new Set([...as.map((s) => s.id), ...bs.map((s) => s.id)])];
  return ids.map((id) => {
    const sa = as.find((s) => s.id === id);
    const sb = bs.find((s) => s.id === id);
    const change: Change = !sa ? "added" : !sb ? "removed" : sa.hash === sb.hash ? "unchanged" : "changed";
    return { id, change };
  });
}

export function compare(a: Snapshot, b: Snapshot, paths?: string[]): Comparison {
  const inScope = (file: string) =>
    !paths || paths.length === 0 || paths.some((p) => file === p || file.startsWith(p.replace(/\/+$/, "") + "/"));

  const byFileA = new Map(a.pages.map((p) => [p.file, p]));
  const byFileB = new Map(b.pages.map((p) => [p.file, p]));
  const pageFiles = [...new Set([...byFileA.keys(), ...byFileB.keys()])].filter(inScope).sort();

  const counts: Record<Change, number> = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  const pages: PageDiff[] = pageFiles.map((file) => {
    const pa = byFileA.get(file);
    const pb = byFileB.get(file);
    const change: Change = !pa ? "added" : !pb ? "removed" : pa.hash === pb.hash ? "unchanged" : "changed";
    counts[change]++;
    const diff: PageDiff = { file, change };
    const sections = diffSections(pa, pb);
    if (sections) diff.sections = sections;
    if (pa?.status || pb?.status) diff.status = { a: pa?.status, b: pb?.status };
    const title = pb?.title ?? pa?.title;
    if (title) diff.title = title;
    return diff;
  });

  const filesA = new Map(a.files.map((f) => [f.file, f.hash]));
  const filesB = new Map(b.files.map((f) => [f.file, f.hash]));
  const files: FileDiff[] = [];
  for (const file of [...new Set([...filesA.keys(), ...filesB.keys()])].filter(inScope).sort()) {
    const ha = filesA.get(file);
    const hb = filesB.get(file);
    if (ha === hb) continue;
    files.push({ file, change: !ha ? "added" : !hb ? "removed" : "changed" });
  }

  return { pages, files, counts };
}
