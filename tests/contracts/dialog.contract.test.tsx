import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findAll } from "../../dev/harness/steps";
import { runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const OPEN = { press: { role: "button", name: "Open dialog" } };
const SELECT = { press: { role: "button", name: "Fruit Pick one" } };

async function mount(id: string) {
  const { scope } = await mountScenario("Dialog", id);
  const trigger = () => findAll(scope(), { role: "button", name: "Open dialog" })[0];
  const dialogs = () => findAll(scope(), { role: "dialog" });
  const listboxes = () => findAll(scope(), { role: "listbox" });
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  return { trigger, dialogs, listboxes, run };
}

describe("Dialog contract", () => {
  it("D1 the closed dialog is a trigger button and nothing else", async () => {
    const { trigger, dialogs } = await mount("open");
    expect(trigger()).toBeDefined();
    expect(dialogs()).toHaveLength(0);
  });

  it("D2 pressing the trigger opens a titled dialog and moves focus inside it", async () => {
    const { dialogs, run } = await mount("open");
    await run(OPEN);
    expect(findAll([document], { role: "dialog", name: "Dialog" })).toHaveLength(1);
    expect(dialogs()[0]?.contains(focusedElement())).toBe(true);
  });

  it("D3 Done closes the dialog and refocuses the trigger", async () => {
    const { trigger, dialogs, run } = await mount("close");
    await run(OPEN, { press: { role: "button", name: "Done" } });
    await vi.waitFor(() => expect(dialogs()).toHaveLength(0));
    await vi.waitFor(() => expect(focusedElement()).toBe(trigger()));
  });

  it("D4 Escape closes the dialog and refocuses the trigger", async () => {
    const { trigger, dialogs, run } = await mount("escape");
    await run(OPEN, { key: "Escape" });
    await vi.waitFor(() => expect(dialogs()).toHaveLength(0));
    await vi.waitFor(() => expect(focusedElement()).toBe(trigger()));
  });

  it("D5 a select inside opens its list and leaves the dialog open", async () => {
    const { dialogs, listboxes, run } = await mount("nested-select");
    await run(OPEN, SELECT);
    expect(listboxes()).toHaveLength(1);
    expect(dialogs()).toHaveLength(1);
  });

  it("D6 Escape in that list closes the list and leaves the dialog open", async () => {
    const { dialogs, listboxes, run } = await mount("nested-select");
    await run(OPEN, SELECT, { key: "Escape" });
    await vi.waitFor(() => expect(listboxes()).toHaveLength(0));
    expect(dialogs()).toHaveLength(1);
  });

  it("D7 a press beside the open dialog closes it and refocuses the trigger", async () => {
    const { trigger, dialogs, run } = await mount("outside-press");
    await run(OPEN, { pressAt: { x: 8, y: 8 } });
    await vi.waitFor(() => expect(dialogs()).toHaveLength(0));
    await vi.waitFor(() => expect(focusedElement()).toBe(trigger()));
  });
});
