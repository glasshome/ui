import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findAll, findTarget } from "../../dev/harness/steps";
import type { Target } from "../../dev/harness/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(() => cleanup());

type Scope = () => ParentNode[];

const TRIGGER: Target = { role: "button", name: "Actions" };
const menus = (scope: Scope) => findAll(scope(), { role: "menu" });
const item = (scope: Scope, name: string, role = "menuitem") =>
  findTarget(scope(), { role, name }) as HTMLElement;
const chosen = (scope: Scope) =>
  findTarget(scope(), { role: "status", name: "Chosen" }).textContent;

async function step(run: Promise<void>) {
  await run;
  await settle();
}

async function mount(id = "closed") {
  const { scope } = await mountScenario("DropdownMenu", id);
  return { scope, trigger: findTarget(scope(), TRIGGER) as HTMLElement };
}

async function opened(id = "closed") {
  const mounted = await mount(id);
  await step(input.press(mounted.trigger));
  return mounted;
}

describe("DropdownMenu contract", () => {
  it("DM1 mounted, the trigger is a closed menu button and no menu exists", async () => {
    const { scope, trigger } = await mount();
    expect(trigger.getAttribute("aria-haspopup")).toBe("true");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(menus(scope)).toHaveLength(0);
  });

  it("DM2 a press opens one menu named by the trigger, which it controls", async () => {
    const { scope, trigger } = await opened();
    const [menu] = menus(scope);
    expect(menus(scope)).toHaveLength(1);
    expect(menu?.getAttribute("aria-labelledby")).toBe(trigger.id);
    expect(findTarget(scope(), { role: "menu", name: "Actions" })).toBe(menu);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(menu?.id);
  });

  it("DM3 the open panel starts at the trigger's top edge and stays in the viewport", async () => {
    const { scope, trigger } = await opened();
    const box = findTarget(scope(), { role: "menu", name: "Actions" }).getBoundingClientRect();
    expect(Math.abs(box.top - trigger.getBoundingClientRect().top)).toBeLessThanOrEqual(1);
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    expect(box.right).toBeLessThanOrEqual(window.innerWidth);
  });

  it("DM4 Enter opens on the first item, Enter chooses it, and focus returns to the trigger", async () => {
    const { scope, trigger } = await mount();
    await step(input.key("Tab"));
    expect(focusedElement()).toBe(trigger);
    await step(input.key("Enter"));
    expect(focusedElement()).toBe(item(scope, "Copy"));
    await step(input.key("Enter"));
    expect(chosen(scope)).toBe("Copy");
    expect(menus(scope)).toHaveLength(0);
    expect(focusedElement()).toBe(trigger);
  });

  it("DM5 a pressed item runs onSelect once and closes the menu", async () => {
    const onSelect = vi.fn();
    render(() => (
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>One</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));
    const scope = () => [document];
    await step(input.press(findTarget(scope(), { role: "button", name: "Open" })));
    await step(input.press(item(scope, "One")));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(menus(scope)).toHaveLength(0);
  });

  it("DM6 the checkbox and the radio report through onChange and the menu stays open", async () => {
    const onCheck = vi.fn();
    const onPick = vi.fn();
    render(() => {
      const [checked, setChecked] = createSignal(false);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={checked()}
              onChange={(next: boolean) => {
                onCheck(next);
                setChecked(next);
              }}
            >
              Grid
            </DropdownMenuCheckboxItem>
            <DropdownMenuRadioGroup value="small" onChange={onPick}>
              <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    });
    const scope = () => [document];
    await step(input.press(findTarget(scope(), { role: "button", name: "Open" })));
    const grid = item(scope, "Grid", "menuitemcheckbox");
    await step(input.press(grid));
    expect(onCheck).toHaveBeenCalledWith(true);
    expect(grid.getAttribute("aria-checked")).toBe("true");
    expect(item(scope, "Small", "menuitemradio").getAttribute("aria-checked")).toBe("true");
    await step(input.press(item(scope, "Large", "menuitemradio")));
    expect(onPick).toHaveBeenCalledWith("large");
    expect(menus(scope)).toHaveLength(1);
  });

  it("DM7 More opens a second menu named More; Rename closes both", async () => {
    const { scope } = await opened();
    const more = item(scope, "More");
    await step(input.press(more));
    expect(menus(scope)).toHaveLength(2);
    expect(findAll(scope(), { role: "menu", name: "More" })).toHaveLength(1);
    expect(more.getAttribute("aria-expanded")).toBe("true");
    await step(input.press(item(scope, "Rename")));
    expect(chosen(scope)).toBe("Rename");
    expect(menus(scope)).toHaveLength(0);
  });

  it("DM8 as={Button}, the trigger is the Button's element with the menu-button slot and ARIA", async () => {
    const { scope, trigger } = await mount();
    expect(trigger.localName).toBe("button");
    expect(trigger.getAttribute("data-slot")).toBe("dropdown-menu-trigger");
    expect(trigger.getAttribute("aria-haspopup")).toBe("true");
    await step(input.press(trigger));
    expect(menus(scope)).toHaveLength(1);
    render(() => <Button variant="outline">Plain</Button>);
    const plain = findTarget([document], { role: "button", name: "Plain" });
    expect(trigger.className).toBe(plain.className);
  });

  it("DM9 in a dialog, Escape and a press on the dialog close the menu and leave the dialog open", async () => {
    const { scope } = await opened("in-dialog");
    expect(menus(scope)).toHaveLength(1);
    await step(input.key("Escape"));
    expect(menus(scope)).toHaveLength(0);
    expect(findAll(scope(), { role: "dialog" })).toHaveLength(1);

    await step(input.press(findTarget(scope(), TRIGGER)));
    expect(menus(scope)).toHaveLength(1);
    const title = findTarget(scope(), { role: "heading", name: "Scenario" });
    await step(input.press(title));
    expect(menus(scope)).toHaveLength(0);
    expect(findAll(scope(), { role: "dialog" })).toHaveLength(1);
  });

  it("DM10 inside a closed shadow root the menu opens in the same root and chooses", async () => {
    const { scope, trigger } = await opened("in-shadow-root");
    expect(trigger.getRootNode()).toBeInstanceOf(ShadowRoot);
    const [menu] = menus(scope);
    expect(menu?.getRootNode()).toBe(trigger.getRootNode());
    await step(input.press(item(scope, "Copy")));
    expect(chosen(scope)).toBe("Copy");
    expect(menus(scope)).toHaveLength(0);
  });

  it("DM11 a closed menu leaves no menu behind once its exit motion ends", async () => {
    const { scope, trigger } = await opened();
    await step(input.press(trigger));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(menus(scope)).toHaveLength(0);
    expect(trigger.hasAttribute("aria-controls")).toBe(false);
  });
});
