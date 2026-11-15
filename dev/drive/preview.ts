// bun run preview <component> [scenario...] [--width phone|tablet|desktop|all] [--material <preset>]
//                 [--after-steps] [--against <git-ref>] [--out <dir>]
// bun run preview --changed [--since <ref>]   every component touched since <ref> (origin/main)
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { type Browser, chromium } from "playwright";
import { MATERIAL_PRESETS } from "../../src/tokens";
import type { IndexedComponent, IndexedScenario } from "../harness/types";
import {
  componentSlugs,
  findComponent,
  oneOf,
  prepare,
  readIndex,
  requireSlug,
  stageHash,
  THEMES,
  type Theme,
  UsageError,
  type Width,
  WIDTHS,
} from "./scenario";
import { checkoutRef, checkoutSlug, type DevServer, PKG, startDevServer } from "./serve";
import { createSettler } from "./settle";
import { type Cell, contactSheet } from "./sheet";

const SETTLE_MS = 1000;
const PARALLEL_PAGES = 4;
const EVERY_COMPONENT = ["src/styles/", "src/tokens/", "src/lib/"];

interface Column {
  name: string;
  width: Width;
  theme: Theme;
}

interface Build {
  name: "base" | "head";
  origin: string;
  index: IndexedComponent[];
}

interface Shot {
  build: Build;
  component: IndexedComponent;
  scenario: IndexedScenario;
  column: Column;
  png: string;
}

function componentsTouched(files: string[], slugs: string[]): string[] {
  if (files.some((f) => EVERY_COMPONENT.some((dir) => f.startsWith(dir)))) return slugs;
  return slugs.filter((slug) =>
    files.some(
      (f) =>
        f.startsWith(`dev/components/${slug}/`) ||
        f === `src/solid/${slug}.tsx` ||
        f.startsWith(`src/solid/${slug}/`),
    ),
  );
}

function changedFiles(since: string): string[] {
  const git = (...args: string[]) => {
    const run = spawnSync("git", args, { cwd: PKG, encoding: "utf8" });
    if (run.status !== 0) throw new UsageError(`git ${args.join(" ")}: ${run.stderr.trim()}`);
    return run.stdout.split("\n").filter(Boolean);
  };
  const [base] = git("merge-base", since, "HEAD");
  if (base === undefined) throw new UsageError(`${since} shares no history with HEAD`);
  return [
    ...git("diff", "--name-only", base),
    ...git("ls-files", "--others", "--exclude-standard"),
  ];
}

function columnsFor(width: string): Column[] {
  if (width === "all") {
    return (Object.keys(WIDTHS) as Width[]).map((w) => ({ name: w, width: w, theme: "dark" }));
  }
  const w = oneOf(width, Object.keys(WIDTHS) as Width[], "width");
  return THEMES.map((theme) => ({ name: theme, width: w, theme }));
}

