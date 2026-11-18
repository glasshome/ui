import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { findAll, findTarget, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

async function mount(id = "default") {
  const { scope } = await mountScenario("ToggleGroup", id);
  const item = (name: string) => findTarget(scope(), { role: "button", name });
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const pressed = () =>
    findAll(scope(), { role: "button" })
      .filter((el) => el.getAttribute("aria-pressed") === "true")
      .map((el) => el.textContent);
  return { scope, item, run, pressed };
}

const press = (name: string): Step => ({ press: { role: "button", name } });

describe("ToggleGroup contract", () => {
  it("TG1 one named group holds a pressed-state button per item", async () => {
    const { scope, item, pressed } = await mount();
    expect(findAll(scope(), { role: "group", name: "Fan speed" })).toHaveLength(1);
    expect(findAll(scope(), { role: "button" })).toHaveLength(4);
    expect(item("Medium").getAttribute("aria-pressed")).toBe("true");
    expect(item("Medium").hasAttribute("data-pressed")).toBe(true);
    expect(item("Low").getAttribute("aria-pressed")).toBe("false");
    expect(item("Low").hasAttribute("data-pressed")).toBe(false);
    expect(pressed()).toEqual(["Medium"]);
  });

  it("TG2 pressing an unpressed item moves the press to it", async () => {
    const { run, pressed } = await mount();
    await run(press("High"));
    expect(pressed()).toEqual(["High"]);
  });

  it("TG3 pressing the pressed item releases it", async () => {
    const { run, pressed } = await mount();
    await run(press("Medium"));
    expect(pressed()).toEqual([]);
  });

  it("TG4 in a multiple group each press toggles its own item", async () => {
    const { run, pressed } = await mount("multiple");
    expect(pressed()).toEqual(["Mon"]);
    await run(press("Tue"));
    expect(pressed()).toEqual(["Mon", "Tue"]);
    await run(press("Mon"));
    expect(pressed()).toEqual(["Tue"]);
  });

  it("TG5 a disabled item says so and ignores a press", async () => {
    const { item, run, pressed } = await mount();
    expect(item("Auto").hasAttribute("disabled")).toBe(true);
    expect(item("Auto").hasAttribute("data-disabled")).toBe(true);
    await run(press("Auto"));
    expect(pressed()).toEqual(["Medium"]);
  });

  it("TG6 arrows move focus between enabled items, wrapping, and press nothing", async () => {
    const { item, run, pressed } = await mount();
    await run(press("Low"), { key: "ArrowRight" });
    expect(pressed()).toEqual(["Low"]);
    expect(focusedElement()).toBe(item("Medium"));
    await run({ key: "ArrowRight" });
    expect(focusedElement()).toBe(item("High"));
    await run({ key: "ArrowRight" });
    expect(focusedElement()).toBe(item("Low"));
    await run({ key: "ArrowLeft" });
    expect(focusedElement()).toBe(item("High"));
    expect(pressed()).toEqual(["Low"]);
  });

  it("TG7 Home and End reach the first and last enabled item", async () => {
    const { item, run } = await mount();
    await run(press("Medium"), { key: "End" });
    expect(focusedElement()).toBe(item("High"));
    await run({ key: "Home" });
    expect(focusedElement()).toBe(item("Low"));
  });

  it("TG8 Tab lands on the pressed item, a second Tab leaves the group", async () => {
    const { scope, item, run } = await mount();
    await run({ key: "Tab" });
    expect(focusedElement()).toBe(item("Medium"));
    await run({ key: "Tab" });
    const group = findTarget(scope(), { role: "group", name: "Fan speed" });
    expect(group.contains(focusedElement())).toBe(false);
  });

  it("TG9 Enter and Space toggle the focused item", async () => {
    const { run, pressed } = await mount();
    await run({ key: "Tab" }, { key: "ArrowLeft" }, { key: "Enter" });
    expect(pressed()).toEqual(["Low"]);
    await run({ key: " " });
    expect(pressed()).toEqual([]);
  });

  it("TG10 pressing an item works inside a dialog and a closed shadow root", async () => {
    const pressHigh = async (id: string) => {
      const { run, pressed } = await mount(id);
      await run(press("High"));
      expect(pressed(), id).toEqual(["High"]);
    };
    await pressHigh("in-dialog");
    cleanup();
    await pressHigh("in-shadow-root");
  });
});
