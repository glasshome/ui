import { cleanup, render } from "@solidjs/testing-library";
import { computeAccessibleName } from "dom-accessibility-api";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { findTarget, scenarioScope } from "../../dev/harness/steps";
import { Progress } from "../../src/solid";
import { mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const bar = () => findTarget(scenarioScope(), { role: "progressbar" }) as HTMLElement;
const parts = () => {
  const root = bar();
  const fill = root.querySelector<HTMLElement>('[data-slot="progress-indicator"]');
  return [root, fill?.parentElement ?? null, fill];
};
const aria = (el: Element, ...names: string[]) =>
  Object.fromEntries(names.map((n) => [n, el.getAttribute(n)]));
const VALUES = ["aria-valuenow", "aria-valuemin", "aria-valuemax", "aria-valuetext"];

describe("Progress contract", () => {
  it("PG1 a named progressbar with its value, range and percent", async () => {
    await mountScenario("Progress", "default");
    expect(bar().getAttribute("data-slot")).toBe("progress");
    expect(computeAccessibleName(bar())).toBe("Storage used");
    expect(aria(bar(), ...VALUES)).toEqual({
      "aria-valuenow": "40",
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuetext": "40%",
    });
  });

  it("PG2 below the maximum every part says loading", async () => {
    await mountScenario("Progress", "default");
    for (const el of parts()) expect(el?.getAttribute("data-progress")).toBe("loading");
  });

  it("PG3 at the maximum every part says complete", async () => {
    await mountScenario("Progress", "complete");
    for (const el of parts()) expect(el?.getAttribute("data-progress")).toBe("complete");
  });

  it("PG4 indeterminate drops the value and marks every part", async () => {
    await mountScenario("Progress", "indeterminate");
    expect(aria(bar(), "aria-valuenow", "aria-valuetext")).toEqual({
      "aria-valuenow": null,
      "aria-valuetext": null,
    });
    for (const el of parts()) {
      expect(el?.hasAttribute("data-indeterminate")).toBe(true);
      expect(el?.hasAttribute("data-progress")).toBe(false);
    }
  });

  it("PG5 minValue and maxValue set the range, the percent and the clamp", async () => {
    const [value, setValue] = createSignal(15);
    render(() => <Progress value={value()} minValue={10} maxValue={30} aria-label="Battery" />);
    await settle();
    expect(aria(bar(), ...VALUES)).toEqual({
      "aria-valuenow": "15",
      "aria-valuemin": "10",
      "aria-valuemax": "30",
      "aria-valuetext": "25%",
    });
    setValue(50);
    await settle();
    expect(aria(bar(), "aria-valuenow", "aria-valuetext")).toEqual({
      "aria-valuenow": "30",
      "aria-valuetext": "100%",
    });
    setValue(0);
    await settle();
    expect(bar().getAttribute("aria-valuenow")).toBe("10");
  });

  it("PG6 getValueLabel writes the value text", async () => {
    render(() => (
      <Progress
        value={3}
        maxValue={8}
        getValueLabel={({ value, max }) => `${value} of ${max} widgets`}
        aria-label="Installed"
      />
    ));
    await settle();
    expect(bar().getAttribute("aria-valuetext")).toBe("3 of 8 widgets");
  });

  it("PG7 the fill sits left by the share still to go", async () => {
    await mountScenario("Progress", "default");
    expect(parts()[2]?.style.transform).toBe("translateX(-60%)");
  });

  it("PG8 the ARIA values and markers follow the value", async () => {
    const [value, setValue] = createSignal(20);
    render(() => <Progress value={value()} aria-label="Upload" />);
    await settle();
    setValue(100);
    await settle();
    expect(aria(bar(), "aria-valuenow", "aria-valuetext")).toEqual({
      "aria-valuenow": "100",
      "aria-valuetext": "100%",
    });
    for (const el of parts()) expect(el?.getAttribute("data-progress")).toBe("complete");
  });
});
