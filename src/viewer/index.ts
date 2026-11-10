import {
  readdirSync,
  readFileSync,
  existsSync,
  mkdirSync,
  cpSync,
  writeFileSync,
  rmSync,
  realpathSync,
  statSync,
} from "node:fs";
import {
  resolve,
  join,
  relative,
  basename,
  extname,
  dirname,
  isAbsolute,
  sep,
} from "node:path";
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
export interface Viewport {
  id: string;
  label: string;
  width: number;
  height: number;
}
/** Optional Viewer settings from the design repo's planchest.json. */
export interface ViewerConfig {
  viewports?: Viewport[];
  default?: string;
  compare?: string[];
}
export interface Catalog {
  version: 1;
  name: string;
  generatedAt: string;
  viewer?: ViewerConfig;
  entries: Entry[];
}
/** Read and validate `viewer` from planchest.json at the repo root, if present. */
export function readViewerConfig(root: string): ViewerConfig | undefined {
  const file = join(resolve(root), "planchest.json");
  if (!existsSync(file)) return undefined;
  let raw: any;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    throw new Error(`planchest.json is not valid JSON: ${(e as Error).message}`);
  }
  const viewer = raw?.viewer;
  if (viewer === undefined) return undefined;
  const fail = (message: string): never => {
    throw new Error(`planchest.json viewer: ${message}`);
  };
  if (typeof viewer !== "object" || viewer === null) fail("must be an object");
  const config: ViewerConfig = {};
  if (viewer.viewports !== undefined) {
    if (!Array.isArray(viewer.viewports) || !viewer.viewports.length)
      fail("viewports must be a non-empty array");
    const ids = new Set<string>();
    config.viewports = viewer.viewports.map((v: any, i: number) => {
      const id = typeof v?.id === "string" ? v.id : "";
      if (!id || ["compare", "fill"].includes(id) || ids.has(id))
        fail(`viewports[${i}].id must be a unique string other than compare or fill`);
      ids.add(id);
      for (const key of ["width", "height"])
        if (!Number.isInteger(v[key]) || v[key] < 1 || v[key] > 10000)
          fail(`viewports[${i}].${key} must be a positive integer`);
      return {
        id,
        label: typeof v.label === "string" && v.label ? v.label : `${v.width} × ${v.height}`,
        width: v.width,
        height: v.height,
      };
    });
  }
  const known = (id: unknown) =>
    typeof id === "string" &&
    (config.viewports ? config.viewports.some((v) => v.id === id) : true);
  if (viewer.default !== undefined) {
    if (!known(viewer.default)) fail("default must be the id of a viewport");
    config.default = viewer.default;
  }
  if (viewer.compare !== undefined) {
    if (!Array.isArray(viewer.compare) || viewer.compare.length < 2 || !viewer.compare.every(known))
      fail("compare must list at least two viewport ids");
    config.compare = viewer.compare;
  }
  return config;
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
const HTML_NS = "http://www.w3.org/1999/xhtml";
export function buildCatalog(
  root: string,
  files: string[] = inventory(resolve(root)),
): Catalog {
  root = resolve(root);
  const available = new Set(files);
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
      sections: string[] = [],
      titled = false;
    if (ext === ".md") title = /^#\s+(.+)$/m.exec(text)?.[1] ?? title;
    if (ext === ".html" || ext === ".htm") {
      const doc = parse(text);
      function walk(node: any) {
        // Only the document's own <title>, not one inside inline SVG.
        if (!titled && node.tagName === "title" && node.namespaceURI === HTML_NS) {
          titled = true;
          const text = node.childNodes
            ?.map((n: any) => n.value ?? "")
            .join("")
            .replace(/\s+/g, " ")
            .trim();
          if (text) title = text;
        }
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
      status: file.split("/").includes("prototypes")
        ? undefined
        : /^status:\s*([^\s#]+)/m.exec(meta)?.[1],
      spec: available.has(spec) && spec !== file ? spec : undefined,
    });
  }
  const viewer = readViewerConfig(root);
  return {
    version: 1,
    name: basename(root),
    generatedAt: new Date().toISOString(),
    ...(viewer ? { viewer } : {}),
    entries,
  };
}
/** True when `child` is strictly inside `parent` (platform separators). */
function contains(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel !== "" && rel !== ".." && !rel.startsWith(".." + sep) && !isAbsolute(rel);
}
/** Real path of `path`, resolving symlinks in its nearest existing ancestor. */
function realOutput(path: string): string {
  let existing = path;
  while (!existsSync(existing) && dirname(existing) !== existing)
    existing = dirname(existing);
  return resolve(realpathSync(existing), relative(existing, path));
}
export function publishViewer(source: string, destination: string): Catalog {
  const root = realpathSync(resolve(source)),
    out = resolve(destination);
  const ancestor = realOutput(out);
  if (
    root === ancestor ||
    contains(ancestor, root) ||
    (contains(root, ancestor) &&
      relative(root, ancestor).split(sep)[0] !== ".planchest")
  )
    throw new Error(
      "Viewer output must be outside source content (or inside .planchest).",
    );
  const marker = join(out, ".planchest-viewer");
  if (existsSync(out) && !statSync(out).isDirectory())
    throw new Error("Viewer output path exists and is not a directory.");
  if (existsSync(out) && !existsSync(marker) && readdirSync(out).length)
    throw new Error("Refusing to replace an unrelated output directory.");
  const assets = new URL("../../viewer-dist/", import.meta.url);
  if (!existsSync(assets))
    throw new Error("Viewer assets are missing. Run npm run build first.");
  const files = inventory(root),
    catalog = buildCatalog(root, files);
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
