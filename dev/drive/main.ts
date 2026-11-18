// bun run drive <component> <scenario> [--steps keyboard] [--cpu-rate 1] [--width phone|tablet|desktop]
//                [--theme light|dark] [--out <dir>] [--json] [--build <dir>] [--against <git-ref> [--check]]
// bun run drive --all                     every scenario of every component
// --check without --against               fails on any count over dev/components/<slug>/budget.json or dev/blocks/<slug>/budget.json
// bun run preview ...                     see preview.ts
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { type Browser, chromium } from "playwright";
import type { IndexedComponent, IndexedScenario, Step, Target } from "../harness/types";
import { axTree, focusPath } from "./ax";
import { checkBudget, readBudget } from "./budget";
import { comparePage } from "./compare-page";
import { diffReports, type StepDiff } from "./diff";
import { markers } from "./markers";
import { preview } from "./preview";
import {
  describeTarget,
  findComponent,
  oneOf,
  prepare,
  readIndex,
  stageHash,
  THEMES,
  type Theme,
  UsageError,
  type Width,
  WIDTHS,
} from "./scenario";
import {
  buildGallery,
  buildGalleryOnce,
  checkoutRef,
  driveCacheDir,
  ORIGIN,
  PKG,
  serveGallery,
} from "./serve";
import { createSettler } from "./settle";
import { summarize } from "./trace";
import type { RunReport, StepReport, TimelineEntry, TraceEvent } from "./types";

const TRACE_CATEGORIES = [
  "devtools.timeline",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.frame",
];

interface Options {
  keyboard: boolean;
  cpuRate: number;
  width: Width;
  theme: Theme;
  out: string;
  build: string;
  label: string;
}

function buildLabel(): string {
  const git = (...args: string[]) =>
    spawnSync("git", args, { cwd: PKG, encoding: "utf8" }).stdout.trim();
  return `${git("rev-parse", "--short", "HEAD")}${git("status", "--porcelain") ? "+dirty" : ""}`;
}

async function readBuildIndex(browser: Browser, dir: string): Promise<IndexedComponent[]> {
  const page = await browser.newPage();
  await serveGallery(page, dir);
  const index = await readIndex(page, `${ORIGIN}/stage.html`);
  await page.close();
  return index;
}

