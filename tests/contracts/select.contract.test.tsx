import { cleanup } from "@solidjs/testing-library";
import { computeAccessibleName } from "dom-accessibility-api";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { CLOSED_ROOTS } from "../../dev/harness/closed-roots";
import { findAll, findTarget, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { expectGap } from "../harness/gap";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const TRIGGER = { role: "button", name: "Fruit Pick one" };

async function mount(id = "closed") {
  const { scope } = await mountScenario("Select", id);
  const trigger = () => {
    const [only, ...rest] = findAll(scope(), { role: "button" }).filter(
      (b) => b.getAttribute("aria-haspopup") === "listbox",
    );
    if (!only || rest.length > 0) throw new Error("expected one listbox trigger");
    return only;
  };
  const option = (name: string) => findTarget(scope(), { role: "option", name });
  const listboxes = () => findAll(scope(), { role: "listbox" });
  const highlighted = () =>
    findAll(scope(), { role: "option" }).filter((o) => o.hasAttribute("data-highlighted"));
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const closed = () => vi.waitFor(() => expect(listboxes()).toHaveLength(0));
  return { scope, trigger, option, listboxes, highlighted, run, closed };
}

describe("Select contract", () => {
  it("S1 the closed trigger is a labelled button that pops a listbox", async () => {
    const { trigger, listboxes } = await mount();
    expect(computeAccessibleName(trigger())).toBe("Fruit Pick one");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(listboxes()).toHaveLength(0);
    expect(trigger().textContent).toContain("Pick one");
  });

  it("S2 pressing the trigger opens a listbox with an option per value", async () => {
    const { scope, trigger, listboxes, run } = await mount();
    await run({ press: TRIGGER });
    expect(listboxes()).toHaveLength(1);
    expect(findAll(scope(), { role: "option" }).map((o) => o.textContent)).toEqual([
      "Apple",
      "Banana",
      "Cherry",
      "Elderberry",
    ]);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(trigger().hasAttribute("data-expanded")).toBe(true);
  });

  it("S3 opening moves focus into the list", async () => {
    const { listboxes, run } = await mount();
    await run({ press: TRIGGER });
    expect(listboxes()[0]?.contains(focusedElement())).toBe(true);
  });

  it("S4 pressing an option picks it, closes and refocuses the trigger", async () => {
    const { trigger, run, closed } = await mount();
    await run({ press: TRIGGER }, { press: { role: "option", name: "Cherry" } });
    await closed();
    expect(trigger().textContent).toContain("Cherry");
    await vi.waitFor(() => expect(focusedElement()).toBe(trigger()));
  });

  it("S5 Enter on the focused trigger opens the list", async () => {
    const { trigger, listboxes, run } = await mount();
    await run({ key: "Tab" });
    expect(focusedElement()).toBe(trigger());
    await run({ key: "Enter" });
    expect(listboxes()).toHaveLength(1);
  });

  it("S6 ArrowDown highlights the next option", async () => {
    const { highlighted, run } = await mount();
    await run({ key: "Tab" }, { key: "Enter" });
    const before = highlighted().map((o) => o.textContent);
    await run({ key: "ArrowDown" });
    const after = highlighted().map((o) => o.textContent);
    const order = ["Apple", "Banana", "Cherry", "Elderberry"];
    expect(after).toHaveLength(1);
    expect(order.indexOf(after[0] ?? "")).toBe(order.indexOf(before[0] ?? "") + 1);
  });

  it("S7 Enter on a highlighted option picks it", async () => {
    const { trigger, highlighted, run, closed } = await mount();
    await run({ key: "Tab" }, { key: "Enter" }, { key: "ArrowDown" });
    const picked = highlighted()[0]?.textContent ?? "";
    await run({ key: "Enter" });
    await closed();
    expect(trigger().textContent).toContain(picked);
    await vi.waitFor(() => expect(focusedElement()).toBe(trigger()));
  });

  it("S8 Escape closes without a change and refocuses the trigger", async () => {
    const { trigger, run, closed } = await mount();
    await run({ press: TRIGGER }, { key: "Escape" });
    await closed();
    expect(trigger().textContent).toContain("Pick one");
    await vi.waitFor(() => expect(focusedElement()).toBe(trigger()));
  });

  it("S9 typing highlights the first option starting with the typed letters", async () => {
    const { highlighted, run } = await mount();
    await run({ press: TRIGGER }, { type: "Ch" });
    expect(highlighted().map((o) => o.textContent)).toEqual(["Cherry"]);
  });

  it("S10 the picked option is marked selected when the list reopens", async () => {
    const { option, run, closed } = await mount();
    await run({ press: TRIGGER }, { press: { role: "option", name: "Banana" } });
    await closed();
    await run({ press: { role: "button", name: "Fruit Banana" } });
    expect(option("Banana").getAttribute("aria-selected")).toBe("true");
    expect(option("Banana").hasAttribute("data-selected")).toBe(true);
    expect(option("Apple").getAttribute("aria-selected")).toBe("false");
  });

  it("S11 a press outside closes the list without a change", async () => {
    const { trigger, run, closed } = await mount();
    await run({ press: TRIGGER });
    await commands.mouse("down", innerWidth - 4, innerHeight - 4);
    await commands.mouse("up", innerWidth - 4, innerHeight - 4);
    await closed();
    expect(trigger().textContent).toContain("Pick one");
  });

  it("S12 inside a bottom sheet the list sits on top and leaves the sheet open", async () => {
    const sheetOpen = (scope: () => ParentNode[]) =>
      findAll(scope(), { role: "dialog", name: "Scenario" });
    const picked = await mount("in-sheet");
    await picked.run({ press: TRIGGER });
    const cherry = picked.option("Cherry").getBoundingClientRect();
    const top = document.elementFromPoint(
      cherry.x + cherry.width / 2,
      cherry.y + cherry.height / 2,
    );
    expect(picked.option("Cherry").contains(top)).toBe(true);
    await picked.run({ press: { role: "option", name: "Cherry" } });
    await picked.closed();
    expect(sheetOpen(picked.scope)).toHaveLength(1);
    cleanup();

    const escaped = await mount("in-sheet");
    await escaped.run({ press: TRIGGER }, { key: "Escape" });
    await escaped.closed();
    expect(sheetOpen(escaped.scope), "sheet open after Escape").toHaveLength(1);
  });

  it("S13 inside a closed shadow root the list opens and picks in the same root", async () => {
    const { trigger, listboxes, run, closed } = await mount("in-shadow-root");
    const [root] = CLOSED_ROOTS;
    await expectGap(async () => {
      await run({ press: TRIGGER });
      expect(listboxes(), "list open in the shadow root").toHaveLength(1);
      expect(root?.contains(listboxes()[0] ?? null)).toBe(true);
      await run({ press: { role: "option", name: "Banana" } });
      await closed();
      expect(trigger().textContent).toContain("Banana");
    }, "list open in the shadow root: expected [] to have a length of 1 but got +0");
  });

  it("S14 End in a long list scrolls the last option into view", async () => {
    const { option, run } = await mount("long-list");
    await run({ press: TRIGGER }, { key: "End" });
    const last = option("Option 60");
    expect(last.hasAttribute("data-highlighted")).toBe(true);
    let scroller = last.parentElement;
    while (scroller && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) {
      scroller = scroller.parentElement;
    }
    if (!scroller) throw new Error("the list has no scroll container");
    const box = last.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    // Scroll offsets are whole pixels, option boxes are not.
    expect(box.top).toBeGreaterThanOrEqual(view.top - 1);
    expect(box.bottom).toBeLessThanOrEqual(view.bottom + 1);
  });
});
