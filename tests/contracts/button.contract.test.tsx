import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { findAll, findTarget, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

async function mount(id = "default") {
  const { scope } = await mountScenario("Button", id);
  const button = (name: string) => findTarget(scope(), { role: "button", name });
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const said = () => findAll(scope(), { role: "status" }).map((el) => el.textContent);
  return { scope, button, run, said };
}

const press = (name: string): Step => ({ press: { role: "button", name } });

describe("Button contract", () => {
  it("B1 a native button named by its text, typed button", async () => {
    const { button } = await mount();
    const save = button("Save");
    expect(save.tagName).toBe("BUTTON");
    expect(save.getAttribute("type")).toBe("button");
    expect(save.getAttribute("data-slot")).toBe("button");
  });

  it("B2 each press runs onClick once", async () => {
    const { run, said } = await mount();
    await run(press("Save"));
    expect(said()).toEqual(["Saved once"]);
    await run(press("Save"));
    expect(said()).toEqual(["Saved 2 times"]);
  });

  it("B3 Enter and Space on the focused button run onClick once each", async () => {
    const { button, run, said } = await mount();
    await run({ key: "Tab" });
    expect(focusedElement()).toBe(button("Save"));
    await run({ key: "Enter" });
    expect(said()).toEqual(["Saved once"]);
    await run({ key: " " });
    expect(said()).toEqual(["Saved 2 times"]);
  });

  it("B4 as a link with an href it is a link, untyped", async () => {
    const { scope } = await mount("as-link");
    const link = findTarget(scope(), { role: "link", name: "Read the guide" });
    expect(link.tagName).toBe("A");
    expect(link.hasAttribute("type")).toBe(false);
    expect(link.hasAttribute("role")).toBe(false);
    expect(findAll(scope(), { role: "button" })).toHaveLength(0);
  });

  it("B5 as another element it is a focusable button that a press, Enter and Space run", async () => {
    const { button, run, said } = await mount("as-element");
    const door = button("Open the door");
    expect(door.tagName).toBe("SPAN");
    expect(door.getAttribute("tabindex")).toBe("0");
    await run(press("Open the door"));
    expect(said()).toEqual(["Opened once"]);
    expect(focusedElement()).toBe(door);
    await run({ key: "Enter" });
    expect(said(), "Enter runs it").toEqual(["Opened 2 times"]);
    await run({ key: " " });
    expect(said(), "Space runs it").toEqual(["Opened 3 times"]);
  });

  it("B6 a disabled native button says so and runs nothing", async () => {
    const { button, run, said } = await mount("disabled");
    const del = button("Delete");
    expect(del.hasAttribute("disabled")).toBe(true);
    expect(del.hasAttribute("data-disabled")).toBe(true);
    await run(press("Delete"));
    expect(said()).toEqual(["Nothing happened"]);
  });

  it("B7 a disabled element says so, Tab passes it, and a press runs nothing", async () => {
    const { button, run, said } = await mount("disabled");
    const archive = button("Archive");
    expect(archive.getAttribute("aria-disabled")).toBe("true");
    expect(archive.hasAttribute("data-disabled")).toBe(true);
    await run({ key: "Tab" });
    expect(focusedElement()).not.toBe(archive);
    await run(press("Archive"));
    expect(said(), "a press on the disabled element").toEqual(["Nothing happened"]);
  });

  it("B8 busy keeps focus and runs nothing", async () => {
    const { button, run, said } = await mount("busy");
    const upload = button("Upload");
    expect(upload.getAttribute("aria-busy")).toBe("true");
    expect(upload.getAttribute("aria-disabled")).toBe("true");
    await run({ key: "Tab" });
    expect(focusedElement()).toBe(upload);
    await run(press("Upload"), { key: "Enter" });
    expect(said()).toEqual(["Uploading"]);
    expect(focusedElement()).toBe(upload);
  });

  it("B9 a press runs onClick inside a closed shadow root", async () => {
    const { run, said } = await mount("in-shadow-root");
    await run(press("Save"));
    expect(said(), "saved in the shadow root").toEqual(["Saved once"]);
  });
});
