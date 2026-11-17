import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, Show } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findAll, findTarget } from "../../dev/harness/steps";
import { MOTION_EXIT_MS } from "../../src/lib/motion-classes";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../src/solid";
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

  it("TT8 Content inside Portal adds one layer to the page and no empty wrapper", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const { container } = render(() => (
      <Tooltip>
        <TooltipTrigger>Save</TooltipTrigger>
        <Tooltip.Portal>
          <TooltipContent>Save changes</TooltipContent>
        </Tooltip.Portal>
      </Tooltip>
    ));
    await settle();
    const wrappers = () => [...document.body.children].filter((el) => el !== container);
    expect(wrappers()).toHaveLength(0);
    await input.hover(findTarget([document], { role: "button", name: "Save" }));
    await vi.advanceTimersByTimeAsync(OPEN_DELAY_MS);
    await settle();
    expect(findAll([document], { role: "tooltip" })).toHaveLength(1);
    expect(wrappers()).toHaveLength(1);
  });

  it("TT9 the trigger leaving the page closes an open tooltip", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const [shown, setShown] = createSignal(true);
    render(() => (
      <Tooltip>
        <Show when={shown()}>
          <TooltipTrigger>Save</TooltipTrigger>
        </Show>
        <TooltipContent>Save changes</TooltipContent>
      </Tooltip>
    ));
    await settle();
    await input.hover(findTarget([document], { role: "button", name: "Save" }));
    await vi.advanceTimersByTimeAsync(OPEN_DELAY_MS);
    await settle();
    expect(findAll([document], { role: "tooltip" })).toHaveLength(1);
    setShown(false);
    await vi.advanceTimersByTimeAsync(EXIT_MS);
    expect(findAll([document], { role: "tooltip" })).toHaveLength(0);
  });
});
