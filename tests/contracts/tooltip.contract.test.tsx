import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findAll, findTarget } from "../../dev/harness/steps";
import { MOTION_EXIT_MS } from "../../src/lib/motion-classes";
import { useFakeTime } from "../../src/testing";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(() => cleanup());

const OPEN_DELAY_MS = 700;
const CLOSE_DELAY_MS = 100;
const EXIT_MS = MOTION_EXIT_MS.overlay;

const tooltips = (scope: () => ParentNode[]) => findAll(scope(), { role: "tooltip" });

async function opened() {
  useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
  const { scope } = await mountScenario("Tooltip", "hover");
  const trigger = findTarget(scope(), { role: "button", name: "Save" });
  await input.hover(trigger);
  await vi.advanceTimersByTimeAsync(OPEN_DELAY_MS);
  await settle();
  expect(tooltips(scope)).toHaveLength(1);
  return { scope, trigger };
}

describe("Tooltip contract", () => {
  it("TT1 mounted, no tooltip exists", async () => {
    const { scope } = await mountScenario("Tooltip", "hover");
    expect(tooltips(scope)).toHaveLength(0);
  });

  it("TT2 the pointer resting on the trigger opens one tooltip that describes it", async () => {
    const { scope, trigger } = await opened();
    const [tip] = tooltips(scope);
    expect(tip?.textContent).toBe("Save changes");
    expect(tip?.id).not.toBe("");
    expect(trigger.getAttribute("aria-describedby")?.split(" ")).toContain(tip?.id);
  });

  it("TT3 keyboard focus on the trigger opens the tooltip", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const { scope } = await mountScenario("Tooltip", "focus");
    await input.key("Tab");
    await vi.advanceTimersByTimeAsync(0);
    await settle();
    expect(tooltips(scope)).toHaveLength(1);
    expect(focusedElement()).toBe(findTarget(scope(), { role: "button", name: "Save" }));
  });

  it("TT4 Escape closes it", async () => {
    const { scope } = await opened();
    await input.key("Escape");
    await vi.advanceTimersByTimeAsync(EXIT_MS);
    expect(tooltips(scope)).toHaveLength(0);
  });

  it("TT5 the pointer moving to another button closes it", async () => {
    const { scope } = await opened();
    await input.hover(findTarget(scope(), { role: "button", name: "Other" }));
    await vi.advanceTimersByTimeAsync(CLOSE_DELAY_MS + EXIT_MS);
    expect(tooltips(scope)).toHaveLength(0);
  });

  it("TT6 pressing the trigger closes it", async () => {
    const { scope, trigger } = await opened();
    await input.press(trigger);
    await vi.advanceTimersByTimeAsync(EXIT_MS);
    expect(tooltips(scope)).toHaveLength(0);
  });

  it("TT7 sits below the trigger, inside the viewport", async () => {
    const { scope, trigger } = await opened();
    await settle();
    const [tip] = tooltips(scope);
    const box = tip?.getBoundingClientRect();
    const anchor = trigger.getBoundingClientRect();
    if (!box) throw new Error("no tooltip");
    expect(box.top).toBeGreaterThanOrEqual(anchor.bottom);
    expect(box.top - anchor.bottom).toBeLessThanOrEqual(16);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(window.innerWidth);
  });
});