/** Shoots the scenario's box plus anything it portals to the body, such as an open list or a dialog. */
async function shoot(browser: Browser, shot: Shot, afterSteps: boolean, material?: string) {
  const [w, h] = WIDTHS[shot.column.width];
  const steps = afterSteps ? (shot.scenario.steps ?? []) : [];
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    colorScheme: shot.column.theme,
    hasTouch: steps.some((s) => "touch" in s),
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const cdp = await context.newCDPSession(page);
  const settle = await createSettler(page, cdp);
  const hash = stageHash(shot.component.slug, shot.scenario.id, shot.column.theme, material);
  await page.goto(`${shot.build.origin}/stage.html${hash}`);
  await page.locator("[data-scenario]").waitFor({ state: "attached", timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  await settle(SETTLE_MS);
  for (const step of steps) {
    await (
      await prepare(page, cdp, step)
    )();
    await settle(SETTLE_MS);
  }
  const clip = await page.evaluate(() => {
    const boxes = [document.querySelector("[data-scenario]")?.getBoundingClientRect()];
    for (const portal of document.body.children) {
      if (portal.id === "root" || portal.tagName === "SCRIPT") continue;
      for (const el of [portal, ...portal.querySelectorAll("*")])
        boxes.push(el.getBoundingClientRect());
    }
    const seen = boxes.filter((b): b is DOMRect => b !== undefined && b.width > 0 && b.height > 0);
    const left = Math.max(0, Math.min(...seen.map((b) => b.left)));
    const top = Math.max(0, Math.min(...seen.map((b) => b.top)));
    const right = Math.min(
      document.documentElement.scrollWidth,
      Math.max(...seen.map((b) => b.right)),
    );
    const bottom = Math.max(...seen.map((b) => b.bottom));
    return {
      x: left + scrollX,
      y: top + scrollY,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top),
    };
  });
  await page.screenshot({ path: shot.png, clip, fullPage: true, animations: "disabled" });
  await context.close();
  for (const e of errors) {
    console.error(
      `page error in ${shot.component.slug}/${shot.scenario.id} ${shot.column.name}: ${e}`,
    );
  }
}

async function inParallel<T>(items: T[], limit: number, work: (item: T) => Promise<void>) {
  const queue = [...items];
  const worker = async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await work(item);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

async function sheetFor(
  browser: Browser,
  builds: Build[],
  slug: string,
  wanted: string[],
  columns: Column[],
  opts: { out: string; afterSteps: boolean; material?: string },
): Promise<string> {
  const head = builds.find((b) => b.name === "head");
  const component = head && findComponent(head.index, slug);
  if (!component) throw new UsageError(`no scenarios for ${slug}`);
  const unknown = wanted.filter((id) => !component.scenarios.some((s) => s.id === id));
  if (unknown.length > 0) {
    const known = component.scenarios.map((s) => s.id).join(", ");
    throw new UsageError(`no scenario ${slug}/${unknown.join(", ")}; known: ${known}`);
  }
  const scenarios = component.scenarios.filter((s) => wanted.length === 0 || wanted.includes(s.id));
  const dir = mkdtempSync(join(opts.out, `${slug}-`));
  const split = builds.length > 1;
  const shots: Shot[] = [];
  for (const scenario of scenarios) {
    for (const column of columns) {
      for (const build of builds) {
        const own = findComponent(build.index, slug)?.scenarios.find((s) => s.id === scenario.id);
        if (!own) throw new UsageError(`${build.name} has no scenario ${slug}/${scenario.id}`);
        const name = split ? `${column.name}.${build.name}` : column.name;
        shots.push({
          build,
          component,
          scenario: own,
          column,
          png: join(dir, `${scenario.id}.${name}.png`),
        });
      }
    }
  }
  await inParallel(shots, PARALLEL_PAGES, (shot) =>
    shoot(browser, shot, opts.afterSteps, opts.material),
  );

  const cells: Cell[] = shots.map((s) => ({ label: s.scenario.id, png: s.png }));
  const names = columns.flatMap((c) =>
    split ? builds.map((b) => `${c.name} ${b.name}`) : [c.name],
  );
  const page = await browser.newPage();
  const sheet = await contactSheet(page, cells, names, join(dir, `${slug}.sheet.png`));
  await page.close();
  return sheet;
}

async function serveBuild(name: Build["name"], pkg: string, port: number, browser: Browser) {
  const server = await startDevServer(pkg, port);
  console.error(`${name} gallery on ${server.origin}`);
  const page = await browser.newPage();
  const index = await readIndex(page, `${server.origin}/stage.html`).finally(() => page.close());
  return { server, build: { name, origin: server.origin, index } satisfies Build };
}

export async function preview(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      width: { type: "string", default: "phone" },
      material: { type: "string" },
      "after-steps": { type: "boolean", default: false },
      against: { type: "string" },
      out: { type: "string" },
      changed: { type: "boolean", default: false },
      since: { type: "string", default: "origin/main" },
    },
  });
  const columns = columnsFor(values.width);
  const material = values.material;
  if (material !== undefined && !Object.hasOwn(MATERIAL_PRESETS, material)) {
    throw new UsageError(`--material takes one of: ${Object.keys(MATERIAL_PRESETS).join(", ")}`);
  }
  const [wanted, ...ids] = positionals;
  let slugs: string[];
  if (values.changed) {
    slugs = componentsTouched(changedFiles(values.since), componentSlugs());
    if (slugs.length === 0) {
      console.log(`No component changed since ${values.since}.`);
      return 0;
    }
  } else {
    if (wanted === undefined)
      throw new UsageError("usage: preview <component> [scenario...] | preview --changed");
    slugs = [requireSlug(wanted)];
  }
  const out = resolve(
    values.out ?? join(homedir(), ".cache", "glasshome-ui-preview", checkoutSlug()),
  );
  mkdirSync(out, { recursive: true });
  const basePkg = values.against === undefined ? undefined : checkoutRef(values.against);
  if (basePkg === null) throw new UsageError(`no commit ${values.against}`);
  if (basePkg !== undefined && !existsSync(join(basePkg, "dev", "components"))) {
    throw new UsageError(`${values.against} has no scenario folders (dev/components)`);
  }

  const servers: DevServer[] = [];
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const builds: Build[] = [];
    if (basePkg !== undefined) {
      const base = await serveBuild("base", basePkg, 0, browser);
      servers.push(base.server);
      builds.push(base.build);
    }
    const head = await serveBuild("head", PKG, Number(process.env.GALLERY_PORT ?? 0), browser);
    servers.push(head.server);
    builds.push(head.build);
    for (const slug of slugs) {
      const opts = { out, afterSteps: values["after-steps"], material };
      console.log(await sheetFor(browser, builds, slug, values.changed ? [] : ids, columns, opts));
    }
  } finally {
    await browser.close();
    await Promise.all(servers.map((s) => s.close()));
  }
  return 0;
}
