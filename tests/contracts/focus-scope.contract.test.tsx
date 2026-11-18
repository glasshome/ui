import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, type JSX, Show } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { findTarget, runSteps } from "../../dev/harness/steps";
import {
  createFocusScope,
  type FocusScope,
  focusWithoutTracking,
  type InitialFocus,
} from "../../src/lib/behavior/focus-scope";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const open = { role: "button", name: "Open" };
const close = { role: "button", name: "Close" };
const tab = { key: "Tab" };
const shiftTab = () => userEvent.keyboard("{Shift>}{Tab}{/Shift}");

function deepActive(): Element | null {
  let active = focusedElement();
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}
const label = () => deepActive()?.textContent?.trim();

function setup(options: { children: JSX.Element; initialFocus?: InitialFocus; trapped?: boolean }) {
  const [active, setActive] = createSignal(false);
  const [container, setContainer] = createSignal<HTMLElement>();
  const holder: { scope?: FocusScope } = {};
  const view = render(() => {
    holder.scope = createFocusScope({
      container,
      active,
      trapped: () => options.trapped ?? true,
      initialFocus: options.initialFocus,
    });
    return (
      <>
        <button type="button">Trigger</button>
        <div ref={setContainer} tabindex="-1" role="dialog" aria-label="Box">
          {options.children}
        </div>
        <button type="button">Outside</button>
      </>
    );
  });
  const trigger = view.getByRole("button", { name: "Trigger" });
  const box = view.getByRole("dialog");
  return { active, setActive, holder, trigger, box, view };
}

