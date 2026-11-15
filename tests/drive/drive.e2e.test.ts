import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { buildGallery, PKG } from "../../dev/drive/serve";
import type { RunReport } from "../../dev/drive/types";

beforeAll(() => buildGallery());

function drive(...args: string[]) {
  const run = spawnSync("bun", ["dev/drive/main.ts", ...args, "--no-build", "--json"], {
    cwd: PKG,
    encoding: "utf8",
  });
  return { code: run.status, stdout: run.stdout, stderr: run.stderr };
}

function report(...args: string[]): RunReport {
  const run = drive(...args);
  expect(run.code, run.stderr).toBe(0);
  return JSON.parse(run.stdout);
}

describe("drive", () => {
  it("drive tabs keyboard-nav returns one report per step plus the mounted state", () => {
    const first = report("tabs", "keyboard-nav");
    expect(first.steps.map((s) => s.index)).toEqual([0, 1, 2, 3, 4]);
    expect(first.steps[0]?.step).toBeNull();
    expect(first.steps.at(-1)?.focus.at(-1)).toBe('tab "Lights"');

    const shots = first.steps.map((s) => s.screenshot);
    expect(shots.every((png) => existsSync(png))).toBe(true);
    expect(new Set(shots).size).toBe(shots.length);
    const again = report("tabs", "keyboard-nav").steps.map((s) => s.screenshot);
    expect(again.filter((png) => shots.includes(png))).toEqual([]);
  });

  it("drive resolves a target and reads markers inside a closed shadow root", () => {
    const run = report("tabs", "in-shadow-root");
    const tabs = run.steps.at(-1)?.markers.filter((m) => m.part.startsWith("tab "));
    expect(tabs?.some((m) => "data-selected" in m.attrs)).toBe(true);
  });

  it("drive reads the portaled Select list into ax and markers", () => {
    const open = report("select", "open").steps.at(-1);
    expect(open?.ax).toMatch(/^\s*listbox\b/m);
    expect(open?.markers.some((m) => m.part.startsWith("option "))).toBe(true);
  });

  it("a step with an infinite animation reports settled false within 2.5 s", () => {
    const step = report("spinner", "default").steps[1];
    expect(step?.settled).toBe(false);
    expect(step?.settleMs).toBeLessThanOrEqual(2500);
  });

  it("the cpu rate is 1 during load", () => {
    const run = report("select", "open", "--cpu-rate", "4");
    expect(run.cpuRate).toBe(4);
    const mount = run.timeline.findIndex((e) => e.kind === "mount");
    const firstFast = run.timeline.findIndex((e) => e.kind === "throttle" && e.rate !== 1);
    expect(mount).toBeGreaterThan(-1);
    expect(firstFast).toBeGreaterThan(mount);
  });

  it("--against HEAD on an unchanged tree is same", () => {
    const run = drive("tabs", "keyboard-nav", "--against", "HEAD", "--check");
    expect(run.code, run.stderr).toBe(0);
    const compare: { same: boolean; html: string; base: RunReport; head: RunReport } = JSON.parse(
      run.stdout,
    );
    expect(compare.same).toBe(true);
    expect(compare.base.steps).toHaveLength(compare.head.steps.length);
    expect(existsSync(compare.html)).toBe(true);
  });

  it("--against a ref without dev/components exits 2 with the message", () => {
    const before = spawnSync("git", ["merge-base", "origin/main", "HEAD"], {
      cwd: PKG,
      encoding: "utf8",
    }).stdout.trim();
    const run = drive("tabs", "keyboard-nav", "--against", before);
    expect(run.code).toBe(2);
    expect(run.stderr).toContain(`${before} has no scenario tabs/keyboard-nav`);
  });

  it("an unknown scenario exits 2 and names it", () => {
    const run = drive("tabs", "nope");
    expect(run.code).toBe(2);
    expect(run.stderr).toContain("no scenario tabs/nope");
  });
});
