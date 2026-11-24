// Screenshots for the flow map. The sitemap marks each screenshot with an
// <img data-shot="../prototypes/run/start.html" src="shots/run-start.png">;
// this renders every data-shot page in a headless browser and writes the
// PNG to the img's src, so the sitemap stays a plain static page.

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "parse5";
import { serve } from "./diff/serve.ts";
import { applyPreset, readMachine } from "./machine.ts";
import type { Context, Snapshot } from "./machine.ts";

export const DEFAULT_SITEMAP = "flows/sitemap.html";
const DEFAULT_VIEWPORT = { width: 390, height: 844 };

export interface Shot {
  /** The page to render, relative to the repo root, with any #section. */
  page: string;
  /** Where the PNG goes, relative to the repo root. */
  out: string;
  width: number;
  height: number;
  /**
   * The state machine snapshot to show first: data-preset picks a preset,
   * data-state a state, and data-context (a JSON object) is merged over the
   * context, in that order.
   */
  preset?: string;
  state?: string;
  context?: Context;
}

/** The snapshot a shot asks for, on top of the page's report. */
export function shotSnapshot(shot: Shot, data: unknown): Snapshot | undefined {
  if (!shot.preset && !shot.state && !shot.context) return;
  const machine = readMachine(data);
  if (!machine) throw new Error(`${shot.page} reports no state machine, so data-preset, data-state and data-context have nothing to set`);
  let snap: Snapshot = { state: machine.state, context: machine.context };
  if (shot.preset) {
    const preset = machine.presets.find((p) => p.name === shot.preset);
    if (!preset) throw new Error(`${shot.page} has no preset "${shot.preset}"`);
    snap = applyPreset(snap, preset);
  }
  if (shot.state) {
    if (!machine.states.some((s) => s.id === shot.state))
      throw new Error(`${shot.page} has no state "${shot.state}"`);
    snap = { ...snap, state: shot.state };
  }
  if (shot.context) snap = { ...snap, context: { ...snap.context, ...shot.context } };
  return snap;
}

function attr(node: any, name: string): string | undefined {
  return node.attrs?.find((a: any) => a.name === name)?.value;
}

function viewport(value: string | undefined) {
  const m = /^\s*(\d+)\s*[x×]\s*(\d+)\s*$/.exec(value ?? "");
  return m ? { width: Number(m[1]), height: Number(m[2]) } : undefined;
}

function inside(root: string, file: string): boolean {
  const rel = relative(root, file);
  return rel !== "" && !rel.startsWith(".." + sep) && rel !== ".." && !isAbsolute(rel);
}

/** Every screenshot the sitemap asks for, in document order. */
export function collectShots(root: string, sitemap = DEFAULT_SITEMAP): Shot[] {
  root = resolve(root);
  const file = resolve(root, sitemap);
  if (!existsSync(file)) throw new Error(`no sitemap at ${sitemap}`);
  const base = new URL(relative(root, file).split(sep).join("/"), "http://repo/");
  const shots: Shot[] = [];
  // data-viewport is inherited, so a whole section can be set at once.
  function walk(node: any, size: { width: number; height: number }) {
    size = viewport(attr(node, "data-viewport")) ?? size;
    const page = node.tagName === "img" ? attr(node, "data-shot") : undefined;
    if (page) {
      const src = attr(node, "src");
      if (!src || !src.endsWith(".png")) throw new Error(`data-shot="${page}" needs a .png src`);
      const target = new URL(page, base), png = new URL(src, base);
      if (target.host !== "repo" || png.host !== "repo")
        throw new Error(`data-shot="${page}" must use relative paths`);
      const out = decodeURIComponent(png.pathname.slice(1));
      if (!inside(root, resolve(root, out))) throw new Error(`${src} is outside the repo`);
      if (attr(node, "data-set") !== undefined)
        throw new Error(`data-shot="${page}": data-set is gone; use data-preset, data-state or data-context`);
      const shot: Shot = { page: target.pathname.slice(1) + target.hash, out, ...size };
      const preset = attr(node, "data-preset")?.trim(), state = attr(node, "data-state")?.trim();
      if (preset) shot.preset = preset;
      if (state) shot.state = state;
      const context = attr(node, "data-context");
      if (context !== undefined) {
        let value: unknown;
        try {
          value = JSON.parse(context);
        } catch {}
        if (typeof value !== "object" || value === null || Array.isArray(value))
          throw new Error(`data-shot="${page}": data-context must be a JSON object`);
        shot.context = value as Context;
      }
      shots.push(shot);
    }
    node.childNodes?.forEach((child: any) => walk(child, size));
    if (node.content) walk(node.content, size);
  }
  walk(parse(readFileSync(file, "utf8")), DEFAULT_VIEWPORT);
  return shots;
}

