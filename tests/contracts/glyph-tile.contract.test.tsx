import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { findAll, findTarget, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { GlyphTile, GlyphTileGroup } from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

async function mount(id = "default") {
  const { scope } = await mountScenario("GlyphTile", id);
  return helpers(scope);
}

function helpers(scope: () => ParentNode[]) {
  const tile = (name: string) => findTarget(scope(), { role: "button", name });
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const pressed = () =>
    findAll(scope(), { role: "button" })
      .filter((el) => el.getAttribute("aria-pressed") === "true")
      .map((el) => el.textContent);
  return { tile, run, pressed };
}

const press = (name: string): Step => ({ press: { role: "button", name } });

function Reporting(props: { reports: (string | null)[] }) {
  const [value, setValue] = createSignal<string | null>("Kitchen");
  return (
    <GlyphTileGroup
      aria-label="Room"
      value={value()}
      onChange={(next) => {
        props.reports.push(next);
        setValue(next);
      }}
    >
      <GlyphTile value="Garage" icon="lucide:car" label="Garage" />
      <GlyphTile value="Kitchen" icon="lucide:cooking-pot" label="Kitchen" />
    </GlyphTileGroup>
  );
}

describe("GlyphTile contract", () => {
  it("GT1 one named group holds a button per tile, the picked one pressed", async () => {
    const { tile, pressed } = await mount();
    expect(findAll(scenarioScope(), { role: "group", name: "Room" })).toHaveLength(1);
    expect(findAll(scenarioScope(), { role: "button" })).toHaveLength(4);
    expect(tile("Kitchen").getAttribute("data-slot")).toBe("glyph-tile");
    expect(tile("Kitchen").hasAttribute("data-pressed")).toBe(true);
    expect(tile("Garage").getAttribute("aria-pressed")).toBe("false");
    expect(tile("Garage").hasAttribute("data-pressed")).toBe(false);
    expect(pressed()).toEqual(["Kitchen"]);
  });

  it("GT2 a press on an unpicked tile reports it and presses it alone", async () => {
    const reports: (string | null)[] = [];
    render(() => <Reporting reports={reports} />);
    await settle();
    const { run, pressed } = helpers(scenarioScope);
    await run(press("Garage"));
    expect(reports).toEqual(["Garage"]);
    expect(pressed()).toEqual(["Garage"]);
  });

  it("GT3 a press on the picked tile reports null and clears it", async () => {
    const reports: (string | null)[] = [];
    render(() => <Reporting reports={reports} />);
    await settle();
    const { run, pressed } = helpers(scenarioScope);
    await run(press("Kitchen"));
    expect(reports).toEqual([null]);
    expect(pressed()).toEqual([]);
  });

  it("GT4 arrows move focus between tiles, wrapping, and keep the pick", async () => {
    const { tile, run, pressed } = await mount();
    await run({ key: "Tab" });
    expect(focusedElement()).toBe(tile("Kitchen"));
    await run({ key: "ArrowRight" });
    expect(focusedElement()).toBe(tile("Bedroom"));
    await run({ key: "ArrowRight" }, { key: "ArrowRight" });
    expect(focusedElement()).toBe(tile("Garage"));
    await run({ key: "ArrowLeft" });
    expect(focusedElement()).toBe(tile("Office"));
    expect(pressed()).toEqual(["Kitchen"]);
  });

  it("GT5 Home and End reach the first and last tile", async () => {
    const { tile, run } = await mount();
    await run({ key: "Tab" }, { key: "End" });
    expect(focusedElement()).toBe(tile("Office"));
    await run({ key: "Home" });
    expect(focusedElement()).toBe(tile("Garage"));
  });

  it("GT6 Tab lands on the picked tile, a second Tab leaves the group", async () => {
    const { tile, run } = await mount();
    await run({ key: "Tab" });
    expect(focusedElement()).toBe(tile("Kitchen"));
    await run({ key: "Tab" });
    const group = findTarget(scenarioScope(), { role: "group", name: "Room" });
    expect(group.contains(focusedElement())).toBe(false);
  });

  it("GT7 Enter and Space pick the focused tile, or clear it when picked", async () => {
    const { run, pressed } = await mount();
    await run({ key: "Tab" }, { key: "End" }, { key: "Enter" });
    expect(pressed()).toEqual(["Office"]);
    await run({ key: " " });
    expect(pressed()).toEqual([]);
  });

  it("GT8 a press picks a tile inside a closed shadow root", async () => {
    const { run, pressed } = await mount("in-shadow-root");
    await run(press("Office"));
    expect(pressed(), "tiles picked in the shadow root").toEqual(["Office"]);
  });
});
