// Screenshot gallery specimens without a dev server: build the gallery static,
// serve the folder from disk through Playwright's request interception (ES
// modules are refused over file://), shoot each named cell.
//
//   bun run gallery:shots                      every cell
//   bun run gallery:shots ResponsiveDialog Select
//   bun run gallery:shots ResponsiveDialog --click "Open responsive"   (viewport shot after the click)
//   bun run gallery:shots ContextMenu --right-click "Right-click me"   (same, with the right button)
//   bun run gallery:shots ToggleGroup --hover "Center"                 (cell shot with the pointer on it)
//   bun run gallery:shots --route screens/settings-shape --stage phone (one full-page shot of stage.html#/<route>)
//   bun run gallery:shots --verify-triggers                            (every data-try resolves to one element, or exit 1)
//
// Trigger text resolves inside the cell's [data-stage] body only: the header
// chip repeats it, and an unscoped locator clicks the chip instead.
//   flags: --width 1280 --height 900 --stage phone|tablet|desktop --reduced-motion --light --scale 2
//          --out ~/.cache/glasshome-gallery-shots --no-build
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
const STAGES = { phone: [390, 844], tablet: [834, 1112], desktop: [1280, 900] };
const stageName = flag("stage", null);
if (stageName !== null && !Object.hasOwn(STAGES, String(stageName))) {
	console.error(`--stage takes one of: ${Object.keys(STAGES).join(", ")}`);
	process.exit(2);
}
const [stageW, stageH] = stageName === null ? [] : STAGES[stageName];
const widthFlag = Number(flag("width", 1280));
const heightFlag = Number(flag("height", 900));
const width = stageW ?? widthFlag;
const height = stageH ?? heightFlag;
const scale = Number(flag("scale", 1));
const light = flag("light", false) === true;
const noBuild = flag("no-build", false) === true;
const reducedMotion = flag("reduced-motion", false) === true;
const verifyTriggers = flag("verify-triggers", false) === true;
const route = flag("route", null);
if (route === true) {
	console.error("--route takes <area>/<entry>, e.g. screens/settings-shape");
	process.exit(2);
}
const click = flag("click", null);
const rightClick = flag("right-click", null);
const hover = flag("hover", null);
const press = click
	? { text: String(click), button: "left", prefix: "" }
	: rightClick
		? { text: String(rightClick), button: "right", prefix: "right-" }
		: null;
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
if (reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
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

const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
const SETTLE_MS = 10_000;

// Staggered rows arrive after their delay, past every --duration-* token, so wait on the animations themselves.
async function settle() {
	const pending = await page.evaluate(async (budget) => {
		const frame = () => new Promise((r) => requestAnimationFrame(() => r(undefined)));
		const running = () =>
			document
				.getAnimations()
				.filter(
					(a) =>
						a.playState === "running" && Number.isFinite(a.effect?.getComputedTiming().endTime),
				);
		await frame();
		await frame();
		const deadline = performance.now() + budget;
		for (let now = running(); now.length > 0; now = running()) {
			if (performance.now() > deadline) {
				return now.map((a) => a.animationName ?? a.transitionProperty ?? a.constructor.name);
			}
			await Promise.race([
				Promise.all(now.map((a) => a.finished.catch(() => undefined))),
				new Promise((r) => setTimeout(r, deadline - performance.now())),
			]);
		}
		await frame();
		return [];
	}, SETTLE_MS);
	if (pending.length > 0) {
		throw new Error(`still animating after ${SETTLE_MS}ms: ${[...new Set(pending)].join(", ")}`);
	}
}

async function verify() {
	await page.goto("http://gallery.local/#/all");
	await page.locator("[data-specimen]").first().waitFor();
	await settle();
	const cells = page.locator("[data-try]");
	const total = await cells.count();
	const failures = [];
	for (let i = 0; i < total; i++) {
		const cell = cells.nth(i);
		const [name, value] = await cell.evaluate((el) => [
			el.getAttribute("data-specimen"),
			el.getAttribute("data-try") ?? "",
		]);
		const hits = cell.locator("[data-stage]").getByText(value, { exact: true });
		const found = await hits.count();
		if (found !== 1) failures.push(`${name}: try "${value}" resolves to ${found} elements`);
		else if (!(await hits.isVisible())) failures.push(`${name}: try "${value}" is hidden`);
	}
	if (failures.length > 0) {
		console.error(
			`${failures.length} of ${total} try values do not resolve:\n${failures.join("\n")}`,
		);
		return 1;
	}
	console.log(`${total} of ${total} try values resolve to exactly one element`);
	return 0;
}

async function shootRoute(target) {
	await page.goto(`http://gallery.local/stage.html#/${target}`);
	try {
		await page.locator("[data-screen]").first().waitFor({ state: "visible", timeout: SETTLE_MS });
	} catch {
		console.error(`no [data-screen] rendered at stage.html#/${target}`);
		return 2;
	}
	await settle();
	const out = join(outDir, `${slug(target)}@${stageName ?? width}.png`);
	await page.screenshot({ path: out, fullPage: true });
	console.log(out);
	return 0;
}

async function shootSpecimens() {
	await page.goto("http://gallery.local/#/all");
	await page.waitForTimeout(800);

	const cells = page.locator("[data-specimen]");
	const all = await cells.evaluateAll((els) => els.map((el) => el.getAttribute("data-specimen")));
	const wanted = names.length ? names : all;
	const missing = wanted.filter((n) => !all.includes(n));
	if (missing.length) {
		console.error(`no specimen named: ${missing.join(", ")}\nhave: ${all.join(", ")}`);
		return 2;
	}

	// Width in the name, so a mobile run cannot overwrite the desktop shot of the
	// same specimen (the default width stays bare, to keep existing names).
	const widthSuffix = width === 1280 ? "" : `@${width}`;
	for (const name of wanted) {
		const cell = page.locator(`[data-specimen="${name}"]`);
		const stage = cell.locator("[data-stage]");
		await cell.scrollIntoViewIfNeeded();
		if (press) {
			await stage.getByText(press.text, { exact: true }).first().click({ button: press.button });
			await page.waitForTimeout(700);
			const out = join(
				outDir,
				`${slug(name)}--${press.prefix}${slug(press.text)}${widthSuffix}.png`,
			);
			await page.screenshot({ path: out });
			console.log(out);
			await page.keyboard.press("Escape");
			await page.waitForTimeout(500);
		} else {
			if (hover) {
				await stage.getByText(String(hover), { exact: true }).first().hover();
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
	return 0;
}

const code = verifyTriggers
	? await verify()
	: route
		? await shootRoute(String(route))
		: await shootSpecimens();

await browser.close();
if (errors.length) {
	console.error(`page errors (${errors.length}):\n${errors.slice(0, 5).join("\n")}`);
	process.exit(1);
}
process.exit(code);
