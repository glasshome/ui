import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ROOMS, Toolbar } from "../../dev/blocks/collection/scenarios";
import { findAll, findTarget, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { createTypeahead, TYPEAHEAD_MS } from "../../src/lib/behavior/collection";
import { useFakeTime } from "../../src/testing";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

async function mount(id: string) {
  const { scope } = await mountScenario("collection", id);
  const item = (name: string) => findTarget(scope(), { role: "button", name });
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const focused = () => focusedElement()?.textContent;
  const stops = () =>
    findAll(scope(), { role: "button" })
      .filter((el) => el.closest('[role="toolbar"]') && el.getAttribute("tabindex") === "0")
      .map((el) => el.textContent);
  return { scope, item, run, focused, stops };
}

const press = (name: string): Step => ({ press: { role: "button", name } });
const key = (k: string): Step => ({ key: k });

describe("collection contract", () => {
  it("CO1 arrows move along the orientation, skip disabled items and stop at the ends", async () => {
    const { run, focused } = await mount("vertical");
    await run(press("Hall"), key("ArrowDown"));
    expect(focused()).toBe("Kitchen");
    await run(key("ArrowRight"));
    expect(focused(), "a cross-axis arrow does nothing").toBe("Kitchen");
    await run(key("ArrowDown"));
    expect(focused(), "Lounge is disabled").toBe("Office");
    await run(key("ArrowDown"));
    expect(focused(), "no loop: Office is the last enabled room").toBe("Office");
    await run(key("ArrowUp"), key("ArrowUp"), key("ArrowUp"));
    expect(focused(), "no loop: Hall is the first enabled room").toBe("Hall");
    cleanup();

    const looped = render(() => <Toolbar rooms={ROOMS} loop />);
    await settle();
    await input.press(looped.getByRole("button", { name: "Office" }));
    await input.key("ArrowDown");
    expect(focused(), "loop wraps to the first enabled room").toBe("Hall");
    await input.key("ArrowUp");
    expect(focused()).toBe("Office");
    cleanup();

    const virtual = render(() => <Toolbar rooms={ROOMS} focus="virtual" />);
    await settle();
    const bar = virtual.getByRole("toolbar");
    await input.key("Tab");
    expect(focusedElement()).toBe(bar);
    await input.key("ArrowDown");
    expect(focusedElement(), "virtual focus stays on the container").toBe(bar);
    expect(bar.getAttribute("aria-activedescendant")).toBe("room-hall");
    await input.key("ArrowDown");
    expect(bar.getAttribute("aria-activedescendant")).toBe("room-kitchen");
  });

  it("CO2 Home and End reach the first and last enabled item", async () => {
    const { run, focused } = await mount("vertical");
    await run(press("Kitchen"), key("End"));
    expect(focused()).toBe("Office");
    await run(key("Home"));
    expect(focused()).toBe("Hall");
  });

  it("CO3 typing jumps by prefix, a repeated letter cycles, and the buffer resets", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const { run, focused } = await mount("typeahead");
    await run(press("Bath"), { type: "d" });
    expect(focused()).toBe("Den");
    await run({ type: "i" });
    expect(focused(), "'di' matches Dining").toBe("Dining");
    await vi.advanceTimersByTimeAsync(TYPEAHEAD_MS);
    await run({ type: "b" });
    expect(focused(), "a fresh 'b' starts after Dining and wraps to Bath").toBe("Bath");
    await run({ type: "b" });
    expect(focused(), "'bb' cycles to the next room starting with b").toBe("Bedroom");
    await run({ type: "b" });
    expect(focused()).toBe("Bath");
  });

  it("CO4 roving focus keeps exactly one tab stop, and Tab leaves the collection", async () => {
    const { run, focused, stops } = await mount("vertical");
    expect(stops()).toEqual(["Hall"]);
    await run(key("Tab"));
    expect(focused()).toBe("Hall");
    await run(key("ArrowDown"));
    expect(stops()).toEqual(["Kitchen"]);
    await run(key("Tab"));
    expect(focused()).toBe("After");
    expect(stops()).toEqual(["Kitchen"]);
  });

  it("CO5 an item inserted in the middle is reached in its DOM place", async () => {
    const { run, focused } = await mount("inserted-middle");
    await run(press("Add a garage"), press("Hall"), key("ArrowDown"));
    expect(focused()).toBe("Garage");
    await run(key("ArrowDown"));
    expect(focused()).toBe("Kitchen");
  });

  it("CO6 in a right-to-left row Left and Right swap", async () => {
    const { run, focused } = await mount("horizontal-rtl");
    await run(press("Hall"), key("ArrowLeft"));
    expect(focused()).toBe("Kitchen");
    await run(key("ArrowRight"));
    expect(focused()).toBe("Hall");
  });

  it("CO7 a keyboard move scrolls the highlighted item into the list's view", async () => {
    const { scope, run, item } = await mount("long-list");
    await run(press("Room 1"), key("End"));
    const list = findTarget(scope(), { role: "toolbar" }).getBoundingClientRect();
    const last = item("Room 40").getBoundingClientRect();
    expect(last.top).toBeGreaterThanOrEqual(list.top - 1);
    expect(last.bottom).toBeLessThanOrEqual(list.bottom + 1);
  });

  it("CO8 arrows and the single tab stop hold inside a closed shadow root", async () => {
    const { run, focused, stops } = await mount("in-shadow-root");
    expect(stops()).toEqual(["Hall"]);
    await run(press("Hall"), key("ArrowDown"));
    expect(focused()).toBe("Kitchen");
    await run(key("ArrowDown"));
    expect(focused()).toBe("Office");
    expect(stops()).toEqual(["Office"]);
  });

  it("CO9 re-sorted items are walked in their new order", async () => {
    const { run, focused } = await mount("reordered");
    await run(press("Reverse"), press("Kitchen"), key("ArrowDown"));
    expect(focused()).toBe("Hall");
    await run(key("Home"));
    expect(focused()).toBe("Office");
  });

  it("CO10 removing the item that holds the tab stop hands it to the first enabled item", async () => {
    const { run, stops } = await mount("removed-highlighted");
    await run(press("Kitchen"));
    expect(stops()).toEqual(["Kitchen"]);
    await run(press("Remove the kitchen"));
    expect(stops()).toEqual(["Hall"]);
  });

  it("CO11 with disabledFocusable an aria-disabled item stays in the arrow order and can hold the tab stop", async () => {
    const view = render(() => <Toolbar rooms={ROOMS} loop disabledFocusable />);
    await settle();
    const focused = () => focusedElement()?.textContent;
    await input.key("Tab");
    expect(focused(), "the first room holds the stop though disabled").toBe("Attic");
    await input.key("ArrowDown");
    expect(focused()).toBe("Hall");
    await input.key("End");
    expect(focused(), "End reaches the disabled last room").toBe("Yard");
    await input.key("ArrowDown");
    expect(focused(), "loop wraps through the disabled first room").toBe("Attic");
    expect(view.getByRole("button", { name: "Attic" }).getAttribute("tabindex")).toBe("0");
  });

  it("CO12 createTypeahead matches over texts alone, and ignores keys that type nothing", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const texts = ["Bath", "Bedroom", "Den", "Dining"];
    const results: (number | undefined)[] = [];
    let current = 0;
    render(() => {
      const typer = createTypeahead();
      const onKey = (event: KeyboardEvent) => {
        const index = typer.match(event, texts, current);
        results.push(index);
        if (index !== undefined && index >= 0) current = index;
      };
      return (
        <button type="button" on:keydown={onKey}>
          Field
        </button>
      );
    });
    await settle();
    await input.key("Tab");
    await input.type("d");
    await input.type("i");
    expect(texts[current], "'di' matches Dining").toBe("Dining");
    await input.key("Enter");
    expect(results.at(-1), "Enter types nothing").toBeUndefined();
    await vi.advanceTimersByTimeAsync(TYPEAHEAD_MS);
    await input.key(" ");
    expect(results.at(-1), "a Space on an empty buffer types nothing").toBeUndefined();
    await input.type("b");
    expect(texts[current], "a fresh 'b' wraps to Bath").toBe("Bath");
    await input.type("b");
    expect(texts[current], "'bb' cycles").toBe("Bedroom");
    await input.type("z");
    expect(results.at(-1), "no match").toBe(-1);
  });
});
