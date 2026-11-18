import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { findAll, findTarget, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { RadioGroup, RadioGroupItem } from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

async function mount(id = "default") {
  const { scope } = await mountScenario("RadioGroup", id);
  return helpers(scope);
}

function helpers(scope: () => ParentNode[]) {
  const radio = (name: string) => findTarget(scope(), { role: "radio", name }) as HTMLInputElement;
  const item = (name: string) => radio(name).closest("[data-slot=radio-group-item]");
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const checked = () =>
    findAll(scope(), { role: "radio" })
      .filter((el) => (el as HTMLInputElement).checked)
      .map((el) => el.closest("[data-slot=radio-group-item]")?.textContent);
  return { radio, item, run, checked };
}

const press = (name: string): Step => ({ press: { role: "radio", name } });

describe("RadioGroup contract", () => {
  it("RG1 one named radiogroup holds a radio per item, the default checked", async () => {
    const { item, checked } = await mount();
    expect(findAll(scenarioScope(), { role: "radiogroup", name: "Density" })).toHaveLength(1);
    expect(findAll(scenarioScope(), { role: "radio" })).toHaveLength(4);
    expect(checked()).toEqual(["Comfortable"]);
    expect(item("Comfortable")?.hasAttribute("data-checked")).toBe(true);
    expect(item("Compact")?.hasAttribute("data-checked")).toBe(false);
  });

  it("RG2 a press checks the item, clears the one before, focuses it and reports once", async () => {
    const reports: string[] = [];
    render(() => (
      <RadioGroup defaultValue="a" aria-label="Pick" onChange={(v: string) => reports.push(v)}>
        <RadioGroupItem value="a">Alpha</RadioGroupItem>
        <RadioGroupItem value="b">Beta</RadioGroupItem>
      </RadioGroup>
    ));
    await settle();
    const { radio, item, run, checked } = helpers(scenarioScope);
    await run(press("Beta"));
    expect(checked()).toEqual(["Beta"]);
    expect(item("Beta")?.hasAttribute("data-checked")).toBe(true);
    expect(item("Alpha")?.hasAttribute("data-checked")).toBe(false);
    expect(focusedElement()).toBe(radio("Beta"));
    expect(reports).toEqual(["b"]);
  });

  it("RG3 arrows focus and check the next or previous enabled radio, wrapping", async () => {
    const { radio, run, checked } = await mount();
    await run(press("Compact"), { key: "ArrowDown" });
    expect(checked()).toEqual(["Dense"]);
    expect(focusedElement()).toBe(radio("Dense"));
    await run({ key: "ArrowDown" });
    expect(checked()).toEqual(["Comfortable"]);
    await run({ key: "ArrowUp" });
    expect(checked()).toEqual(["Dense"]);
    expect(focusedElement()).toBe(radio("Dense"));
  });

  it("RG4 Tab lands on the checked radio, a second Tab leaves the group", async () => {
    const { radio, run } = await mount();
    await run({ key: "Tab" });
    expect(focusedElement()).toBe(radio("Comfortable"));
    await run({ key: "Tab" });
    const group = findTarget(scenarioScope(), { role: "radiogroup", name: "Density" });
    expect(group.contains(focusedElement())).toBe(false);
  });

  it("RG5 a disabled item says so and ignores a press", async () => {
    const { radio, item, run, checked } = await mount();
    expect(radio("Spacious").disabled).toBe(true);
    expect(item("Spacious")?.hasAttribute("data-disabled")).toBe(true);
    await run(press("Spacious"));
    expect(checked()).toEqual(["Comfortable"]);
  });

  it("RG6 in a form every radio shares one name and the checked value submits under it", async () => {
    let form: HTMLFormElement | undefined;
    render(() => (
      <form ref={form}>
        <RadioGroup name="density" defaultValue="a" aria-label="Pick">
          <RadioGroupItem value="a">Alpha</RadioGroupItem>
          <RadioGroupItem value="b">Beta</RadioGroupItem>
        </RadioGroup>
      </form>
    ));
    await settle();
    const { radio, run } = helpers(scenarioScope);
    if (!form) throw new Error("no form");
    expect(radio("Alpha").name).toBe("density");
    expect(radio("Beta").name).toBe("density");
    expect([...new FormData(form).entries()]).toEqual([["density", "a"]]);
    await run(press("Beta"));
    expect([...new FormData(form).entries()]).toEqual([["density", "b"]]);
  });

  it("RG7 a press checks the item inside a closed shadow root", async () => {
    const { run, checked } = await mount("in-shadow-root");
    await run(press("Compact"));
    expect(checked()).toEqual(["Compact"]);
  });
});