const INSTALL =
  "screenshots need Playwright: run `npm install --save-dev playwright` and " +
  "`npx playwright install chromium` in the design repo, or set " +
  "PLANCHEST_BROWSER to a Chromium executable";

/**
 * Renders the sitemap's screenshots. A page section (`#id` naming a
 * `section[data-page]`) is shot on its own, as the diff report shows it.
 */
export async function takeShots(
  root: string,
  sitemap = DEFAULT_SITEMAP,
  log: (line: string) => void = () => {},
): Promise<Shot[]> {
  root = resolve(root);
  const shots = collectShots(root, sitemap);
  if (!shots.length) return shots;
  // Playwright is optional and only needed here: take the design repo's
  // own copy first, then one installed next to planchest.
  let chromium;
  const pick = (mod: any) => mod.chromium ?? mod.default?.chromium;
  try {
    const local = createRequire(join(root, "package.json")).resolve("playwright");
    chromium = pick(await import(pathToFileURL(local).href));
  } catch {}
  if (!chromium) {
    try {
      const name = "playwright";
      chromium = pick(await import(name));
    } catch {}
  }
  if (!chromium) throw new Error(INSTALL);
  let browser;
  try {
    browser = await chromium.launch(
      process.env.PLANCHEST_BROWSER ? { executablePath: process.env.PLANCHEST_BROWSER } : {},
    );
  } catch (err) {
    throw new Error(`${INSTALL}\n${err instanceof Error ? err.message.split("\n")[0] : err}`);
  }
  const { server, url } = await serve(root, 0);
  try {
    for (const shot of shots) {
      const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
      // At the top level a page's report to its parent comes back to itself.
      await page.addInitScript(() =>
        addEventListener("message", (e) => {
          if (e.data?.type === "planchest:machine") (window as any).__planchestMachine = e.data;
        }),
      );
      await page.goto(new URL(shot.page, url).href, { waitUntil: "load" });
      const section = decodeURIComponent(new URL(shot.page, url).hash.slice(1));
      if (section)
        await page.evaluate((id: string) => {
          const all = [...document.querySelectorAll("section[data-page]")];
          if (!all.some((s) => s.getAttribute("data-page") === id)) return;
          for (const s of all) if (s.getAttribute("data-page") !== id) (s as HTMLElement).style.display = "none";
          scrollTo(0, 0);
        }, section);
      let snap: Snapshot | undefined;
      if (shot.preset || shot.state || shot.context) {
        await page
          .waitForFunction(() => (window as any).__planchestMachine, undefined, { timeout: 2000 })
          .catch(() => {});
        snap = shotSnapshot(shot, await page.evaluate(() => (window as any).__planchestMachine));
        await page.evaluate(
          (s: Snapshot) => postMessage({ type: "planchest:state", state: s.state, context: s.context }, "*"),
          snap!,
        );
      }
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(snap ? 300 : 100);
      mkdirSync(dirname(join(root, shot.out)), { recursive: true });
      await page.screenshot({ path: join(root, shot.out) });
      await page.close();
      log(`${shot.out}  ←  ${shot.page}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
  return shots;
}
