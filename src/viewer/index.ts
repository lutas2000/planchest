import {
  readdirSync,
  readFileSync,
  existsSync,
  mkdirSync,
  cpSync,
  writeFileSync,
  rmSync,
  realpathSync,
} from "node:fs";
import { resolve, join, relative, basename, extname, dirname } from "node:path";
import { parse } from "parse5";
export interface Entry {
  file: string;
  title: string;
  kind: string;
  format: string;
  status?: string;
  spec?: string;
  sections: string[];
}
export interface Catalog {
  version: 1;
  name: string;
  generatedAt: string;
  entries: Entry[];
}
const roots = new Set([
  "prototypes",
  "concepts",
  "flows",
  "system",
  "decisions",
  "sources",
]);
const rootDocs = /^(README|DESIGN|CONTEXT|BRAND|AGENTS)\.md$/;
const extensions = new Set([
  ".html",
  ".htm",
  ".md",
  ".css",
  ".json",
  ".js",
  ".mjs",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".mp3",
  ".mp4",
  ".ogg",
  ".wav",
]);
function inventory(root: string): string[] {
  const files: string[] = [];
  function visit(dir: string) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      if (item.name.startsWith(".") || item.name === "node_modules") continue;
      const abs = join(dir, item.name),
        rel = relative(root, abs);
      if (item.isSymbolicLink()) continue;
      if (item.isDirectory()) {
        if (dir !== root || roots.has(item.name)) visit(abs);
      } else if (
        item.isFile() &&
        extensions.has(extname(item.name).toLowerCase()) &&
        (dir !== root || rootDocs.test(item.name))
      )
        files.push(rel.split("\\").join("/"));
    }
  }
  visit(root);
  return files.sort();
}
export function buildCatalog(root: string): Catalog {
  root = resolve(root);
  const files = inventory(root),
    available = new Set(files);
  const entries: Entry[] = [];
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (
      ![
        ".html",
        ".htm",
        ".md",
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".gif",
        ".svg",
      ].includes(ext)
    )
      continue;
    const text = [".html", ".htm", ".md"].includes(ext)
      ? readFileSync(join(root, file), "utf8")
      : "";
    let title = basename(file),
      sections: string[] = [];
    if (ext === ".md") title = /^#\s+(.+)$/m.exec(text)?.[1] ?? title;
    if (ext === ".html" || ext === ".htm") {
      const doc = parse(text);
      function walk(node: any) {
        if (node.tagName === "title")
          title =
            node.childNodes?.map((n: any) => n.value ?? "").join("") || title;
        const section = node.attrs?.find(
          (a: any) => a.name === "data-page",
        )?.value;
        if (section && !sections.includes(section)) sections.push(section);
        node.childNodes?.forEach(walk);
      }
      walk(doc);
    }
    const spec = join(dirname(file), "SPEC.md").split("\\").join("/");
    const meta = available.has(spec)
      ? readFileSync(join(root, spec), "utf8")
      : text;
    entries.push({
      file,
      title,
      sections,
      kind: file.includes("/") ? file.split("/")[0] : "documents",
      format:
        ext === ".md"
          ? "markdown"
          : [".html", ".htm"].includes(ext)
            ? "html"
            : "image",
      status: /^status:\s*([^\s#]+)/m.exec(meta)?.[1],
      spec: available.has(spec) && spec !== file ? spec : undefined,
    });
  }
  return {
    version: 1,
    name: basename(root),
    generatedAt: new Date().toISOString(),
    entries,
  };
}
export function publishViewer(source: string, destination: string): Catalog {
  const root = realpathSync(resolve(source)),
    out = resolve(destination);
  const ancestor = existsSync(out)
    ? realpathSync(out)
    : resolve(realpathSync(dirname(out)), basename(out));
  if (
    root === ancestor ||
    root.startsWith(ancestor + "/") ||
    (ancestor.startsWith(root + "/") &&
      relative(root, ancestor).split("/")[0] !== ".planchest")
  )
    throw new Error(
      "Viewer output must be outside source content (or inside .planchest).",
    );
  const marker = join(out, ".planchest-viewer");
  if (existsSync(out) && !existsSync(marker) && readdirSync(out).length)
    throw new Error("Refusing to replace an unrelated output directory.");
  const assets = new URL("../../viewer-dist/", import.meta.url);
  if (!existsSync(assets))
    throw new Error("Viewer assets are missing. Run npm run build first.");
  const catalog = buildCatalog(root),
    files = inventory(root);
  if (existsSync(out)) rmSync(out, { recursive: true });
  mkdirSync(join(out, "repo"), { recursive: true });
  cpSync(assets, out, { recursive: true });
  for (const file of files) {
    const target = join(out, "repo", file);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(root, file), target);
  }
  writeFileSync(marker, "1\n");
  writeFileSync(join(out, "catalog.json"), JSON.stringify(catalog, null, 2));
  return catalog;
}
