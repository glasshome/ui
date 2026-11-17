import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { findAll, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetPortal,
  BottomSheetTrigger,
} from "../../src/solid";
import { MOTION_EXIT_MS } from "../../src/lib/motion-classes";
import { useFakeTime } from "../../src/testing";
import { commands } from "vitest/browser";
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
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const { sheets, run } = await mount("close");
    await run(OPEN, { press: { role: "button", name: "Done" } });
    await vi.advanceTimersByTimeAsync(MOTION_EXIT_MS.sheet);
    expect(sheets()).toHaveLength(0);
  });

  it("B4 Escape closes the sheet and refocuses the trigger", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const { trigger, sheets, run } = await mount("escape");
    await run(OPEN, { key: "Escape" });
    await vi.advanceTimersByTimeAsync(MOTION_EXIT_MS.sheet);
    expect(sheets()).toHaveLength(0);
    expect(focusedElement()).toBe(trigger());
  });

  it("B5 a select inside opens its list and leaves the sheet open", async () => {
    const { sheets, listboxes, run } = await mount("nested-select");
    await run(OPEN, SELECT);
    expect(listboxes()).toHaveLength(1);
    expect(sheets()).toHaveLength(1);
  });

  it("B6 Escape in that list closes the list and leaves the sheet open", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const { sheets, listboxes, run } = await mount("nested-select");
    await run(OPEN, SELECT, { key: "Escape" });
    await vi.advanceTimersByTimeAsync(MOTION_EXIT_MS.sheet);
    expect(listboxes()).toHaveLength(0);
    expect(sheets()).toHaveLength(1);
  });

  it("B7 a press beside the open sheet closes it", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const { sheets, run } = await mount("outside-press");
    await run(OPEN);
    await vi.advanceTimersByTimeAsync(1);
    await run({ pressAt: { x: 8, y: 8 } });
    await vi.advanceTimersByTimeAsync(MOTION_EXIT_MS.sheet);
    expect(sheets()).toHaveLength(0);
  });

  it("B9 a drag that ends where it began leaves the sheet open at once, grabbable and dismissable", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    render(() => (
      <BottomSheet defaultOpen>
        <BottomSheetPortal>
          <BottomSheetContent ariaLabel="Sheet">
            <p style={{ height: "300px" }}>Something to read.</p>
          </BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    ));
    await settle();
    await vi.advanceTimersByTimeAsync(MOTION_EXIT_MS.sheet);
    const sheet = findAll([document], { role: "dialog" })[0] as HTMLElement;
    expect(sheet.getAttribute("data-state")).toBe("open");

    const box = (sheet.querySelector("p") as Element).getBoundingClientRect();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await commands.mouse("move", x, y);
    await commands.mouse("down", x, y);
    await commands.mouse("move", x, y + 40);
    await settle();
    expect(sheet.getAttribute("data-state")).toBe("dragging");
    await commands.mouse("move", x, y);
    await settle();
    await commands.mouse("up", x, y);
    await settle();
    expect(sheet.getAttribute("data-state")).toBe("open");

    await commands.mouse("down", x, y);
    expect(sheet.getAttribute("data-state")).toBe("pressing");
    await commands.mouse("up", x, y);
    await settle();
    expect(sheet.getAttribute("data-state")).toBe("open");

    await input.pressAt(8, 8);
    await settle();
    expect(["closing", "closed"]).toContain(sheet.getAttribute("data-state"));
  });

  it("B10 the page is covered in the frame the sheet opens, and uncovered once it is gone", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const [open, setOpen] = createSignal(true);
    const page = document.body.appendChild(document.createElement("div"));
    page.setAttribute("data-page", "");
    onTestFinished(() => page.remove());
    render(() => (
      <BottomSheet open={open()} onOpenChange={setOpen}>
        <BottomSheetPortal>
          <BottomSheetContent ariaLabel="Sheet">Body</BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    ));
    expect(page.hasAttribute("data-covered")).toBe(true);
    setOpen(false);
    await settle();
    await vi.advanceTimersByTimeAsync(MOTION_EXIT_MS.sheet);
    expect(page.hasAttribute("data-covered")).toBe(false);
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
