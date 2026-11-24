// Compare the states of pages that have a state machine. Each side's page
// is loaded in headless Chromium, shown in its default snapshot and in each
// preset, and screenshotted; a state whose screenshots differ is changed.
// Only pages whose HTML mentions `planchest:machine` are loaded, so a repo
// without state machines never needs a browser.

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { captureMachine, launchBrowser } from "../browser.ts";
import { applyPreset, readMachine } from "../machine.ts";
import type { Machine, Snapshot } from "../machine.ts";
import { readViewerConfig } from "../viewer/index.ts";
import type { Change, Comparison, PageDiff } from "./compare.ts";
import { serve } from "./serve.ts";

/** The id of the page's own first snapshot among a page's states. */
export const DEFAULT_STATE = "default";
const FALLBACK_VIEWPORT = { width: 1280, height: 800 };

interface Rendered {
  label?: string;
  snapshot: Snapshot;
  hash: string;
}

/** Every state worth comparing on one side: the default, then each preset. */
export function statesOf(machine: Machine): { id: string; label?: string; snapshot: Snapshot }[] {
  const defaults = { state: machine.state, context: machine.context };
  return [
    { id: DEFAULT_STATE, label: "Default", snapshot: defaults },
    ...machine.presets.map((p) => ({
      id: p.name,
      label: p.label,
      snapshot: applyPreset(defaults, p),
    })),
  ];
}

/** The viewport states are compared at: the Viewer's default, if B sets one. */
export function stateViewport(root: string) {
  try {
    const config = readViewerConfig(root);
    const v = config?.viewports?.find((v) => v.id === config.default) ?? config?.viewports?.[0];
    if (v) return { width: v.width, height: v.height };
  } catch {}
  return FALLBACK_VIEWPORT;
}

const sides = (p: PageDiff) =>
  (["a", "b"] as const).filter((s) => (s === "a" ? p.change !== "added" : p.change !== "removed"));

/**
 * Adds `states` to every page with a state machine, marks a page changed when
 * one of its states looks different, and records how the states were
 * compared. `out` is the report directory holding the two sides.
 */
export async function compareStates(
  out: string,
  comparison: Comparison,
  /** Where to look for the design repo's own Playwright first. */
  root = out,
): Promise<void> {
  const candidates = comparison.pages.filter((p) =>
    sides(p).some((side) => {
      const file = join(out, side, p.file);
      return existsSync(file) && readFileSync(file, "utf8").includes("planchest:machine");
    }),
  );
  const viewport = stateViewport(join(out, "b"));
  comparison.states = { viewport };
  if (!candidates.length) return;
  const browser = await launchBrowser(root);
  const { server, url } = await serve(out, 0);
  try {
    for (const p of candidates) {
      const rendered: Partial<Record<"a" | "b", Map<string, Rendered>>> = {};
      for (const side of sides(p)) {
        const page = await browser.newPage({ viewport });
        try {
          await page.addInitScript(captureMachine);
          await page.goto(`${url}${side}/${p.file.split("/").map(encodeURIComponent).join("/")}`, {
            waitUntil: "load",
          });
          await page.waitForFunction(() => (window as any).__planchestMachine, undefined, { timeout: 2000 }).catch(() => {});
          const machine = readMachine(await page.evaluate(() => (window as any).__planchestMachine));
          if (!machine) continue;
          const map = new Map<string, Rendered>();
          for (const s of statesOf(machine)) {
            await page.evaluate(async (snap: Snapshot) => {
              // Wait for the page's report of the new snapshot, or give up quietly.
              const echoed = new Promise<void>((done) => {
                const on = (e: MessageEvent) => {
                  if (e.data?.type !== "planchest:machine") return;
                  removeEventListener("message", on);
                  done();
                };
                addEventListener("message", on);
                setTimeout(done, 500);
              });
              postMessage({ type: "planchest:state", state: snap.state, context: snap.context }, "*");
              await echoed;
              await document.fonts.ready;
              await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            }, s.snapshot);
            const png = await page.screenshot({ fullPage: true, animations: "disabled" });
            map.set(s.id, {
              label: s.label,
              snapshot: s.snapshot,
              hash: createHash("sha1").update(png).digest("hex"),
            });
          }
          rendered[side] = map;
        } finally {
          await page.close();
        }
      }
      const { a, b } = rendered;
      if (!a && !b) continue;
      const ids = [...new Set([...(a?.keys() ?? []), ...(b?.keys() ?? [])])];
      p.states = ids.map((id) => {
        const ra = a?.get(id), rb = b?.get(id);
        const change: Change = !ra ? "added" : !rb ? "removed" : ra.hash === rb.hash ? "unchanged" : "changed";
        return {
          id,
          change,
          ...((rb ?? ra)!.label && { label: (rb ?? ra)!.label }),
          ...(ra && { a: ra.snapshot }),
          ...(rb && { b: rb.snapshot }),
        };
      });
      // Same HTML can still look different, such as after a token change.
      if (p.change === "unchanged" && p.states.some((s) => s.change !== "unchanged")) {
        comparison.counts.unchanged--;
        comparison.counts.changed++;
        p.change = "changed";
      }
    }
  } finally {
    server.close();
    await browser.close();
  }
}
