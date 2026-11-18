import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { findAll, findTarget } from "../../dev/harness/steps";
import type { Target } from "../../dev/harness/types";
import { POINTER_GRACE_MS, SUBMENU_OPEN_DELAY_MS } from "../../src/lib/behavior/menu";
import { useFakeTime } from "../../src/testing";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(() => cleanup());

type Scope = () => ParentNode[];

const BUTTON: Target = { role: "button", name: "Actions" };
const item = (scope: Scope, name: string, role = "menuitem") =>
  findTarget(scope(), { role, name }) as HTMLElement;
const menus = (scope: Scope) => findAll(scope(), { role: "menu" });
const menu = (scope: Scope, name: string) =>
  findTarget(scope(), { role: "menu", name }) as HTMLElement;
const chosen = (scope: Scope) =>
  findTarget(scope(), { role: "status", name: "Chosen" }).textContent;

const centre = (el: Element) => {
  const box = el.getBoundingClientRect();
  return [box.x + box.width / 2, box.y + box.height / 2] as const;
};

async function mount(id = "open") {
  const { scope } = await mountScenario("menu", id);
  return { scope, button: findTarget(scope(), BUTTON) as HTMLElement };
}

async function step(run: Promise<void>) {
  await run;
  await settle();
}

async function openByKey(key = "ArrowDown") {
  const mounted = await mount();
  await step(input.key("Tab"));
  await step(input.key(key));
  return mounted;
}

async function hoverMore() {
  useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
  const mounted = await mount();
  await step(input.press(mounted.button));
  const more = item(mounted.scope, "More");
  await input.hover(more);
  await vi.advanceTimersByTimeAsync(SUBMENU_OPEN_DELAY_MS);
  await settle();
  return { ...mounted, more };
}

