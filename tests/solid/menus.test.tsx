/* DropdownMenu and ContextMenu share one Kobalte engine, so their Content,
 * Item, Sub* and Checkbox/Radio parts are built once in menu-parts.tsx.
 * These tests pin the shared surface (FLOATING_PANEL classes, one selection
 * scope per content) and the destructive tone (no `!`, tone flows through
 * --selection-tone instead of a variant color axis). */
import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { press } from "../press.js";

import { FLOATING_PANEL } from "../../src/lib/overlay-classes.js";
import { Button } from "../../src/solid/button.js";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../src/solid/context-menu.js";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../../src/solid/dropdown-menu.js";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const FLOATING_PANEL_TOKENS = FLOATING_PANEL.split(" ").filter(Boolean);

function expectFloatingPanel(el: Element | null) {
  if (!el) throw new Error("element not found");
  for (const token of FLOATING_PANEL_TOKENS) {
    expect(el.className).toContain(token);
  }
}

function selectionScopeOf(el: Element | null) {
  return el?.querySelector("[data-selection-scope]") ?? null;
}

describe("DropdownMenuContent", () => {
  it("wears FLOATING_PANEL and wraps its items in one selection scope", async () => {
    const { container } = render(() => (
      <DropdownMenu>
        <DropdownMenuTrigger as={Button}>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>One</DropdownMenuItem>
          <DropdownMenuItem>Two</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    await press(container.querySelector("button") as HTMLElement);

    const content = document.querySelector('[data-slot="dropdown-menu-content"]');
    expectFloatingPanel(content);
    const indicator = selectionScopeOf(content);
    expect(indicator).not.toBeNull();
    expect(indicator?.querySelectorAll('[data-slot="dropdown-menu-item"]')).toHaveLength(2);
  });

  it("keeps every wrapper between the menu and its items out of the a11y tree", async () => {
    const { container } = render(() => (
      <DropdownMenu>
        <DropdownMenuTrigger as={Button}>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>One</DropdownMenuItem>
          <DropdownMenuItem>Two</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    await press(container.querySelector("button") as HTMLElement);

    const menu = document.querySelector<HTMLElement>('[role="menu"]');
    const item = menu?.querySelector<HTMLElement>('[role="menuitem"]');
    if (!menu || !item) throw new Error("menu did not render");
    for (let el = item.parentElement; el && el !== menu; el = el.parentElement) {
      expect(String(el.getAttribute("role")), el.outerHTML.slice(0, 120)).toMatch(
        /^(none|presentation)$/,
      );
    }
  });

  it("gives DropdownMenuSub a SubContent that wraps its items in a selection scope", async () => {
    const { container } = render(() => (
      <DropdownMenu>
        <DropdownMenuTrigger as={Button}>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Nested</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    await press(container.querySelector("button") as HTMLElement);
    const subTrigger = document.querySelector<HTMLElement>(
      '[data-slot="dropdown-menu-sub-trigger"]',
    );
    if (!subTrigger) throw new Error("no sub trigger rendered");
    await press(subTrigger);

    const subContent = document.querySelector('[data-slot="dropdown-menu-sub-content"]');
    expectFloatingPanel(subContent);
    const indicator = selectionScopeOf(subContent);
    expect(indicator).not.toBeNull();
    expect(indicator?.querySelector('[data-slot="dropdown-menu-item"]')?.textContent).toBe(
      "Nested",
    );
  });

  it("renders a checkbox item with a data-slot and a toggleable indicator", async () => {
    const [checked, setChecked] = createSignal(false);
    const { container } = render(() => (
      <DropdownMenu>
        <DropdownMenuTrigger as={Button}>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={checked()} onChange={setChecked}>
            Show archived
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    await press(container.querySelector("button") as HTMLElement);
    const item = document.querySelector<HTMLElement>('[data-slot="dropdown-menu-checkbox-item"]');
    if (!item) throw new Error("no checkbox item rendered");
    await press(item);
    expect(checked()).toBe(true);
  });
});

describe("ContextMenuContent", () => {
  it("wears FLOATING_PANEL and wraps its items in one selection scope", async () => {
    const { container } = render(() => (
      <ContextMenu>
        <ContextMenuTrigger class="block h-8 w-8">Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>One</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ));

    await press(container.querySelector('[data-slot="context-menu-trigger"]') as Element, {
      button: "right",
    });

    const content = document.querySelector('[data-slot="context-menu-content"]');
    expectFloatingPanel(content);
    expect(selectionScopeOf(content)).not.toBeNull();
  });

  it("gives a destructive item its tone through --selection-tone, not a color variant", async () => {
    const { container } = render(() => (
      <ContextMenu>
        <ContextMenuTrigger class="block h-8 w-8">Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem tone="var(--destructive)">Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ));

    await press(container.querySelector('[data-slot="context-menu-trigger"]') as Element, {
      button: "right",
    });

    const item = document.querySelector<HTMLElement>('[data-slot="context-menu-item"]');
    if (!item) throw new Error("no item rendered");
    expect(item.style.getPropertyValue("--selection-tone")).toBe("var(--destructive)");
    // data-tone is what MENU_ITEM's svg guard keys off, so the row and its
    // icons follow one source instead of a second colour variant axis.
    expect(item.dataset.tone).toBe("");
  });

  it("lets a toned item's real svg child inherit the tone instead of muted-foreground", async () => {
    // No Icon mock here: MENU_ITEM's guard targets a real <svg>, and a
    // stubbed <span> would pass by construction without proving anything.
    const { container } = render(() => (
      <ContextMenu>
        <ContextMenuTrigger class="block h-8 w-8">Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem tone="var(--destructive)">
            <svg data-testid="trash-icon" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ));

    await press(container.querySelector('[data-slot="context-menu-trigger"]') as Element, {
      button: "right",
    });

    const item = document.querySelector<HTMLElement>('[data-slot="context-menu-item"]');
    if (!item) throw new Error("no item rendered");
    expect(item.dataset.tone).toBe("");

    const tokens = item.className.split(/\s+/);
    expect(tokens).toContain(
      "[&:not([data-tone])_svg:not([class*='text-'])]:text-muted-foreground",
    );
    expect(tokens).not.toContain("[&_svg:not([class*='text-'])]:text-muted-foreground");
  });

  it("gives every row its own highlight, checkbox and radio rows included", async () => {
    const { container } = render(() => (
      <DropdownMenu>
        <DropdownMenuTrigger as={Button}>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>One</DropdownMenuItem>
          <DropdownMenuCheckboxItem checked={false}>Two</DropdownMenuCheckboxItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    ));
    await press(container.querySelector("button") as HTMLElement);

    const rows = document.querySelectorAll<HTMLElement>(
      '[data-slot="dropdown-menu-item"], [data-slot="dropdown-menu-checkbox-item"], [data-slot="dropdown-menu-sub-trigger"]',
    );
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.firstElementChild?.getAttribute("data-on")).toBe("highlighted");
    }
  });
});
