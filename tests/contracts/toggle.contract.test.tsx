import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { findAll, findTarget, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { Toggle } from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

async function mount(id = "default") {
  const { scope } = await mountScenario("Toggle", id);
  return helpers(scope);
}

function helpers(scope: () => ParentNode[]) {
  const toggle = (name: string) => findTarget(scope(), { role: "button", name });
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const pressed = () =>
    findAll(scope(), { role: "button" })
      .filter((el) => el.getAttribute("aria-pressed") === "true")
      .map((el) => el.textContent);
  return { toggle, run, pressed };
}

const press = (name: string): Step => ({ press: { role: "button", name } });

describe("Toggle contract", () => {
  it("TO1 a native button per toggle, its pressed state on aria-pressed and data-pressed", async () => {
    const { toggle } = await mount();
    const bold = toggle("Bold");
    expect(bold.tagName).toBe("BUTTON");
    expect(bold.getAttribute("data-slot")).toBe("toggle");
    expect(bold.getAttribute("aria-pressed")).toBe("true");
    expect(bold.hasAttribute("data-pressed")).toBe(true);
    expect(toggle("Italic").getAttribute("aria-pressed")).toBe("false");
    expect(toggle("Italic").hasAttribute("data-pressed")).toBe(false);
  });

  it("TO2 a press presses it, a second press releases it", async () => {
    const { run, pressed } = await mount();
    await run(press("Italic"));
    expect(pressed()).toEqual(["B", "Italic"]);
    await run(press("Italic"));
    expect(pressed()).toEqual(["B"]);
  });

  it("TO3 Space and Enter flip the focused toggle", async () => {
    const { toggle, run, pressed } = await mount();
    await run({ key: "Tab" }, { key: "Tab" });
    expect(focusedElement()).toBe(toggle("Italic"));
    await run({ key: " " });
    expect(pressed()).toEqual(["B", "Italic"]);
    await run({ key: "Enter" });
    expect(pressed()).toEqual(["B"]);
  });

  it("TO4 a disabled toggle says so and ignores a press", async () => {
    const { toggle, run, pressed } = await mount();
    expect(toggle("Underline").hasAttribute("disabled")).toBe(true);
    expect(toggle("Underline").hasAttribute("data-disabled")).toBe(true);
    await run(press("Underline"));
    expect(pressed()).toEqual(["B"]);
  });

  it("TO5 controlled, a press reports the next state and shows only what pressed says", async () => {
    const reports: boolean[] = [];
    const [on, setOn] = createSignal(false);
    render(() => (
      <Toggle pressed={on()} onChange={(next: boolean) => reports.push(next)}>
        Mute
      </Toggle>
    ));
    await settle();
    const { toggle, run } = helpers(scenarioScope);
    await run(press("Mute"));
    expect(reports).toEqual([true]);
    expect(toggle("Mute").getAttribute("aria-pressed")).toBe("false");
    setOn(true);
    await settle();
    expect(toggle("Mute").getAttribute("aria-pressed")).toBe("true");
  });

  it("TO6 function children read the pressed state", async () => {
    render(() => (
      <Toggle aria-label="Mute">
        {(state: { pressed: () => boolean }) => (state.pressed() ? "On" : "Off")}
      </Toggle>
    ));
    await settle();
    const { toggle, run } = helpers(scenarioScope);
    expect(toggle("Mute").textContent).toBe("Off");
    await run(press("Mute"));
    expect(toggle("Mute").textContent).toBe("On");
  });

  it("TO7 a press flips it inside a closed shadow root", async () => {
    const { run, pressed } = await mount("in-shadow-root");
    await run(press("Italic"));
    expect(pressed(), "pressed in the shadow root").toEqual(["B", "Italic"]);
  });
});