describe("menu contract", () => {
  it("ME1 a press opens one menu below the button with focus on its panel; a second press closes it", async () => {
    const { scope, button } = await mount();
    await step(input.press(button));
    expect(menus(scope)).toHaveLength(1);
    const panel = menu(scope, "Actions");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(focusedElement()).toBe(panel);
    expect(panel.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      button.getBoundingClientRect().bottom,
    );
    await step(input.press(button));
    expect(menus(scope)).toHaveLength(0);
  });

  it("ME2 Enter, Space and ArrowDown open on the first item; ArrowUp on the last", async () => {
    const { scope } = await mount();
    await step(input.key("Tab"));
    for (const key of ["Enter", " ", "ArrowDown"]) {
      await step(input.key(key));
      expect(focusedElement(), key).toBe(item(scope, "Copy"));
      await step(input.key("Escape"));
      expect(menus(scope)).toHaveLength(0);
    }
    await step(input.key("ArrowUp"));
    expect(focusedElement()).toBe(item(scope, "Close"));
  });

  it("ME3 arrows rove over enabled items and loop; Home and End reach the ends; one tab stop", async () => {
    const { scope } = await openByKey();
    await step(input.key("ArrowDown"));
    expect(focusedElement()).toBe(item(scope, "Show grid", "menuitemcheckbox"));
    await step(input.key("End"));
    expect(focusedElement()).toBe(item(scope, "Close"));
    await step(input.key("ArrowDown"));
    expect(focusedElement()).toBe(item(scope, "Copy"));
    await step(input.key("ArrowUp"));
    expect(focusedElement()).toBe(item(scope, "Close"));
    await step(input.key("Home"));
    expect(focusedElement()).toBe(item(scope, "Copy"));
    expect(menu(scope, "Actions").querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  it("ME4 a typed letter moves to the next item starting with it; the same letter again cycles", async () => {
    const { scope } = await openByKey();
    await step(input.type("s"));
    expect(focusedElement()).toBe(item(scope, "Show grid", "menuitemcheckbox"));
    await step(input.type("s"));
    expect(focusedElement()).toBe(item(scope, "Small", "menuitemradio"));
  });

  it("ME5 the mouse over an item focuses and highlights it; over a disabled item the panel holds focus", async () => {
    const { scope, button } = await mount();
    await step(input.press(button));
    const copy = item(scope, "Copy");
    await step(input.hover(copy));
    expect(focusedElement()).toBe(copy);
    expect(copy.hasAttribute("data-highlighted")).toBe(true);
    await step(input.hover(item(scope, "Paste")));
    expect(focusedElement()).toBe(menu(scope, "Actions"));
    expect(copy.hasAttribute("data-highlighted")).toBe(false);
  });

  it("ME6 the checkbox flips and a radio checks itself alone, and the menu stays open", async () => {
    const { scope } = await openByKey();
    await step(input.key("ArrowDown"));
    const grid = item(scope, "Show grid", "menuitemcheckbox");
    expect(grid.getAttribute("aria-checked")).toBe("false");
    await step(input.key("Enter"));
    expect(grid.getAttribute("aria-checked")).toBe("true");
    await step(input.key("ArrowDown"));
    await step(input.key("ArrowDown"));
    await step(input.key("Enter"));
    expect(item(scope, "Large", "menuitemradio").getAttribute("aria-checked")).toBe("true");
    expect(item(scope, "Small", "menuitemradio").getAttribute("aria-checked")).toBe("false");
    expect(menus(scope)).toHaveLength(1);
  });

  it("ME7 ArrowRight or Enter opens the submenu on its first item; ArrowLeft closes it onto More", async () => {
    const { scope } = await openByKey("ArrowUp");
    await step(input.key("ArrowUp"));
    const more = item(scope, "More");
    expect(focusedElement()).toBe(more);
    await step(input.key("ArrowRight"));
    expect(menus(scope)).toHaveLength(2);
    expect(focusedElement()).toBe(item(scope, "Rename"));
    expect(more.getAttribute("aria-expanded")).toBe("true");
    await step(input.key("ArrowLeft"));
    expect(menus(scope)).toHaveLength(1);
    expect(focusedElement()).toBe(more);
    await step(input.key("Enter"));
    expect(focusedElement()).toBe(item(scope, "Rename"));
  });

  it("ME8 Escape closes one level at a time and the last returns focus to the button", async () => {
    const { scope, button } = await openByKey("ArrowUp");
    await step(input.key("ArrowUp"));
    await step(input.key("ArrowRight"));
    expect(menus(scope)).toHaveLength(2);
    await step(input.key("Escape"));
    expect(menus(scope)).toHaveLength(1);
    expect(focusedElement()).toBe(item(scope, "More"));
    await step(input.key("Escape"));
    expect(menus(scope)).toHaveLength(0);
    expect(focusedElement()).toBe(button);
  });

  it("ME9 the mouse resting on More opens the submenu after the delay and leaves focus on More", async () => {
    const { scope, more } = await hoverMore();
    expect(menus(scope)).toHaveLength(2);
    expect(focusedElement()).toBe(more);
  });

  it("ME10 the pointer crossing Close toward the open submenu keeps it open, until the grace runs out", async () => {
    const { scope, more } = await hoverMore();
    const close = item(scope, "Close");
    const right = more.getBoundingClientRect().right - 2;
    const [, closeY] = centre(close);
    await commands.mouse("move", right, centre(more)[1]);
    await commands.mouse("move", right, closeY);
    await settle();
    expect(menus(scope)).toHaveLength(2);
    expect(close.hasAttribute("data-highlighted")).toBe(false);
    await vi.advanceTimersByTimeAsync(POINTER_GRACE_MS);
    await commands.mouse("move", right - 1, closeY);
    await settle();
    expect(menus(scope)).toHaveLength(1);
    expect(focusedElement()).toBe(close);
  });

  it("ME11 the submenu sits beside More, top-aligned, and is marked anchored", async () => {
    const { scope, more } = await hoverMore();
    const sub = menu(scope, "More").getBoundingClientRect();
    const row = more.getBoundingClientRect();
    expect(Math.abs(sub.left - row.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(sub.top - row.top)).toBeLessThanOrEqual(1);
    expect(menu(scope, "More").hasAttribute("data-anchored")).toBe(true);
  });

  it("ME12 choosing an item, in the menu or the submenu, runs it once, closes the tree and refocuses the button", async () => {
    const { scope, button } = await mount();
    await step(input.press(button));
    await step(input.press(item(scope, "Copy")));
    expect(chosen(scope)).toBe("Copy");
    expect(menus(scope)).toHaveLength(0);
    expect(focusedElement()).toBe(button);

    await step(input.key("ArrowUp"));
    await step(input.key("ArrowUp"));
    await step(input.key("ArrowRight"));
    await step(input.key("ArrowDown"));
    await step(input.key("Enter"));
    expect(chosen(scope)).toBe("Delete");
    expect(menus(scope)).toHaveLength(0);
    expect(focusedElement()).toBe(button);
  });

  it("ME13 neither the opening press's release nor a press that leaves the panel chooses", async () => {
    const { scope, button } = await mount();
    const [bx, by] = centre(button);
    await commands.mouse("move", bx, by);
    await commands.mouse("down", bx, by);
    await settle();
    const [cx, cy] = centre(item(scope, "Copy"));
    await commands.mouse("move", cx, cy);
    await commands.mouse("up", cx, cy);
    await settle();
    expect(chosen(scope)).toBe("nothing");
    expect(menus(scope)).toHaveLength(1);

    const panel = menu(scope, "Actions").getBoundingClientRect();
    await commands.mouse("move", cx, cy);
    await commands.mouse("down", cx, cy);
    await commands.mouse("move", panel.right + 40, cy);
    await commands.mouse("up", panel.right + 40, cy);
    await settle();
    expect(chosen(scope)).toBe("nothing");
    expect(menus(scope)).toHaveLength(1);
  });

  it("ME14 a press outside the open tree closes every menu and chooses nothing", async () => {
    const { scope, more } = await hoverMore();
    expect(menus(scope)).toHaveLength(2);
    const sub = menu(scope, "More").getBoundingClientRect();
    await input.pressAt(sub.right + 60, sub.bottom + 60);
    await vi.advanceTimersByTimeAsync(0);
    await settle();
    expect(menus(scope)).toHaveLength(0);
    expect(chosen(scope)).toBe("nothing");
    expect(more.isConnected).toBe(false);
  });

  it("ME15 Tab keeps focus in the open menu", async () => {
    const { scope } = await openByKey();
    await step(input.key("Tab"));
    expect(menus(scope)).toHaveLength(1);
    expect(focusedElement()).toBe(item(scope, "Copy"));
  });

  it("ME16 inside a closed shadow root the menu opens in the same root, roves and chooses", async () => {
    const { scope } = await mountScenario("menu", "in-shadow-root");
    const button = findTarget(scope(), BUTTON) as HTMLElement;
    expect(button.getRootNode()).toBeInstanceOf(ShadowRoot);
    await step(input.press(button));
    const panel = menu(scope, "Actions");
    expect(panel.getRootNode()).toBe(button.getRootNode());
    expect(focusedElement()).toBe(panel);
    await step(input.key("ArrowDown"));
    expect(focusedElement()).toBe(item(scope, "Copy"));
    await step(input.key("ArrowDown"));
    expect(focusedElement()).toBe(item(scope, "Show grid", "menuitemcheckbox"));
    await step(input.key("ArrowUp"));
    await step(input.key("Enter"));
    expect(chosen(scope)).toBe("Copy");
    expect(menus(scope)).toHaveLength(0);
    expect(focusedElement()).toBe(button);
  });
});
