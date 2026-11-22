import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { findAll, findTarget } from "../../dev/harness/steps";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, settle } from "../harness/mount";
import { centre, chosen, expectCornerAt, item, menus, mount, step } from "./context-menu-parts";

afterEach(() => cleanup());

/** The last `contextmenu` the window saw, read after its dispatch ends. */
function watchNativeMenu() {
  const seen: { event?: MouseEvent } = {};
  const record = (event: MouseEvent) => {
    seen.event = event;
  };
  window.addEventListener("contextmenu", record, true);
  return {
    prevented: () => seen.event?.defaultPrevented,
    stop: () => window.removeEventListener("contextmenu", record, true),
  };
}

async function secondaryPressAt(x: number, y: number) {
  await commands.mouse("move", x, y);
  await commands.mouse("down", x, y, "right");
  await commands.mouse("up", x, y, "right");
  await settle();
}

describe("ContextMenu contract", () => {
  it("CM1 mounted, no menu exists and the area is marked closed", async () => {
    const { scope, area } = await mount();
    expect(menus(scope)).toHaveLength(0);
    expect(area.hasAttribute("data-closed")).toBe(true);
  });

  it("CM2 a secondary press opens one menu at the pointer instead of the browser's own", async () => {
    const { scope, area } = await mount();
    const native = watchNativeMenu();
    const [x, y] = centre(area);
    await step(input.contextMenu(area));
    native.stop();
    expect(native.prevented()).toBe(true);
    const all = menus(scope);
    expect(all).toHaveLength(1);
    expect(findTarget(scope(), { role: "menu", name: "Canvas" })).toBe(all[0]);
    expectCornerAt(all[0], x, y);
    expect(focusedElement()).toBe(all[0]);
    expect(area.hasAttribute("data-expanded")).toBe(true);
  });

  it("CM5 ArrowDown then Enter chooses Copy and closes the menu", async () => {
    const { scope, area } = await mount();
    await step(input.contextMenu(area));
    await step(input.key("ArrowDown"));
    expect(focusedElement()).toBe(item(scope, "Copy"));
    await step(input.key("Enter"));
    expect(chosen(scope)).toBe("Copy");
    expect(menus(scope)).toHaveLength(0);
  });

  it("CM6 a second secondary press elsewhere on the area moves the menu there", async () => {
    const { scope, area } = await mount();
    await step(input.contextMenu(area));
    const box = area.getBoundingClientRect();
    const [x, y] = [box.left + 16, box.top + 16];
    await secondaryPressAt(x, y);
    const all = menus(scope);
    expect(all).toHaveLength(1);
    expectCornerAt(all[0], x, y);
  });

  it("CM7 a press outside the area and the menu closes it", async () => {
    const { scope, area } = await mount();
    await step(input.contextMenu(area));
    expect(menus(scope)).toHaveLength(1);
    await step(input.pressAt(window.innerWidth - 16, window.innerHeight - 16));
    expect(menus(scope)).toHaveLength(0);
  });

  it("CM8 a disabled area, or a consumer that prevents the event, opens nothing", async () => {
    render(() => (
      <>
        <ContextMenu>
          <ContextMenuTrigger as="section" aria-label="Off" disabled class="h-20 w-40">
            Off
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>One</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <ContextMenu>
          <ContextMenuTrigger
            as="section"
            aria-label="Theirs"
            class="h-20 w-40"
            onContextMenu={(event: MouseEvent) => event.preventDefault()}
          >
            Theirs
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Two</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </>
    ));
    const scope = () => [document];
    const native = watchNativeMenu();
    await step(input.contextMenu(findTarget(scope(), { role: "region", name: "Off" })));
    expect(native.prevented()).toBe(false);
    await step(input.contextMenu(findTarget(scope(), { role: "region", name: "Theirs" })));
    native.stop();
    expect(menus(scope)).toHaveLength(0);
  });

  it("CM9 More opens a second menu named More; Rename closes both", async () => {
    const { scope, area } = await mount();
    await step(input.contextMenu(area));
    await step(input.press(item(scope, "More")));
    expect(menus(scope)).toHaveLength(2);
    expect(findAll(scope(), { role: "menu", name: "More" })).toHaveLength(1);
    await step(input.press(item(scope, "Rename")));
    expect(chosen(scope)).toBe("Rename");
    expect(menus(scope)).toHaveLength(0);
  });

  it("CM10 in a dialog, Escape closes the menu and leaves the dialog open", async () => {
    const { scope, area } = await mount("in-dialog");
    await step(input.contextMenu(area));
    expect(menus(scope)).toHaveLength(1);
    await step(input.key("Escape"));
    expect(menus(scope)).toHaveLength(0);
    expect(findAll(scope(), { role: "dialog" })).toHaveLength(1);
  });

  it("CM11 inside a closed shadow root the menu opens at the pointer in the same root and chooses", async () => {
    const { scope, area } = await mount("in-shadow-root");
    expect(area.getRootNode()).toBeInstanceOf(ShadowRoot);
    const [x, y] = centre(area);
    await step(input.contextMenu(area));
    const [menu] = menus(scope);
    expect(menu?.getRootNode()).toBe(area.getRootNode());
    expectCornerAt(menu, x, y);
    await step(input.press(item(scope, "Copy")));
    expect(chosen(scope)).toBe("Copy");
    expect(menus(scope)).toHaveLength(0);
  });
});
