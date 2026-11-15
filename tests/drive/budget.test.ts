import { describe, expect, it } from "vitest";
import { type Budget, checkBudget } from "../../dev/drive/budget";
import type { RunReport, StepPerf, StepReport } from "../../dev/drive/types";

const PERF: StepPerf = {
  recalcs: 3,
  elementsRestyled: 40,
  largestRecalc: 20,
  styleMs: 1.5,
  layouts: 1,
  layoutMs: 0.4,
  paints: 2,
  longFrames: 0,
  longestFrameMs: 16,
  inputToPaintMs: 30,
};

const step = (index: number, perf: Partial<StepPerf> = {}): StepReport => ({
  index,
  step: index === 0 ? null : { key: "ArrowRight" },
  settled: true,
  settleMs: 40,
  screenshot: `/tmp/step-${index}.png`,
  ax: "",
  focus: [],
  markers: [],
  perf: { ...PERF, ...perf },
});

const report = (steps: StepReport[]): RunReport => ({
  component: "Tabs",
  scenario: "keyboard-nav",
  build: "abc1234",
  cpuRate: 4,
  width: "desktop",
  theme: "dark",
  steps,
  timeline: [],
  errors: [],
  dir: "/tmp/tabs-keyboard-nav-abcdef",
});

const limit = (max: number) => ({ max, reason: "kobalte baseline 2026-11-15" });
const row = (restyled: number, recalc: number, layouts: number) => ({
  elementsRestyled: limit(restyled),
  largestRecalc: limit(recalc),
  layouts: limit(layouts),
});

const BUDGET: Budget = {
  "keyboard-nav": { steps: { "0": row(40, 20, 1), "1": row(40, 20, 1) } },
};

describe("checkBudget", () => {
  it("a report under budget has no overruns", () => {
    expect(checkBudget(report([step(0), step(1, { layouts: 0 })]), BUDGET)).toEqual([]);
  });

  it("an overrun names scenario, step and field", () => {
    expect(checkBudget(report([step(0), step(1, { elementsRestyled: 41 })]), BUDGET)).toEqual([
      "keyboard-nav step 1 elementsRestyled 41 > 40",
    ]);
  });

  it("a missing scenario budget is an overrun", () => {
    expect(checkBudget(report([step(0)]), {})).toEqual(["keyboard-nav has no budget"]);
  });

  it("a step the budget does not list is an overrun", () => {
    expect(checkBudget(report([step(0), step(1), step(2)]), BUDGET)).toEqual([
      "keyboard-nav step 2 has no budget",
    ]);
  });
});
