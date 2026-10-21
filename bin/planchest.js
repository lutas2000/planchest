#!/usr/bin/env node
// A git checkout (and so the Claude Code plugin) runs the TypeScript source
// directly; Node strips the types. The npm package ships only the compiled
// dist/, because Node will not strip types under node_modules/.
// Type stripping is on by default from Node 22.18 (and 23.6).
import { existsSync } from "node:fs";

const source = new URL("../src/cli.ts", import.meta.url);

if (!existsSync(source)) {
  await import("../dist/cli.js");
} else if (process.features.typescript) {
  await import(source.href);
} else {
  console.error(
    `planchest: Node ${process.versions.node} cannot run TypeScript directly. ` +
      "Install Node 22.18 or newer (nodejs.org, or a version manager such as nvm, fnm or Volta) and run it again.",
  );
  process.exit(1);
}
