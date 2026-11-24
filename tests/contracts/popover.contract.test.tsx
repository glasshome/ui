import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { findAll, findTarget, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { OUTSIDE } from "../../dev/components/popover/scenarios";
import { Button, Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "../../src/solid";
import { useAnchorTrigger } from "../../src/solid/popover.js";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const OPEN: Step = { press: { role: "button", name: "Filters" } };

async function mount(id: string) {
  const { scope } = await mountScenario("Popover", id);
  return helpers(scope);
}

function helpers(scope: () => ParentNode[]) {
  const button = (name: string) => findTarget(scope(), { role: "button", name });
  const dialogs = () => findAll(scope(), { role: "dialog" });
  const panels = () => dialogs().filter((el) => el.getAttribute("data-slot") === "popover-content");
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const expectClosed = async () => {
    await expect.poll(() => panels()).toHaveLength(0);
  };
  return { button, dialogs, panels, run, expectClosed };
}

describe("Popover contract", () => {
  it("P1 mounted, the trigger is a collapsed dialog button and no panel exists", async () => {
    const { button, dialogs } = await mount("closed");
    const trigger = button("Filters");
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.getAttribute("data-slot")).toBe("popover-trigger");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.hasAttribute("data-closed")).toBe(true);
    expect(dialogs()).toHaveLength(0);
  });

  it("P2 a press opens one panel the trigger controls", async () => {
    const { button, panels, run } = await mount("open");
    await run(OPEN);
    const [panel] = panels();
    expect(panels()).toHaveLength(1);
    expect(panel?.hasAttribute("data-expanded")).toBe(true);
    const trigger = button("Filters");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.hasAttribute("data-expanded")).toBe(true);
    expect(trigger.getAttribute("aria-controls")).toBe(panel?.id);
  });

  it("P3 focus moves to the panel's first control", async () => {
    const { button, run } = await mount("open");
    await run(OPEN);
    expect(focusedElement()).toBe(button("Lights"));
  });

  it("P4 Escape closes it and focus returns to the trigger", async () => {
    const { button, run, expectClosed } = await mount("escape");
    await run(OPEN, { key: "Escape" });
    await expectClosed();
    await expect.poll(() => focusedElement()).toBe(button("Filters"));
  });

  it("P5 a second press on a trigger the panel leaves uncovered closes it, focus on the trigger", async () => {
    render(() => (
      <div style={{ "margin-top": "240px", "margin-left": "40px" }}>
        <Popover placement="top">
          <PopoverTrigger>Filters</PopoverTrigger>
          <PopoverContent>
            <button type="button">Lights</button>
          </PopoverContent>
        </Popover>
      </div>
    ));
    await settle();
    const { button, panels, run, expectClosed } = helpers(scenarioScope);
    await run(OPEN);
    expect(panels()).toHaveLength(1);
    await run(OPEN);
    await expectClosed();
    await expect.poll(() => focusedElement()).toBe(button("Filters"));
  });

  it("P6 a press outside on nothing that takes focus closes it and focus returns to the trigger", async () => {
    const { button, run, expectClosed } = await mount("outside-press");
    await run(OPEN, { pressAt: OUTSIDE });
    await expectClosed();
    await expect.poll(() => focusedElement()).toBe(button("Filters"));
  });

  it("P7 a press outside on a control leaves focus on that control", async () => {
    const { button, run, expectClosed } = await mount("open");
    await run(OPEN, { press: { role: "button", name: "Other" } });
    await expectClosed();
    await settle();
    expect(focusedElement()).toBe(button("Other"));
  });

  it("P8 focus leaving the panel closes it", async () => {
    const { run, expectClosed } = await mount("open");
    await run(OPEN);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expectClosed();
  });

  it("P9 inside a dialog, Escape and a press on the dialog close only the panel", async () => {
    const { button, dialogs, panels, run, expectClosed } = await mount("in-dialog");
    const host = () => dialogs().find((el) => el.getAttribute("data-slot") !== "popover-content");
    await run(OPEN, { key: "Escape" });
    await expectClosed();
    expect(host()).toBeDefined();
    await expect.poll(() => focusedElement()).toBe(button("Filters"));
    await run(OPEN);
    expect(panels()).toHaveLength(1);
    const title = findTarget(scenarioScope(), { role: "heading", name: "Scenario" });
    await input.press(title);
    await expectClosed();
    expect(host()).toBeDefined();
    expect(host()?.contains(focusedElement())).toBe(true);
  });

  it("P10 inside a closed shadow root it opens, takes focus and closes on Escape", async () => {
    const { button, panels, run, expectClosed } = await mount("in-shadow-root");
    await run(OPEN);
    const [panel] = panels();
    expect(panels()).toHaveLength(1);
    expect(panel?.getRootNode()).toBeInstanceOf(ShadowRoot);
    expect(button("Filters").getAttribute("aria-controls")).toBe(panel?.id);
    expect(focusedElement()).toBe(button("Lights"));
    await run({ key: "Escape" });
    await expectClosed();
    await expect.poll(() => focusedElement()).toBe(button("Filters"));
  });

  it("P11 the panel covers its trigger from the trigger's top edge, inside the viewport", async () => {
    const { button, panels, run } = await mount("open");
    await run(OPEN);
    const box = panels()[0]?.getBoundingClientRect();
    const anchor = button("Filters").getBoundingClientRect();
    if (!box) throw new Error("no panel");
    expect(Math.abs(box.top - anchor.top)).toBeLessThanOrEqual(1);
    expect(box.left).toBeLessThanOrEqual(anchor.left);
    expect(box.right).toBeGreaterThanOrEqual(anchor.right);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(window.innerWidth);
  });

  it("P12 the panel follows its trigger as the page scrolls", async () => {
    const { button, panels, run } = await mount("scroll-follows");
    await run(OPEN);
    const gap = () =>
      (panels()[0]?.getBoundingClientRect().top ?? Number.NaN) -
      button("Filters").getBoundingClientRect().top;
    const before = gap();
    const top = button("Filters").getBoundingClientRect().top;
    window.scrollBy(0, 60);
    await settle();
    await expect.poll(() => Math.abs(gap() - before)).toBeLessThanOrEqual(1);
    expect(button("Filters").getBoundingClientRect().top).toBeCloseTo(top - 60, 0);
    window.scrollTo(0, 0);
  });

  it("P13 modal hides the page, keeps Tab in the panel and returns focus on an outside press", async () => {
    render(() => (
      <>
        <button type="button">Before</button>
        <Popover modal>
          <PopoverTrigger>Gallery</PopoverTrigger>
          <PopoverContent>
            <button type="button">First</button>
            <button type="button">Last</button>
          </PopoverContent>
        </Popover>
      </>
    ));
    await settle();
    const { button, panels, run, expectClosed } = helpers(scenarioScope);
    await run({ press: { role: "button", name: "Gallery" } });
    expect(findAll(scenarioScope(), { role: "button", name: "Before" })).toHaveLength(0);
    expect(getComputedStyle(document.body).pointerEvents).toBe("none");
    expect(focusedElement()).toBe(button("First"));
    await run({ key: "Tab" }, { key: "Tab" });
    expect(panels()[0]?.contains(focusedElement())).toBe(true);
    await input.pressAt(OUTSIDE.x, OUTSIDE.y);
    await expectClosed();
    await expect.poll(() => focusedElement()).toBe(button("Gallery"));
    expect(button("Before")).toBeDefined();
    expect(getComputedStyle(document.body).pointerEvents).toBe("auto");
  });

  it("P14 a PopoverAnchor places the panel over the anchor and focus returns to its control", async () => {
    const Opener = (props: { onToggle: () => void }) => {
      const register = useAnchorTrigger();
      return (
        <button type="button" ref={(el) => register?.(el)} onClick={() => props.onToggle()}>
          Pick
        </button>
      );
    };
    const [open, setOpen] = createSignal(false);
    render(() => (
      <div style={{ "margin-top": "160px", "margin-left": "40px", width: "320px" }}>
        <Popover surface="field" open={open()} onOpenChange={setOpen}>
          <PopoverAnchor data-testid="anchor">
            <Opener onToggle={() => setOpen(!open())} />
          </PopoverAnchor>
          <PopoverContent>
            <button type="button">Row</button>
          </PopoverContent>
        </Popover>
      </div>
    ));
    await settle();
    const { button, panels, run, expectClosed } = helpers(scenarioScope);
    await run({ press: { role: "button", name: "Pick" } });
    const anchor = document.querySelector('[data-testid="anchor"]')?.getBoundingClientRect();
    const box = panels()[0]?.getBoundingClientRect();
    if (!anchor || !box) throw new Error("no panel");
    expect(Math.abs(box.top - anchor.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.left - anchor.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.width - anchor.width)).toBeLessThanOrEqual(1);
    await run({ key: "Escape" });
    await expectClosed();
    await expect.poll(() => focusedElement()).toBe(button("Pick"));
  });

  it("P15 Title and Description name and describe the dialog", async () => {
    render(() => (
      <Popover defaultOpen>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverContent>
          <Popover.Title>Filter widgets</Popover.Title>
          <Popover.Description>Pick what to show.</Popover.Description>
        </PopoverContent>
      </Popover>
    ));
    await settle();
    const [panel] = findAll(scenarioScope(), { role: "dialog", name: "Filter widgets" });
    if (!panel) throw new Error("no named dialog");
    const described = panel.getAttribute("aria-describedby");
    expect(described && document.getElementById(described)?.textContent).toBe("Pick what to show.");
  });

  it("P16 controlled, a press reports the next state and a refused close keeps it open", async () => {
    const reports: boolean[] = [];
    render(() => (
      <Popover open onOpenChange={(next: boolean) => reports.push(next)}>
        <PopoverTrigger as={Button}>Filters</PopoverTrigger>
        <PopoverContent>
          <button type="button">Lights</button>
        </PopoverContent>
      </Popover>
    ));
    await settle();
    const { panels, run } = helpers(scenarioScope);
    await run({ key: "Escape" });
    expect(reports).toEqual([false]);
    expect(panels()).toHaveLength(1);
  });
});
