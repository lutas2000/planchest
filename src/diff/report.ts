// Build the report: `report.json` for machines, `index.html` for people.
// The page is one self-contained file; the data is embedded as JSON and
// the two sides are loaded into iframes from `a/` and `b/`.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Comparison } from "./compare.ts";
import { TEMPLATE } from "./template.ts";

export interface SideInfo {
  label: string;
  ref?: string;
  commit?: string;
}

export interface Report {
  /** Format version of report.json. */
  version: 1;
  generatedAt: string;
  a: SideInfo;
  b: SideInfo;
  paths?: string[];
  comparison: Comparison;
}

export function writeReport(outDir: string, report: Report): void {
  const json = JSON.stringify(report, null, 2);
  writeFileSync(join(outDir, "report.json"), json + "\n");
  // `</script>` inside the data would end the script block early.
  const embedded = json.replace(/</g, "\\u003c");
  writeFileSync(join(outDir, "index.html"), TEMPLATE.replace("__REPORT_JSON__", embedded));
  // The diff skill overwrites this with its summary; an empty file keeps
  // the page from requesting something that does not exist.
  writeFileSync(join(outDir, "summary.html"), "");
}