async function runScenario(
  browser: Browser,
  component: IndexedComponent,
  scenario: IndexedScenario,
  opts: Options,
): Promise<RunReport> {
  const steps = opts.keyboard ? scenario.keyboard : scenario.steps;
  if (steps === null)
    throw new UsageError(`${component.slug}/${scenario.id} has no keyboard steps`);
  const [w, h] = WIDTHS[opts.width];
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    colorScheme: opts.theme,
    hasTouch: steps.some((s) => "touch" in s || "hold" in s),
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await serveGallery(page, opts.build);
  const cdp = await context.newCDPSession(page);
  const settle = await createSettler(page, cdp);

  const out = mkdtempSync(join(opts.out, `${component.slug}-${scenario.id}-`));
  const timeline: TimelineEntry[] = [];
  const throttle = async (rate: number) => {
    timeline.push({ kind: "throttle", rate });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  };

  const traced = async <T>(work: () => Promise<T>) => {
    await browser.startTracing(page, { categories: TRACE_CATEGORIES });
    const result = await work();
    const events: TraceEvent[] = JSON.parse((await browser.stopTracing()).toString()).traceEvents;
    return { result, perf: summarize(events) };
  };

  const observe = async (
    index: number,
    step: Step | null,
    settled: Awaited<ReturnType<typeof settle>>,
    perf: StepReport["perf"],
  ): Promise<StepReport> => {
    const screenshot = join(out, `step-${index}.png`);
    await page.screenshot({ path: screenshot });
    return {
      index,
      step,
      settled: settled.settled,
      settleMs: Math.round(settled.settleMs),
      screenshot,
      ax: await axTree(cdp),
      focus: await focusPath(cdp),
      markers: await markers(cdp),
      perf,
    };
  };

  await throttle(1);
  // Step 0 counts the mount alone: page load and font swaps vary with host load.
  await page.goto(`${ORIGIN}/stage.html#/?theme=${opts.theme}`);
  await page.evaluate(() => Promise.all([...document.fonts].map((face) => face.load())));
  await settle();
  timeline.push({ kind: "load" });
  const hash = stageHash(component.slug, scenario.id, opts.theme);
  const mounted = await traced(async () => {
    await page.evaluate((h) => {
      window.location.hash = h;
    }, hash);
    await page.locator("[data-scenario]").waitFor({ state: "attached" });
    return settle();
  });
  timeline.push({ kind: "mount" });
  const reports = [await observe(0, null, mounted.result, mounted.perf)];

  for (const [i, step] of steps.entries()) {
    const index = i + 1;
    const input = await prepare(page, cdp, step);
    timeline.push({ kind: "step", index });
    const done = await traced(async () => {
      await throttle(opts.cpuRate);
      await input();
      const settled = await settle();
      await throttle(1);
      return settled;
    });
    reports.push(await observe(index, step, done.result, done.perf));
  }
  await context.close();

  const report: RunReport = {
    component: component.component,
    scenario: scenario.id,
    build: opts.label,
    cpuRate: opts.cpuRate,
    width: opts.width,
    theme: opts.theme,
    steps: reports,
    timeline,
    errors,
    dir: out,
  };
  writeFileSync(join(out, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

const describeArg = (arg: string | Target | { x: number; y: number }) => {
  if (typeof arg === "string") return arg;
  return "role" in arg ? describeTarget(arg) : `${arg.x},${arg.y}`;
};

const describeStep = (step: Step | null) =>
  step === null
    ? "mounted"
    : Object.entries(step)
        .map(([verb, arg]) => `${verb} ${describeArg(arg)}`)
        .join("");

function printHuman(report: RunReport) {
  console.log(
    `${report.component}/${report.scenario} at ${report.cpuRate}x, ${report.width}, ${report.theme}`,
  );
  for (const s of report.steps) {
    const p = s.perf;
    console.log(
      `  ${s.index} ${describeStep(s.step)}${s.settled ? "" : " (not settled)"}: ${p.recalcs} recalcs, ${p.elementsRestyled} restyled, ${p.layouts} layouts, ${p.paints} paints, ${p.longFrames} long frames, input to paint ${p.inputToPaintMs ?? "-"} ms`,
    );
  }
  for (const e of report.errors) console.log(`  page error: ${e}`);
  console.log(join(report.dir, "report.json"));
}

/** The ref's gallery build, made once per commit; null when the ref predates the scenario folders. */
async function refBuild(ref: string): Promise<{ dir: string; label: string } | null> {
  const pkg = checkoutRef(ref);
  if (pkg === null) throw new UsageError(`no commit ${ref}`);
  if (!existsSync(join(pkg, "dev", "components"))) return null;
  return { dir: await buildGalleryOnce(pkg), label: `${ref} (${basename(pkg).slice(0, 7)})` };
}

interface Compared {
  same: boolean;
  steps: StepDiff[];
  base: RunReport;
  head: RunReport;
  html: string;
}

async function compare(
  browser: Browser,
  [component, scenario]: [IndexedComponent, IndexedScenario],
  ref: string,
  opts: Options,
): Promise<Compared> {
  const missing = new UsageError(`${ref} has no scenario ${component.slug}/${scenario.id}`);
  const built = await refBuild(ref);
  if (built === null) throw missing;
  const baseScenario = findComponent(
    await readBuildIndex(browser, built.dir),
    component.slug,
  )?.scenarios.find((s) => s.id === scenario.id);
  if (!baseScenario) throw missing;
  const base = await runScenario(browser, component, baseScenario, {
    ...opts,
    build: built.dir,
    label: built.label,
  });
  const head = await runScenario(browser, component, scenario, opts);
  const diff = diffReports(base, head);
  const dir = mkdtempSync(join(opts.out, `${component.slug}-${scenario.id}-compare-`));
  writeFileSync(join(dir, "compare.json"), `${JSON.stringify({ ...diff, base, head }, null, 2)}\n`);
  const html = join(dir, "compare.html");
  writeFileSync(html, comparePage(base, head, diff));
  return { ...diff, base, head, html };
}

function printCompare(c: Compared) {
  console.log(
    `${c.head.component}/${c.head.scenario}: ${c.same ? "same behaviour" : "behaviour differs"} (${c.base.build} against ${c.head.build})`,
  );
  for (const s of c.steps) {
    const parts = [
      s.ax.length > 0 && "ax",
      s.focus !== null && "focus",
      s.markers.length > 0 && "markers",
      Object.keys(s.perf).length > 0 && `perf ${Object.keys(s.perf).join(", ")}`,
    ].filter(Boolean);
    if (parts.length > 0) console.log(`  ${s.index}: ${parts.join("; ")}`);
  }
  console.log(c.html);
}

async function main(argv: string[]): Promise<number> {
  if (argv[0] === "preview") return preview(argv.slice(1));
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      steps: { type: "string" },
      "cpu-rate": { type: "string", default: "1" },
      width: { type: "string", default: "desktop" },
      theme: { type: "string", default: "dark" },
      out: { type: "string" },
      json: { type: "boolean", default: false },
      all: { type: "boolean", default: false },
      build: { type: "string" },
      against: { type: "string" },
      check: { type: "boolean", default: false },
    },
  });
  const cpuRate = Number(values["cpu-rate"]);
  if (!(cpuRate >= 1)) throw new UsageError("--cpu-rate takes a number of 1 or more");
  if (values.steps !== undefined && values.steps !== "keyboard") {
    throw new UsageError("--steps takes keyboard");
  }
  const [wanted, id] = positionals;
  if (!values.all && (wanted === undefined || id === undefined)) {
    throw new UsageError("usage: drive <component> <scenario> | drive --all");
  }
  if (values.all && values.against !== undefined) {
    throw new UsageError("--against takes one scenario, not --all");
  }
  const base = resolve(values.out ?? driveCacheDir());
  mkdirSync(base, { recursive: true });
  const build = values.build ?? (await buildGallery());
  const opts: Options = {
    keyboard: values.steps === "keyboard",
    cpuRate,
    width: oneOf(values.width, ["phone", "tablet", "desktop"], "width"),
    theme: oneOf(values.theme, THEMES, "theme"),
    out: base,
    build,
    label: buildLabel(),
  };

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    // An animated key scroll spans as many frames as the host draws, so its counts would move with the runner.
    args: ["--disable-smooth-scrolling"],
  });
  try {
    const index = await readBuildIndex(browser, build);
    const runs: [IndexedComponent, IndexedScenario][] = values.all
      ? index.flatMap((c) =>
          c.scenarios
            .filter((s) => !opts.keyboard || s.keyboard !== null)
            .map((s) => [c, s] as [IndexedComponent, IndexedScenario]),
        )
      : [];
    if (!values.all) {
      const component = findComponent(index, wanted ?? "");
      const scenario = component?.scenarios.find((s) => s.id === id);
      if (!component || !scenario) throw new UsageError(`no scenario ${wanted}/${id}`);
      runs.push([component, scenario]);
    }
    const [only] = runs;
    if (values.against !== undefined && only !== undefined) {
      const compared = await compare(browser, only, values.against, opts);
      if (values.json) console.log(JSON.stringify(compared));
      else printCompare(compared);
      return values.check && !compared.same ? 1 : 0;
    }
    const reports: RunReport[] = [];
    const overruns: string[] = [];
    for (const [component, scenario] of runs) {
      const report = await runScenario(browser, component, scenario, opts);
      reports.push(report);
      if (!values.json) printHuman(report);
      if (values.check) {
        overruns.push(
          ...checkBudget(report, readBudget(component.slug)).map((o) => `${component.slug}/${o}`),
        );
      }
    }
    if (values.json) console.log(JSON.stringify(values.all ? reports : reports[0]));
    for (const overrun of overruns) console.error(`over budget: ${overrun}`);
    return overruns.length > 0 ? 1 : 0;
  } finally {
    await browser.close();
    if (values.build === undefined) rmSync(build, { recursive: true, force: true });
  }
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error: unknown) => {
    if (error instanceof UsageError) {
      console.error(error.message);
      process.exit(2);
    }
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exit(1);
  },
);
