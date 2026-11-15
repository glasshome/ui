// Builds the gallery static and serves it from disk through Playwright's request interception (ES modules are refused over file://).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from "node:fs";
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

/** Where the driver writes its runs by default, and where the gallery's report panel reads them. */
export const driveCacheDir = (pkg = PKG) =>
  join(homedir(), ".cache", "glasshome-ui-drive", checkoutSlug(pkg));

export const galleryBuildDir = (pkg = PKG) =>
  join(homedir(), ".cache", "glasshome-gallery-build", checkoutSlug(pkg));

/** In process with this checkout's Vite, so a ref checkout with no node_modules of its own builds too. */
export async function buildGallery(pkg = PKG, outDir = galleryBuildDir(pkg)): Promise<string> {
  const { build } = await import("vite");
  await build({
    configFile: join(pkg, "vite.dev.config.ts"),
    root: join(pkg, "dev"),
    base: "./",
    logLevel: "error",
    build: { outDir, emptyOutDir: true },
  });
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

export interface DevServer {
  origin: string;
  close(): Promise<void>;
}

/** The gallery's Vite dev server, in this process; port 0 takes any free port. */
export async function startDevServer(pkg = PKG, port = 0): Promise<DevServer> {
  const { createServer } = await import("vite");
  const server = await createServer({
    configFile: join(pkg, "vite.dev.config.ts"),
    root: join(pkg, "dev"),
    logLevel: "error",
    clearScreen: false,
    server: { port, strictPort: false, host: "127.0.0.1", ws: false, watch: null },
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (typeof address !== "object" || address === null) {
    await server.close();
    throw new Error("the gallery dev server has no address");
  }
  return { origin: `http://127.0.0.1:${address.port}`, close: () => server.close() };
}

/** `ref`'s tree, extracted once per commit; under node_modules so its imports resolve to this checkout's dependencies. Null when git knows no such commit. */
export function checkoutRef(ref: string, pkg = PKG): string | null {
  const sha = spawnSync("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], {
    cwd: pkg,
    encoding: "utf8",
  }).stdout.trim();
  if (!sha) return null;
  const refs = join(pkg, "node_modules", ".cache", "glasshome-ui-refs");
  const dir = join(refs, sha);
  if (existsSync(dir)) return dir;
  mkdirSync(refs, { recursive: true });
  const staging = mkdtempSync(join(refs, `${sha}-`));
  const extract = spawnSync(
    "bash",
    ["-c", 'set -o pipefail; git archive "$1" | tar -x -C "$0"', staging, sha],
    { cwd: pkg, stdio: ["ignore", 2, 2] },
  );
  if (extract.status !== 0) {
    rmSync(staging, { recursive: true, force: true });
    throw new Error(`git archive ${sha} exited ${extract.status}`);
  }
  try {
    renameSync(staging, dir);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    // A parallel run extracted the same commit first.
    if (!existsSync(dir)) throw error;
  }
  return dir;
}
