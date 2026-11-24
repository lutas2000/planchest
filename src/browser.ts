// Headless Chromium for `planchest shots` and the state comparison in
// `planchest diff`. Playwright is optional: take the design repo's own copy
// first, then one installed next to planchest. PLANCHEST_BROWSER picks
// another Chromium executable.

import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const INSTALL =
  "this needs Playwright: run `npm install --save-dev playwright` and " +
  "`npx playwright install chromium` in the design repo, or set " +
  "PLANCHEST_BROWSER to a Chromium executable";

/** A launched Chromium; throws INSTALL when there is none. */
export async function launchBrowser(root: string): Promise<any> {
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
  try {
    return await chromium.launch(
      process.env.PLANCHEST_BROWSER ? { executablePath: process.env.PLANCHEST_BROWSER } : {},
    );
  } catch (err) {
    throw new Error(`${INSTALL}\n${err instanceof Error ? err.message.split("\n")[0] : err}`, {
      cause: err,
    });
  }
}

/** Run before a page's scripts: keep its last state machine report. */
export function captureMachine() {
  addEventListener("message", (e) => {
    if (e.data?.type === "planchest:machine") (window as any).__planchestMachine = e.data;
  });
}
