import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findAll, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { expectGap } from "../harness/gap";
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

  it("B6 Escape in that list closes the list, and the sheet with it", async () => {
    const { sheets, listboxes, run } = await mount("nested-select");
    await run(OPEN, SELECT, { key: "Escape" });
    await vi.waitFor(() => expect(listboxes()).toHaveLength(0));
    await expectGap(
      () => expect(sheets(), "sheet open after Escape").toHaveLength(1),
      "sheet open after Escape: expected [] to have a length of 1 but got +0",
    );
  });
});
