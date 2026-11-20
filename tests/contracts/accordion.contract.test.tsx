import "../real-time-animations";
import { cleanup, render } from "@solidjs/testing-library";
import { computeAccessibleName } from "dom-accessibility-api";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { findAll, findTarget, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

function helpers(scope: () => ParentNode[]) {
  const trigger = (name: string) => findTarget(scope(), { role: "button", name });
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const expanded = () =>
    findAll(scope(), { role: "button" })
      .filter((el) => el.getAttribute("aria-expanded") === "true")
      .map((el) => el.textContent);
  const regions = () => findAll(scope(), { role: "region" });
  const item = (name: string) => trigger(name).closest('[data-slot="accordion-item"]');
  const focused = () => {
    const el = focusedElement();
    return el ? computeAccessibleName(el) : null;
  };
  return { trigger, run, expanded, regions, item, focused };
}

async function mount(id = "default") {
  const { scope } = await mountScenario("Accordion", id);
  return helpers(scope);
}

const press = (name: string): Step => ({ press: { role: "button", name } });

describe("Accordion contract", () => {
  it("AC1 an item per trigger, a native button in an h3, the open one naming its region", async () => {
    const { trigger, regions, item } = await mount();
    expect(findAll(scenarioScope(), { role: "button" })).toHaveLength(3);
    const wifi = trigger("Wi-Fi");
    expect(wifi.tagName).toBe("BUTTON");
    expect(wifi.getAttribute("data-slot")).toBe("accordion-trigger");
    expect(wifi.parentElement?.tagName).toBe("H3");
    expect(item("Wi-Fi")).not.toBeNull();
    expect(wifi.getAttribute("aria-expanded")).toBe("true");
    expect(trigger("Hub").getAttribute("aria-expanded")).toBe("false");
    const [region, ...others] = regions();
    expect(others).toEqual([]);
    expect(region?.getAttribute("data-slot")).toBe("accordion-content");
    expect(wifi.getAttribute("aria-controls")).toBe(region?.id);
    expect(region?.getAttribute("aria-labelledby")).toBe(wifi.id);
    expect(computeAccessibleName(region as Element)).toBe("Wi-Fi");
  });

  it("AC2 single: opening one closes the open one", async () => {
    const { run, expanded, regions } = await mount();
    await run(press("Hub"));
    expect(expanded()).toEqual(["Hub"]);
    expect(regions().map((r) => r.textContent)).toEqual([
      "Hold the button for ten seconds to restart it.",
    ]);
  });

  it("AC3 the open trigger closes with collapsible and stays open without", async () => {
    const collapsible = await mount();
    await collapsible.run(press("Wi-Fi"));
    expect(collapsible.expanded()).toEqual([]);
    cleanup();
    const fixed = await mount("not-collapsible");
    await fixed.run(press("Wi-Fi"));
    expect(fixed.expanded()).toEqual(["Wi-Fi"]);
  });

  it("AC4 multiple: items open beside each other and close alone", async () => {
    const { run, expanded } = await mount("multiple");
    expect(expanded()).toEqual(["Wi-Fi", "Power"]);
    await run(press("Hub"));
    expect(expanded()).toEqual(["Wi-Fi", "Hub", "Power"]);
    await run(press("Wi-Fi"));
    expect(expanded()).toEqual(["Hub", "Power"]);
  });

  it("AC14 multiple: opening one item runs no motion on the items already open", async () => {
    const { trigger, regions } = await mount("multiple");
    await input.press(trigger("Hub"));
    expect(regions()).toHaveLength(3);
    const settled = regions().filter((r) => !r.textContent?.startsWith("Hold"));
    expect(settled).toHaveLength(2);
    for (const region of settled)
      expect(region.getAnimations(), region.textContent ?? "").toEqual([]);
  });

  it("AC5 ArrowDown and ArrowUp move focus between enabled triggers and wrap", async () => {
    const { run, expanded, focused } = await mount("disabled-item");
    await run(press("Hub"));
    await run({ key: "ArrowDown" });
    expect(focused()).toBe("Wi-Fi");
    await run({ key: "ArrowDown" });
    expect(focused()).toBe("Hub");
    await run({ key: "ArrowUp" });
    expect(focused()).toBe("Wi-Fi");
    await run({ key: "ArrowUp" });
    expect(focused()).toBe("Hub");
    expect(expanded()).toEqual(["Hub"]);
  });

  it("AC6 Home and End reach the first and last enabled trigger", async () => {
    const { run, focused } = await mount("keyboard-nav");
    await run(press("Hub"));
    await run({ key: "End" });
    expect(focused()).toBe("Power");
    await run({ key: "Home" });
    expect(focused()).toBe("Wi-Fi");
  });

  it("AC7 every enabled trigger is a Tab stop, in item order", async () => {
    const { run, focused } = await mount("disabled-item");
    await run({ key: "Tab" });
    expect(focused()).toBe("Wi-Fi");
    await run({ key: "Tab" });
    expect(focused()).toBe("Hub");
    await run({ key: "Shift>}{Tab}{/Shift" });
    expect(focused()).toBe("Wi-Fi");
  });

  it("AC8 Enter and Space toggle the focused item", async () => {
    const { run, expanded } = await mount("keyboard-nav");
    await run({ key: "Tab" }, { key: "Tab" });
    await run({ key: "Enter" });
    expect(expanded()).toEqual(["Hub"]);
    await run({ key: " " });
    expect(expanded()).toEqual([]);
  });

  it("AC9 a disabled item says so and ignores a press", async () => {
    const { trigger, run, expanded, item } = await mount("disabled-item");
    const power = trigger("Power");
    expect(power.hasAttribute("disabled")).toBe(true);
    for (const el of [item("Power"), power.parentElement, power])
      expect(el?.hasAttribute("data-disabled"), el?.tagName).toBe(true);
    await run(press("Power"));
    expect(expanded()).toEqual([]);
  });

  it("AC10 controlled, a press reports the next value and the items follow only value", async () => {
    const reports: string[][] = [];
    const [value, setValue] = createSignal<string[]>(["a"]);
    render(() => (
      <Accordion value={value()} onChange={(next: string[]) => reports.push(next)}>
        <AccordionItem value="a">
          <AccordionTrigger>Alpha</AccordionTrigger>
          <AccordionContent>First</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Beta</AccordionTrigger>
          <AccordionContent>Second</AccordionContent>
        </AccordionItem>
      </Accordion>
    ));
    await settle();
    const { run, expanded } = helpers(scenarioScope);
    await run(press("Beta"));
    expect(reports).toEqual([["b"]]);
    expect(expanded()).toEqual(["Alpha"]);
    setValue(["b"]);
    await settle();
    expect(expanded()).toEqual(["Beta"]);
  });

  it("AC11 open and closed items carry their markers on every part", async () => {
    const { trigger, regions, item } = await mount();
    const wifi = trigger("Wi-Fi");
    for (const el of [item("Wi-Fi"), wifi.parentElement, wifi, regions()[0]])
      expect(el?.hasAttribute("data-expanded"), el?.tagName).toBe(true);
    const hub = trigger("Hub");
    for (const el of [item("Hub"), hub.parentElement, hub])
      expect(el?.hasAttribute("data-closed"), el?.tagName).toBe(true);
  });

  it("AC12 Escape closes every item when an empty accordion is allowed", async () => {
    const collapsible = await mount("multiple");
    await collapsible.run(press("Hub"), { key: "Escape" });
    expect(collapsible.expanded()).toEqual([]);
    cleanup();
    const fixed = await mount("not-collapsible");
    await fixed.run(press("Hub"), { key: "Escape" });
    expect(fixed.expanded()).toEqual(["Hub"]);
  });

  it("AC13 a press opens an item inside a closed shadow root", async () => {
    const { run, expanded } = await mount("in-shadow-root");
    await run(press("Hub"));
    expect(expanded()).toEqual(["Hub"]);
  });
});
