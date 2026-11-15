// Builds the gallery static and serves it from disk through Playwright's request interception (ES modules are refused over file://).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { Page } from "playwright";

export const PKG = resolve(import.meta.dirname, "../..");
export const ORIGIN = "http://gallery.local";

const MIME: Record<string, string> = {
  html: "text/html",
  js: "text/javascript",
  css: "text/css",
  svg: "image/svg+xml",
  woff2: "font/woff2",
  woff: "font/woff",
  png: "image/png",
  json: "application/json",
};

/** Per checkout, so parallel worktrees never overwrite each other. */
export const checkoutSlug = (dir = PKG) =>
  dir
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

export const galleryBuildDir = (pkg = PKG) =>
  join(homedir(), ".cache", "glasshome-gallery-build", checkoutSlug(pkg));

export function buildGallery(pkg = PKG, outDir = galleryBuildDir(pkg)): string {
  const run = spawnSync(
    "bunx",
    ["vite", "build", "--config", "vite.dev.config.ts", "--base", "./", "--outDir", outDir],
    // Build chatter goes to stderr, so a --json caller reads clean stdout.
    { cwd: pkg, stdio: ["ignore", 2, 2] },
  );
  if (run.status !== 0) throw new Error(`gallery build in ${pkg} exited ${run.status}`);
  return outDir;
}

export async function serveGallery(page: Page, dir: string): Promise<void> {
  await page.route(`${ORIGIN}/**`, (route) => {
    let path = new URL(route.request().url()).pathname;
    if (path === "/") path = "/index.html";
    const file = join(dir, path);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    const ext = file.split(".").pop() ?? "";
    return route.fulfill({
      status: 200,
      contentType: MIME[ext] ?? "application/octet-stream",
      body: readFileSync(file),
    });
  });
}
