import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { findAll, findTarget, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { Checkbox } from "../../src/solid";
import { expectGap } from "../harness/gap";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

async function mount(id = "default") {
  const { scope } = await mountScenario("Checkbox", id);
  return helpers(scope);
}

function helpers(scope: () => ParentNode[]) {
  const box = (name: string) => findTarget(scope(), { role: "checkbox", name }) as HTMLInputElement;
  const root = (name: string) => box(name).closest("[data-slot=checkbox]");
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const checked = () =>
    findAll(scope(), { role: "checkbox" })
      .filter((el) => (el as HTMLInputElement).checked)
      .map((el) => el.closest("[data-slot=checkbox]")?.textContent);
  return { box, root, run, checked };
}

const label = (name: string): Step => ({ press: { role: "checkbox", name } });

describe("Checkbox contract", () => {
  it("CB1 a checkbox per box named by its label, the checked root marked", async () => {
    const { box, root, checked } = await mount();
    expect(findAll(scenarioScope(), { role: "checkbox" })).toHaveLength(3);
    expect(box("Turn on at sunset").checked).toBe(true);
    expect(root("Turn on at sunset")?.hasAttribute("data-checked")).toBe(true);
    expect(root("Notify me")?.hasAttribute("data-checked")).toBe(false);
    expect(checked()).toEqual(["Turn on at sunset"]);
  });

  it("CB2 a press checks it, a second press clears it, focus on the box", async () => {
    const { box, run, checked } = await mount();
    await run(label("Notify me"));
    expect(checked()).toEqual(["Turn on at sunset", "Notify me"]);
    expect(focusedElement()).toBe(box("Notify me"));
    await run(label("Notify me"));
    expect(checked()).toEqual(["Turn on at sunset"]);
  });

  it("CB3 Space flips the focused box", async () => {
    const { box, run, checked } = await mount();
    await run({ key: "Tab" }, { key: "Tab" });
    expect(focusedElement()).toBe(box("Notify me"));
    await run({ key: " " });
    expect(checked()).toEqual(["Turn on at sunset", "Notify me"]);
    await run({ key: " " });
    expect(checked()).toEqual(["Turn on at sunset"]);
  });

  it("CB4 a disabled box says so and ignores a press", async () => {
    const { box, root, run, checked } = await mount();
    expect(box("Lock when away").disabled).toBe(true);
    expect(root("Lock when away")?.hasAttribute("data-disabled")).toBe(true);
    await run(label("Lock when away"));
    expect(checked()).toEqual(["Turn on at sunset"]);
  });

  it("CB5 an indeterminate box reads as mixed, its root marked", async () => {
    const { box, root } = await mount("indeterminate");
    expect(box("All lights").indeterminate).toBe(true);
    expect(root("All lights")?.hasAttribute("data-indeterminate")).toBe(true);
    expect(root("Kitchen")?.hasAttribute("data-indeterminate")).toBe(false);
  });

  it("CB6 in a form it submits its name as on, and a reset puts back defaultChecked", async () => {
    let form: HTMLFormElement | undefined;
    render(() => (
      <form ref={form}>
        <Checkbox name="sunset" defaultChecked>
          Sunset
        </Checkbox>
        <Checkbox name="notify">Notify</Checkbox>
      </form>
    ));
    await settle();
    const { run } = helpers(scenarioScope);
    if (!form) throw new Error("no form");
    expect([...new FormData(form).entries()]).toEqual([["sunset", "on"]]);
    await run(label("Notify"), label("Sunset"));
    expect([...new FormData(form).entries()]).toEqual([["notify", "on"]]);
    const reset = form;
    await expectGap(async () => {
      reset.reset();
      await settle();
      expect([...new FormData(reset).entries()], "after a reset").toEqual([["sunset", "on"]]);
    }, "after a reset: expected [] to deeply equal [ [ 'sunset', 'on' ] ]");
  });

  it("CB7 controlled, a press reports the next state and shows only what checked says", async () => {
    const reports: boolean[] = [];
    const [on, setOn] = createSignal(false);
    render(() => (
      <Checkbox checked={on()} onChange={(next: boolean) => reports.push(next)}>
        Away
      </Checkbox>
    ));
    await settle();
    const { box, run } = helpers(scenarioScope);
    await run(label("Away"));
    expect(reports).toEqual([true]);
    expect(box("Away").checked).toBe(false);
    setOn(true);
    await settle();
    expect(box("Away").checked).toBe(true);
  });

  it("CB8 a press checks it inside a closed shadow root", async () => {
    const { run, checked } = await mount("in-shadow-root");
    await run(label("Notify me"));
    expect(checked()).toEqual(["Turn on at sunset", "Notify me"]);
  });
});
