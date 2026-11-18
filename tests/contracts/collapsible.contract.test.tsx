import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { findTarget, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const NAME = "Advanced settings";
const trigger: Step = { press: { role: "button", name: NAME } };

function helpers(scope: () => ParentNode[]) {
  const button = () => findTarget(scope(), { role: "button", name: NAME });
  const slot = (name: string) =>
    scope()
      .map((s) => s.querySelector(`[data-slot="${name}"]`))
      .find((el) => el !== null) ?? null;
  const content = () => slot("collapsible-content");
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  return { button, slot, content, run };
}

async function mount(id = "closed") {
  const { scope } = await mountScenario("Collapsible", id);
  return helpers(scope);
}

describe("Collapsible contract", () => {
  it("CL1 closed: a native button, not expanded, the content not rendered", async () => {
    const { button, slot, content } = await mount();
    expect(button().tagName).toBe("BUTTON");
    expect(button().getAttribute("data-slot")).toBe("collapsible-trigger");
    expect(button().getAttribute("aria-expanded")).toBe("false");
    expect(button().hasAttribute("aria-controls")).toBe(false);
    expect(slot("collapsible")?.hasAttribute("data-closed")).toBe(true);
    expect(button().hasAttribute("data-closed")).toBe(true);
    expect(content()).toBeNull();
  });

  it("CL2 a press opens it and names the content it controls", async () => {
    const { button, slot, content, run } = await mount();
    await run(trigger);
    expect(button().getAttribute("aria-expanded")).toBe("true");
    const panel = content();
    expect(panel).not.toBeNull();
    expect(button().getAttribute("aria-controls")).toBe(panel?.id);
    for (const el of [slot("collapsible"), button(), panel])
      expect(el?.hasAttribute("data-expanded"), el?.getAttribute("data-slot") ?? "").toBe(true);
  });

  it("CL3 a second press closes it; the content leaves after its exit motion", async () => {
    const { button, content, run } = await mount();
    await run(trigger);
    await input.press(button());
    expect(button().getAttribute("aria-expanded")).toBe("false");
    expect(button().hasAttribute("aria-controls")).toBe(false);
    expect(content()?.hasAttribute("data-closed")).toBe(true);
    await settle();
    expect(content()).toBeNull();
  });

  it("CL4 Enter and Space flip the focused trigger", async () => {
    const { button, run } = await mount();
    await run({ key: "Tab" });
    expect(focusedElement()).toBe(button());
    await run({ key: "Enter" });
    expect(button().getAttribute("aria-expanded")).toBe("true");
    await run({ key: " " });
    expect(button().getAttribute("aria-expanded")).toBe("false");
  });

  it("CL5 a disabled collapsible says so and ignores a press", async () => {
    const { button, slot, content, run } = await mount("disabled");
    expect(button().hasAttribute("disabled")).toBe(true);
    expect(button().hasAttribute("data-disabled")).toBe(true);
    expect(slot("collapsible")?.hasAttribute("data-disabled")).toBe(true);
    await run(trigger);
    expect(button().getAttribute("aria-expanded")).toBe("false");
    expect(content()).toBeNull();
  });

  it("CL6 controlled, a press reports the next state and the content follows only open", async () => {
    const reports: boolean[] = [];
    const [open, setOpen] = createSignal(false);
    render(() => (
      <Collapsible open={open()} onOpenChange={(next: boolean) => reports.push(next)}>
        <CollapsibleTrigger>{NAME}</CollapsibleTrigger>
        <CollapsibleContent>Polling</CollapsibleContent>
      </Collapsible>
    ));
    await settle();
    const { button, content, run } = helpers(scenarioScope);
    await run(trigger);
    expect(reports).toEqual([true]);
    expect(button().getAttribute("aria-expanded")).toBe("false");
    expect(content()).toBeNull();
    setOpen(true);
    await settle();
    expect(button().getAttribute("aria-expanded")).toBe("true");
    expect(content()).not.toBeNull();
  });

  it("CL7 open from the start, the content is there and runs no motion", async () => {
    const { content } = await mount("open");
    const panel = content();
    expect(panel?.hasAttribute("data-expanded")).toBe(true);
    expect(panel?.getAnimations()).toEqual([]);
  });

  it("CL8 the open content carries its own height for the motion", async () => {
    const { content, run } = await mount();
    await run(trigger);
    const panel = content() as HTMLElement;
    const height = panel.getBoundingClientRect().height;
    expect(height).toBeGreaterThan(0);
    for (const name of ["--collapsible-content-height", "--kb-collapsible-content-height"])
      expect(panel.style.getPropertyValue(name), name).toBe(`${height}px`);
  });

  it("CL9 forceMount keeps the closed content rendered", async () => {
    render(() => (
      <Collapsible forceMount>
        <CollapsibleTrigger>{NAME}</CollapsibleTrigger>
        <CollapsibleContent>Polling</CollapsibleContent>
      </Collapsible>
    ));
    await settle();
    const { content } = helpers(scenarioScope);
    expect(content()?.hasAttribute("data-closed")).toBe(true);
  });

  it("CL10 a press opens it inside a closed shadow root", async () => {
    const { button, content, run } = await mount("in-shadow-root");
    await run(trigger);
    expect(button().getAttribute("aria-expanded")).toBe("true");
    expect(content()).not.toBeNull();
  });
});