describe("focus-scope contract", () => {
  it("FO1 activating focuses the container, the first candidate that takes focus, or the chosen one", async () => {
    const first = setup({
      initialFocus: "first",
      children: (
        <>
          <button type="button" hidden>
            Skipped
          </button>
          <button type="button">One</button>
          <button type="button">Two</button>
        </>
      ),
    });
    first.setActive(true);
    await settle();
    expect(label()).toBe("One");
    cleanup();

    const container = setup({
      initialFocus: "container",
      children: <button type="button">One</button>,
    });
    container.setActive(true);
    await settle();
    expect(deepActive()).toBe(container.box);
    cleanup();

    const chosen = setup({
      initialFocus: (box) => box.querySelector<HTMLElement>("[data-pick]"),
      children: (
        <>
          <button type="button">One</button>
          <button type="button" data-pick>
            Two
          </button>
        </>
      ),
    });
    chosen.setActive(true);
    await settle();
    expect(label()).toBe("Two");
  });

  it("FO2 Tab wraps from the last candidate to the first and Shift+Tab from the first to the last", async () => {
    const { scope } = await mountScenario("focus-scope", "trap");
    await runSteps(scope, [{ press: open }], input, settle);
    expect(label()).toBe("First");
    await runSteps(scope, [tab], input, settle);
    expect(label()).toBe("Middle");
    await runSteps(scope, [tab, tab], input, settle);
    expect(label()).toBe("Close");
    await runSteps(scope, [tab], input, settle);
    expect(label()).toBe("First");
    await shiftTab();
    await settle();
    expect(label()).toBe("Close");
    await shiftTab();
    await settle();
    expect(label()).toBe("Last");
  });

  it("FO3 Tab skips a candidate that does not render", async () => {
    const { setActive } = setup({
      initialFocus: "first",
      children: (
        <>
          <button type="button" hidden>
            Hidden first
          </button>
          <button type="button">One</button>
          <button type="button">Two</button>
          <button type="button" hidden>
            Hidden last
          </button>
        </>
      ),
    });
    setActive(true);
    await settle();
    expect(label()).toBe("One");
    await shiftTab();
    await settle();
    expect(label()).toBe("Two");
    await userEvent.keyboard("{Tab}");
    await settle();
    expect(label()).toBe("One");
  });

  it("FO4 deactivating returns focus to the element focused before, and stays in a scope that took over", async () => {
    const { scope } = await mountScenario("focus-scope", "restore");
    await runSteps(scope, [{ press: open }], input, settle);
    expect(deepActive()?.tagName).toBe("INPUT");
    await runSteps(scope, [{ press: close }], input, settle);
    expect(label()).toBe("Open");
    cleanup();

    const [a, setA] = createSignal(false);
    const [b, setB] = createSignal(false);
    const [boxA, setBoxA] = createSignal<HTMLElement>();
    const [boxB, setBoxB] = createSignal<HTMLElement>();
    const view = render(() => {
      createFocusScope({
        container: boxA,
        active: a,
        trapped: () => true,
        initialFocus: "first",
      });
      createFocusScope({
        container: boxB,
        active: b,
        trapped: () => true,
        initialFocus: "first",
      });
      return (
        <>
          <button type="button">Trigger</button>
          <div ref={setBoxA} tabindex="-1">
            <button type="button">In A</button>
          </div>
          <div ref={setBoxB} tabindex="-1">
            <button type="button">In B</button>
          </div>
        </>
      );
    });
    await input.press(view.getByRole("button", { name: "Trigger" }));
    setA(true);
    await settle();
    expect(label()).toBe("In A");
    setA(false);
    setB(true);
    await settle();
    expect(label()).toBe("In B");
    setB(false);
    await settle();
    expect(label()).toBe("Trigger");
  });

  it("FO5 skipRestore leaves focus where it is", async () => {
    const view = setup({
      initialFocus: "first",
      children: <button type="button">One</button>,
    });
    await input.press(view.trigger);
    view.setActive(true);
    await settle();
    expect(label()).toBe("One");
    view.holder.scope?.skipRestore();
    view.setActive(false);
    await settle();
    expect(label()).toBe("One");
  });

  it("FO6 inside a closed shadow root it focuses, wraps and restores", async () => {
    const { scope } = await mountScenario("focus-scope", "nested-shadow");
    await runSteps(scope, [{ press: open }], input, settle);
    expect(label()).toBe("Before");
    await runSteps(scope, [tab, tab, tab, tab], input, settle);
    expect(label()).toBe("Before");
    await runSteps(scope, [{ press: close }], input, settle);
    expect(label()).toBe("Open");
  });

  it("FO7 a focus handler that writes a signal it reads activates the scope once", async () => {
    const [count, setCount] = createSignal(0);
    let activations = 0;
    const view = setup({
      initialFocus: (box) => {
        activations++;
        return box.querySelector<HTMLElement>("button");
      },
      children: (
        <button type="button" onFocus={() => setCount(count() + 1)}>
          One
        </button>
      ),
    });
    view.setActive(true);
    await settle();
    expect(label()).toBe("One");
    expect(activations).toBe(1);
    expect(count()).toBe(1);
  });

  it("FO8 a radio group is one Tab stop", async () => {
    const { scope } = await mountScenario("focus-scope", "radio-group");
    await runSteps(scope, [{ press: open }], input, settle);
    expect(label()).toBe("Before");
    await runSteps(scope, [tab], input, settle);
    expect(deepActive()?.getAttribute("type")).toBe("radio");
    await runSteps(scope, [tab], input, settle);
    expect(label()).toBe("After");
    await runSteps(scope, [tab], input, settle);
    expect(label()).toBe("Close");
  });

  it("FO9 Tab reaches a control in a nested shadow root and moves on", async () => {
    const { scope } = await mountScenario("focus-scope", "nested-shadow");
    await runSteps(scope, [{ press: open }, tab], input, settle);
    expect(label()).toBe("Preview");
    await runSteps(scope, [tab], input, settle);
    expect(label()).toBe("After");
  });

  it("FO10 focus that falls to body when its control is removed returns to the container", async () => {
    const [present, setPresent] = createSignal(true);
    const view = setup({
      initialFocus: "first",
      children: (
        <Show when={present()}>
          <button type="button" onClick={() => setPresent(false)}>
            Delete
          </button>
        </Show>
      ),
    });
    view.setActive(true);
    await settle();
    expect(label()).toBe("Delete");
    await input.press(findTarget([document], { role: "button", name: "Delete" }));
    await settle();
    expect(present()).toBe(false);
    expect(deepActive()).toBe(view.box);
  });

  it("FO11 an active accessor that changes without changing its answer neither refocuses nor restores", async () => {
    const [stage, setStage] = createSignal(0);
    const [box, setBox] = createSignal<HTMLElement>();
    let activations = 0;
    const view = render(() => {
      createFocusScope({
        container: box,
        active: () => stage() > 0,
        trapped: () => true,
        initialFocus: (el) => {
          activations++;
          return el.querySelector<HTMLElement>("button");
        },
      });
      return (
        <>
          <button type="button">Trigger</button>
          <div ref={setBox} tabindex="-1">
            <button type="button">One</button>
          </div>
        </>
      );
    });
    const trigger = view.getByRole("button", { name: "Trigger" });
    await input.press(trigger);
    setStage(1);
    await settle();
    expect(label()).toBe("One");
    let triggerFocuses = 0;
    trigger.addEventListener("focus", () => triggerFocuses++);
    setStage(2);
    setStage(3);
    await settle();
    expect(triggerFocuses).toBe(0);
    expect(activations).toBe(1);
    expect(label()).toBe("One");
  });

  it("FO12 a same-tick handoff to a second scope never focuses the first scope's trigger", async () => {
    const [a, setA] = createSignal(false);
    const [b, setB] = createSignal(false);
    const [boxA, setBoxA] = createSignal<HTMLElement>();
    const [boxB, setBoxB] = createSignal<HTMLElement>();
    const view = render(() => {
      createFocusScope({ container: boxA, active: a, trapped: () => true, initialFocus: "first" });
      createFocusScope({ container: boxB, active: b, trapped: () => true, initialFocus: "first" });
      return (
        <>
          <button type="button">Trigger</button>
          <div ref={setBoxA} tabindex="-1">
            <button type="button">In A</button>
          </div>
          <div ref={setBoxB} tabindex="-1">
            <button type="button">In B</button>
          </div>
        </>
      );
    });
    const trigger = view.getByRole("button", { name: "Trigger" });
    await input.press(trigger);
    setA(true);
    await settle();
    expect(label()).toBe("In A");
    let triggerFocuses = 0;
    trigger.addEventListener("focus", () => triggerFocuses++);
    setA(false);
    setB(true);
    await settle();
    expect(label()).toBe("In B");
    expect(triggerFocuses).toBe(0);
    setB(false);
    await settle();
    expect(label()).toBe("Trigger");
  });

  it("FO13 removing the container that holds focus leaves keys reaching the page", async () => {
    const [present, setPresent] = createSignal(true);
    const [box, setBox] = createSignal<HTMLElement>();
    render(() => {
      createFocusScope({ container: box, active: present, trapped: () => true });
      return (
        <Show when={present()}>
          <div ref={setBox} tabindex="-1">
            <button type="button">Inside</button>
          </div>
        </Show>
      );
    });
    await settle();
    expect(deepActive()).toBe(box());
    setPresent(false);
    await settle();
    const heard: string[] = [];
    const listen = (event: KeyboardEvent) => heard.push(event.key);
    document.addEventListener("keydown", listen, true);
    await input.key("Escape");
    document.removeEventListener("keydown", listen, true);
    expect(heard).toEqual(["Escape"]);
  });

  it("FO14 untrap lets focus leave the container, and deactivating still restores", async () => {
    const view = setup({
      initialFocus: "first",
      children: <button type="button">One</button>,
    });
    await input.press(view.trigger);
    view.setActive(true);
    await settle();
    expect(label()).toBe("One");
    view.holder.scope?.untrap();
    view.view.getByRole("button", { name: "Outside" }).focus();
    await settle();
    expect(label()).toBe("Outside");
    view.setActive(false);
    await settle();
    expect(label()).toBe("Trigger");
  });

  it("FO15 with nothing after the scope, Tab and Shift+Tab wrap inside the page, even when no key reaches the container", async () => {
    const [box, setBox] = createSignal<HTMLElement>();
    const swallow = (event: KeyboardEvent) => event.stopPropagation();
    render(() => {
      createFocusScope({
        container: box,
        active: () => true,
        trapped: () => true,
        initialFocus: "first",
      });
      return (
        <div ref={setBox} tabindex="-1">
          <button type="button" on:keydown={swallow}>
            One
          </button>
          <button type="button" on:keydown={swallow}>
            Two
          </button>
        </div>
      );
    });
    await settle();
    expect(label()).toBe("One");
    await shiftTab();
    await settle();
    expect(label()).toBe("Two");
    await userEvent.keyboard("{Tab}");
    await settle();
    expect(label()).toBe("One");
    await userEvent.keyboard("{Tab}");
    await settle();
    expect(label()).toBe("Two");
    await userEvent.keyboard("{Tab}");
    await settle();
    expect(label()).toBe("One");
    expect(document.hasFocus()).toBe(true);
  });

  it("focusWithoutTracking reports whether the element took focus", () => {
    const view = render(() => (
      <>
        <button type="button">Real</button>
        <button type="button" hidden>
          Hidden
        </button>
      </>
    ));
    expect(focusWithoutTracking(view.getByText("Real"))).toBe(true);
    expect(focusWithoutTracking(view.getByText("Hidden", { ignore: "" }))).toBe(false);
    expect(focusWithoutTracking(null)).toBe(false);
  });
});
