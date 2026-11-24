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

export const DEFAULT_SITEMAP = "flows/sitemap.html";
const DEFAULT_VIEWPORT = { width: 390, height: 844 };

export interface Shot {
  /** The page to render, relative to the repo root, with any #section. */
  page: string;
  /** Where the PNG goes, relative to the repo root. */
  out: string;
  width: number;
  height: number;
  /** Page controls to set first, from data-set="name=value; name=value". */
  set: [string, string][];
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
      const set = (attr(node, "data-set") ?? "")
        .split(";")
        .map((pair) => pair.split("=").map((s) => s.trim()))
        .filter((pair): pair is [string, string] => pair.length === 2 && !!pair[0]);
      shots.push({ page: target.pathname.slice(1) + target.hash, out, ...size, set });
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
      await page.goto(new URL(shot.page, url).href, { waitUntil: "load" });
      const section = decodeURIComponent(new URL(shot.page, url).hash.slice(1));
      if (section)
        await page.evaluate((id: string) => {
          const all = [...document.querySelectorAll("section[data-page]")];
          if (!all.some((s) => s.getAttribute("data-page") === id)) return;
          for (const s of all) if (s.getAttribute("data-page") !== id) (s as HTMLElement).style.display = "none";
          scrollTo(0, 0);
        }, section);
      for (const [name, value] of shot.set)
        await page.evaluate(
          ([name, value]: string[]) => postMessage({ type: "planchest:set", name, value }, "*"),
          [name, value],
        );
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(shot.set.length ? 300 : 100);
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
