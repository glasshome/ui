import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findAll, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetPortal,
  BottomSheetTrigger,
} from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const OPEN = { press: { role: "button", name: "Open sheet" } };
const SELECT = { press: { role: "button", name: "Fruit Pick one" } };

async function mount(id: string) {
  const { scope } = await mountScenario("BottomSheet", id);
  const trigger = () => findAll(scope(), { role: "button", name: "Open sheet" })[0];
  const sheets = () => findAll(scope(), { role: "dialog" });
  const listboxes = () => findAll(scope(), { role: "listbox" });
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  return { trigger, sheets, listboxes, run };
}

describe("BottomSheet contract", () => {
  it("B1 the closed sheet is a trigger button and nothing else", async () => {
    const { trigger, sheets } = await mount("open");
    expect(trigger()).toBeDefined();
    expect(sheets()).toHaveLength(0);
  });

  it("B2 pressing the trigger opens a titled sheet and moves focus inside it", async () => {
    const { sheets, run } = await mount("open");
    await run(OPEN);
    expect(findAll([document], { role: "dialog", name: "Sheet" })).toHaveLength(1);
    expect(sheets()[0]?.contains(focusedElement())).toBe(true);
  });

  it("B3 Done closes the sheet", async () => {
    const { sheets, run } = await mount("close");
    await run(OPEN, { press: { role: "button", name: "Done" } });
    await vi.waitFor(() => expect(sheets()).toHaveLength(0));
  });

  it("B4 Escape closes the sheet and refocuses the trigger", async () => {
    const { trigger, sheets, run } = await mount("escape");
    await run(OPEN, { key: "Escape" });
    await vi.waitFor(() => expect(sheets()).toHaveLength(0));
    await vi.waitFor(() => expect(focusedElement()).toBe(trigger()));
  });

  it("B5 a select inside opens its list and leaves the sheet open", async () => {
    const { sheets, listboxes, run } = await mount("nested-select");
    await run(OPEN, SELECT);
    expect(listboxes()).toHaveLength(1);
    expect(sheets()).toHaveLength(1);
  });

  it("B6 Escape in that list closes the list and leaves the sheet open", async () => {
    const { sheets, listboxes, run } = await mount("nested-select");
    await run(OPEN, SELECT, { key: "Escape" });
    await vi.waitFor(() => expect(listboxes()).toHaveLength(0));
    expect(sheets()).toHaveLength(1);
  });

  it("B7 a press beside the open sheet closes it", async () => {
    const { sheets, run } = await mount("outside-press");
    await run(OPEN, { pressAt: { x: 8, y: 8 } });
    await vi.waitFor(() => expect(sheets()).toHaveLength(0));
  });

  it("B8 once open, nothing on the sheet sends focus to the trigger behind it, and a click into a field keeps it there", async () => {
    render(() => (
      <BottomSheet>
        <BottomSheetTrigger>Open sheet</BottomSheetTrigger>
        <BottomSheetPortal>
          <BottomSheetContent ariaLabel="Sheet">
            <p>Something to read.</p>
            <input aria-label="Name" />
          </BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    ));
    const trigger = findAll([document], { role: "button", name: "Open sheet" })[0] as HTMLElement;
    await input.press(trigger);
    let triggerFocuses = 0;
    trigger.addEventListener("focus", () => triggerFocuses++);
    await settle();
    const sheet = findAll([document], { role: "dialog" })[0] as HTMLElement;
    expect(sheet.getAttribute("data-state")).toBe("open");
    expect(triggerFocuses).toBe(0);

    await input.press(sheet.querySelector("p") as Element);
    await settle();
    expect(triggerFocuses).toBe(0);

    const field = findAll([document], { role: "textbox", name: "Name" })[0] as HTMLElement;
    await input.press(field);
    await settle();
    expect(focusedElement()).toBe(field);
    expect(triggerFocuses).toBe(0);
  });
});
