// Cross-platform post-build step.
// The portfolio is a static SPA with pathname-based routing, so unknown paths
// should render the app (and its 404 page) instead of a server error page.
// GitHub Pages serves `404.html`, so we emit a copy of index.html.
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const distDir = "dist";
const indexHtml = join(distDir, "index.html");

if (!existsSync(indexHtml)) {
  console.error(`[postbuild] ${indexHtml} not found — did the build run?`);
  process.exit(1);
}

copyFileSync(indexHtml, join(distDir, "404.html"));
console.log("[postbuild] wrote dist/404.html");
