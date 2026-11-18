import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { findAll, findTarget, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { FaceToggle, FaceToggleGroup } from "../../src/solid";
import { expectGap } from "../harness/gap";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

async function mount(id = "default") {
  const { scope } = await mountScenario("FaceToggle", id);
  return helpers(scope);
}

function helpers(scope: () => ParentNode[]) {
  const face = (name: string) => findTarget(scope(), { role: "button", name });
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const pressed = () =>
    findAll(scope(), { role: "button" })
      .filter((el) => el.getAttribute("aria-pressed") === "true")
      .map((el) => el.querySelector("[data-slot=face-toggle-name]")?.textContent);
  return { face, run, pressed };
}

const press = (name: string): Step => ({ press: { role: "button", name } });
const MAYA = "Maya always sees it";

function Reporting(props: { reports: string[][] }) {
  const [value, setValue] = createSignal<string[]>([]);
  return (
    <FaceToggleGroup
      aria-label="Who sees it"
      value={value()}
      onChange={(next) => {
        props.reports.push(next);
        setValue(next);
      }}
      lockedIds={["maya"]}
    >
      <FaceToggle id="maya" name="Maya" kind="person" />
      <FaceToggle id="leo" name="Leo" kind="person" />
      <FaceToggle id="tablet" name="Kitchen tablet" kind="screen" />
    </FaceToggleGroup>
  );
}

describe("FaceToggle contract", () => {
  it("FT1 one named group holds a button per face, the locked one pressed and aria-disabled", async () => {
    const { face, pressed } = await mount();
    expect(findAll(scenarioScope(), { role: "group", name: "Who sees it" })).toHaveLength(1);
    expect(findAll(scenarioScope(), { role: "button" })).toHaveLength(3);
    expect(face(MAYA).getAttribute("aria-pressed")).toBe("true");
    expect(face(MAYA).getAttribute("aria-disabled")).toBe("true");
    expect(face("Leo").getAttribute("aria-pressed")).toBe("false");
    expect(pressed()).toEqual(["Maya"]);
  });

  it("FT2 a press turns one face on and reports the chosen faces without the locked one", async () => {
    const reports: string[][] = [];
    render(() => <Reporting reports={reports} />);
    await settle();
    const { run, pressed } = helpers(scenarioScope);
    await run(press("Leo"));
    expect(pressed()).toEqual(["Maya", "Leo"]);
    await run(press("Kitchen tablet"));
    expect(pressed()).toEqual(["Maya", "Leo", "Kitchen tablet"]);
    expect(reports).toEqual([["leo"], ["leo", "tablet"]]);
  });

  it("FT3 a press on the locked face keeps it on and no report names it", async () => {
    const reports: string[][] = [];
    render(() => <Reporting reports={reports} />);
    await settle();
    const { run, pressed } = helpers(scenarioScope);
    await run(press(MAYA));
    expect(pressed()).toEqual(["Maya"]);
    expect(reports.flat()).not.toContain("maya");
  });

  it("FT4 arrows move focus between faces, wrapping, and press nothing", async () => {
    const { face, run, pressed } = await mount();
    await run({ key: "Tab" });
    expect(focusedElement()).toBe(face(MAYA));
    await run({ key: "ArrowRight" });
    expect(focusedElement()).toBe(face("Leo"));
    await run({ key: "ArrowRight" }, { key: "ArrowRight" });
    expect(focusedElement()).toBe(face(MAYA));
    await run({ key: "ArrowLeft" });
    expect(focusedElement()).toBe(face("Kitchen tablet"));
    expect(pressed()).toEqual(["Maya"]);
  });

  it("FT5 Enter and Space flip the focused face", async () => {
    const { run, pressed } = await mount();
    await run({ key: "Tab" }, { key: "ArrowRight" }, { key: " " });
    expect(pressed()).toEqual(["Maya", "Leo"]);
    await run({ key: "ArrowRight" }, { key: "Enter" });
    expect(pressed()).toEqual(["Maya", "Leo", "Kitchen tablet"]);
    await run({ key: "Enter" });
    expect(pressed()).toEqual(["Maya", "Leo"]);
  });

  it("FT6 Tab lands on one face, a second Tab leaves the group", async () => {
    const { run } = await mount();
    const group = findTarget(scenarioScope(), { role: "group", name: "Who sees it" });
    await run({ key: "Tab" });
    expect(group.contains(focusedElement())).toBe(true);
    await run({ key: "Tab" });
    expect(group.contains(focusedElement())).toBe(false);
  });

  it("FT7 a press turns a face on inside a closed shadow root", async () => {
    const { run, pressed } = await mount("in-shadow-root");
    await expectGap(async () => {
      await run(press("Leo"));
      expect(pressed(), "faces on in the shadow root").toEqual(["Maya", "Leo"]);
    }, "faces on in the shadow root: expected [ 'Maya' ] to deeply equal [ 'Maya', 'Leo' ]");
  });
});
