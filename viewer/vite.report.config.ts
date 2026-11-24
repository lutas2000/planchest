// Builds the diff report page into one self-contained HTML file,
// report-dist/index.html, with its script and styles inlined. That file is
// committed: the Claude Code plugin and the PR preview workflow run
// `planchest diff` from a checkout without dev dependencies, so they cannot
// build it. CI checks that the committed file matches the source.
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** `s` as a literal inside a RegExp. */
const literal = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function inline(): Plugin {
  return {
    name: "planchest-inline",
    enforce: "post",
    generateBundle(_, bundle) {
      const page = Object.values(bundle).find((f) => f.type === "asset" && f.fileName.endsWith(".html"));
      if (!page || page.type !== "asset") return;
      let html = String(page.source);
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type === "chunk") {
          // `</script` inside the code would end the inline block early.
          const code = file.code.replace(/<\/script/gi, "<\\/script");
          html = html.replace(
            new RegExp(`<script type="module" crossorigin src="[^"]*${literal(file.fileName)}"></script>`),
            () => `<script type="module">${code}</script>`,
          );
        } else if (name.endsWith(".css")) {
          html = html.replace(
            new RegExp(`<link rel="stylesheet" crossorigin href="[^"]*${literal(file.fileName)}">`),
            () => `<style>${String(file.source)}</style>`,
          );
        } else continue;
        delete bundle[name];
      }
      if (/assets\//.test(html)) throw new Error("report page still references a built asset");
      page.source = html;
      page.fileName = "index.html";
    },
  };
}

export default defineConfig({
  root: "viewer",
  base: "./",
  plugins: [react(), inline()],
  build: {
    outDir: "../report-dist",
    emptyOutDir: true,
    modulePreload: false,
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    rollupOptions: {
      input: "viewer/report.html",
      output: { inlineDynamicImports: true },
    },
  },
});
