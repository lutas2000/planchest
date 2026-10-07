import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { diff } from "./diff/index.ts";
import { serve } from "./diff/serve.ts";

const DEFAULT_OUT = ".planchest/diff";
const DEFAULT_PORT = 4747;

const HELP = `planchest — a design repo framework for AI agents

Usage
  planchest diff <a> <b> [options]   compare two versions of design pages
  planchest serve [dir] [--port N]   serve a report directory
  planchest --version

Each side of a diff is a directory, a git ref, or <ref>:<path>:
  planchest diff HEAD~1 HEAD
  planchest diff main feature/onboarding --paths prototypes/onboarding
  planchest diff v1.0:prototypes/dashboard HEAD:prototypes/dashboard
  planchest diff concepts/dashboard-v1 concepts/dashboard-v2

Options for diff
  --out <dir>       where to write the report (default ${DEFAULT_OUT})
  --paths <p,...>   only compare these paths, relative to each side
  --repo <dir>      repository to read refs from (default: the one containing cwd)
  --serve           serve the report after writing it
  --port <n>        port for --serve (default ${DEFAULT_PORT})
  --json            print report.json to stdout instead of a summary
`;

function version(): string {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  return pkg.version;
}

function fail(message: string): never {
  process.stderr.write(`planchest: ${message}\n`);
  process.exit(1);
}

async function main(argv: string[]) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
      out: { type: "string" },
      paths: { type: "string" },
      repo: { type: "string" },
      serve: { type: "boolean" },
      port: { type: "string" },
      json: { type: "boolean" },
    },
  });

  if (values.version) {
    process.stdout.write(version() + "\n");
    return;
  }
  const [command, ...rest] = positionals;
  if (values.help || !command) {
    process.stdout.write(HELP);
    return;
  }
  const cwd = process.cwd();
  const port = values.port ? Number(values.port) : DEFAULT_PORT;
  if (Number.isNaN(port)) fail(`--port must be a number, got "${values.port}"`);

  if (command === "diff") {
    const [a, b, extra] = rest;
    if (!a || !b) fail("diff needs two sides: planchest diff <a> <b>");
    if (extra) fail(`unexpected argument "${extra}"`);
    const out = values.out ?? DEFAULT_OUT;
    const paths = values.paths?.split(",").map((p) => p.trim()).filter(Boolean);
    let report;
    try {
      report = diff(a, b, { cwd, out, repo: values.repo, paths });
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
    }
    const c = report.comparison.counts;
    if (values.json) {
      process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    } else {
      process.stdout.write(
        `${report.a.label}${report.a.commit ? " @" + report.a.commit : ""} → ` +
          `${report.b.label}${report.b.commit ? " @" + report.b.commit : ""}\n` +
          `pages: ${c.changed} changed, ${c.added} added, ${c.removed} removed, ${c.unchanged} unchanged\n` +
          `other files: ${report.comparison.files.length} differ\n` +
          `report: ${resolve(cwd, out)}/index.html\n`,
      );
    }
    if (values.serve) await serveDir(resolve(cwd, out), port);
    return;
  }

  if (command === "serve") {
    const [dir, extra] = rest;
    if (extra) fail(`unexpected argument "${extra}"`);
    await serveDir(resolve(cwd, dir ?? DEFAULT_OUT), port);
    return;
  }

  fail(`unknown command "${command}"\n\n${HELP}`);
}

async function serveDir(dir: string, port: number) {
  let started;
  try {
    started = await serve(dir, port);
  } catch (err) {
    fail(`could not listen on port ${port}: ${err instanceof Error ? err.message : String(err)}`);
  }
  process.stderr.write(`serving ${dir}\n${started.url}\npress Ctrl-C to stop\n`);
  await new Promise<void>((done) => {
    const stop = () => started.server.close(() => done());
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  });
}

main(process.argv.slice(2)).catch((err) => fail(err instanceof Error ? err.message : String(err)));
