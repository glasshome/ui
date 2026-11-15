import { describe, expect, it } from "vitest";
import { diffReports } from "../../dev/drive/diff";
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

const AX = ['tablist "Rooms"', '  tab "Lights" focused selected', '  tab "Climate" disabled'].join(
  "\n",
);

function step(index: number, over: Partial<StepReport> = {}): StepReport {
  return {
    index,
    step: index === 0 ? null : { key: "ArrowRight" },
    settled: true,
    settleMs: 40,
    screenshot: `/tmp/step-${index}.png`,
    ax: AX,
    focus: ["tablist", 'tab "Lights"'],
    markers: [{ part: 'tab "Lights"', attrs: { "data-selected": "" } }],
    perf: PERF,
    ...over,
  };
}

function report(steps: StepReport[], build = "abc1234"): RunReport {
  return {
    component: "Tabs",
    scenario: "keyboard-nav",
    build,
    cpuRate: 1,
    width: "desktop",
    theme: "dark",
    steps,
    timeline: [],
    errors: [],
    dir: `/tmp/${build}`,
  };
}

describe("diffReports", () => {
  it("identical reports are same", () => {
    const result = diffReports(report([step(0), step(1)]), report([step(0), step(1)], "def5678"));
    expect(result.same).toBe(true);
    expect(result.steps).toEqual([
      { index: 0, ax: [], focus: null, markers: [], perf: {} },
      { index: 1, ax: [], focus: null, markers: [], perf: {} },
    ]);
  });

  it("a changed aria-selected shows in ax and markers", () => {
    const head = step(1, {
      ax: AX.replace('"Lights" focused selected', '"Lights" focused'),
      markers: [{ part: 'tab "Lights"', attrs: {} }],
    });
    const [, changed] = diffReports(report([step(0), step(1)]), report([step(0), head])).steps;
    expect(changed?.ax).toContain('-   tab "Lights" focused selected');
    expect(changed?.ax).toContain('+   tab "Lights" focused');
    expect(changed?.markers.filter((l) => /^[-+]/.test(l))).toEqual([
      '- tab "Lights" data-selected=""',
      '+ tab "Lights"',
    ]);
    expect(changed?.focus).toBeNull();
  });

  it("a perf change lists only the changed fields", () => {
    const head = step(1, { perf: { ...PERF, recalcs: 9, inputToPaintMs: null } });
    const result = diffReports(report([step(0), step(1)]), report([step(0), head]));
    expect(result.steps[1]?.perf).toEqual({ recalcs: [3, 9], inputToPaintMs: [30, null] });
    expect(result.same).toBe(true);
  });

  it("differing step counts report the extra steps", () => {
    const result = diffReports(report([step(0)]), report([step(0), step(1)]));
    expect(result.same).toBe(false);
    const extra = result.steps[1];
    expect(extra?.index).toBe(1);
    expect(extra?.ax.every((l) => l.startsWith("+ "))).toBe(true);
    expect(extra?.focus).toEqual([[], ["tablist", 'tab "Lights"']]);
  });

  it("a moved focus shows both paths", () => {
    const head = step(1, { focus: ["tablist", 'tab "Media"'] });
    const result = diffReports(report([step(0), step(1)]), report([step(0), head]));
    expect(result.same).toBe(false);
    expect(result.steps[1]?.focus).toEqual([
      ["tablist", 'tab "Lights"'],
      ["tablist", 'tab "Media"'],
    ]);
  });
});
