// Screenshot gallery specimens without a dev server: build the gallery static,
// serve the folder from disk through Playwright's request interception (ES
// modules are refused over file://), shoot each named cell.
//
//   bun run gallery:shots                      every cell
//   bun run gallery:shots ResponsiveDialog Select
//   bun run gallery:shots ResponsiveDialog --click "Open responsive"   (viewport shot after the click)
//   bun run gallery:shots ToggleGroup --hover "Center"                 (cell shot with the pointer on it)
//   flags: --width 1280 --height 900 --light --scale 2 --out ~/.cache/glasshome-gallery-shots --no-build
//
// CHROMIUM_PATH points at a system Chromium when Playwright's bundled one
// cannot launch (NixOS).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = resolve(here, "..");
const args = process.argv.slice(2);
const flag = (name, fallback) => {
	const i = args.indexOf(`--${name}`);
	if (i === -1) return fallback;
	if (fallback === false) {
		args.splice(i, 1);
		return true;
	}
	const v = args[i + 1];
	args.splice(i, v !== undefined && !v.startsWith("--") ? 2 : 1);
	return v !== undefined && !v.startsWith("--") ? v : true;
};
const width = Number(flag("width", 1280));
const height = Number(flag("height", 900));
const scale = Number(flag("scale", 1));
const light = flag("light", false) === true;
const noBuild = flag("no-build", false) === true;
const click = flag("click", null);
const hover = flag("hover", null);
// Per-checkout cache dirs, so parallel worktrees never overwrite each other.
const checkout = pkg
	.replace(/[^a-z0-9]+/gi, "-")
	.replace(/^-|-$/g, "")
	.toLowerCase();
const outDir = resolve(
	String(flag("out", join(homedir(), ".cache", "glasshome-gallery-shots", checkout))),
);
const buildDir = join(homedir(), ".cache", "glasshome-gallery-build", checkout);
const names = args.filter((a) => !a.startsWith("--"));

if (!noBuild) {
	const r = spawnSync(
		"bunx",
		["vite", "build", "--config", "vite.dev.config.ts", "--base", "./", "--outDir", buildDir],
		{ cwd: pkg, stdio: "inherit" },
	);
	if (r.status !== 0) process.exit(r.status ?? 1);
}
mkdirSync(outDir, { recursive: true });

const { chromium } = await import("playwright");
const MIME = {
	html: "text/html",
	js: "text/javascript",
	css: "text/css",
	svg: "image/svg+xml",
	woff2: "font/woff2",
	woff: "font/woff",
	png: "image/png",
	json: "application/json",
};
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({
	viewport: { width, height },
	deviceScaleFactor: scale,
	colorScheme: light ? "light" : "dark",
});
await page.route("http://gallery.local/**", (route) => {
	let path = new URL(route.request().url()).pathname;
	if (path === "/") path = "/index.html";
	const file = join(buildDir, path);
	if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
	const ext = file.split(".").pop();
	return route.fulfill({
		status: 200,
		contentType: MIME[ext] ?? "application/octet-stream",
		body: readFileSync(file),
	});
});
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto("http://gallery.local/#/all");
await page.waitForTimeout(800);

const cells = page.locator("[data-specimen]");
const all = await cells.evaluateAll((els) => els.map((el) => el.getAttribute("data-specimen")));
const wanted = names.length ? names : all;
const missing = wanted.filter((n) => !all.includes(n));
if (missing.length) {
	console.error(`no specimen named: ${missing.join(", ")}\nhave: ${all.join(", ")}`);
	process.exit(2);
}

const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
// Width in the name, so a mobile run cannot overwrite the desktop shot of the
// same specimen (the default width stays bare, to keep existing names).
const widthSuffix = width === 1280 ? "" : `@${width}`;
for (const name of wanted) {
	const cell = page.locator(`[data-specimen="${name}"]`);
	await cell.scrollIntoViewIfNeeded();
	if (click) {
		await cell.getByText(String(click), { exact: true }).first().click();
		await page.waitForTimeout(700);
		const out = join(outDir, `${slug(name)}--${slug(String(click))}${widthSuffix}.png`);
		await page.screenshot({ path: out });
		console.log(out);
		await page.keyboard.press("Escape");
		await page.waitForTimeout(500);
	} else {
		if (hover) {
			await cell.getByText(String(hover), { exact: true }).first().hover();
			await page.waitForTimeout(400);
		}
		const out = join(
			outDir,
			`${slug(name)}${hover ? `--hover-${slug(String(hover))}` : ""}${widthSuffix}.png`,
		);
		await cell.screenshot({ path: out });
		console.log(out);
	}
}

await browser.close();
if (errors.length) {
	console.error(`page errors (${errors.length}):\n${errors.slice(0, 5).join("\n")}`);
	process.exit(1);
}
