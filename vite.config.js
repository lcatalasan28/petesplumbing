import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

function spaNotFoundPage() {
  let outDir = "";
  return {
    name: "spa-not-found-page",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      copyFileSync(resolve(outDir, "index.html"), resolve(outDir, "404.html"));
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react(), spaNotFoundPage()],
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.js",
    env: {
      VITE_STATIC_DEMO: "1",
    },
  },
});
