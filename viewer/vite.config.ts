import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  root: "viewer",
  base: "./",
  plugins: [react(), tailwindcss()],
  build: { outDir: "../viewer-dist", emptyOutDir: true },
});
