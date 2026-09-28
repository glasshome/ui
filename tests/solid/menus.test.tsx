/* DropdownMenu and ContextMenu share one Kobalte engine, so their Content,
 * Item, Sub* and Checkbox/Radio parts are built once in menu-parts.tsx.
 * These tests pin the shared surface (FLOATING_PANEL classes, one
 * SlidingIndicator per content) and the destructive tone fix (no `!`, tone
 * flows through --glass-tone instead of a variant color axis). */
import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

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

function slidingIndicatorOf(el: Element | null) {
  return el?.querySelector(".relative.isolate") ?? null;
}

// SlidingIndicator only paints once it can measure real geometry
// (getBoundingClientRect + clientWidth/clientHeight); happy-dom reports all
// zeros by default, so tests that need the indicator itself (not just its
// always-rendered container) fake a non-zero layout for the duration.
async function withMeasurableLayout<T>(fn: () => T | Promise<T>): Promise<T> {
  const rectDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "getBoundingClientRect",
  );
  const widthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
  const heightDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 20,
      width: 100,
      height: 20,
      toJSON() {},
    }) as DOMRect;
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => 100,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => 20,
  });
  try {
    // Awaited here (not just returned): the caller's callback is often async
    // itself (fires an event, then awaits a microtask for a MutationObserver
    // to run), and the patch must still be in place when that later code runs,
    // not just for the synchronous prefix before its first await.
    return await fn();
  } finally {
    if (rectDescriptor)
      Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", rectDescriptor);
    if (widthDescriptor)
      Object.defineProperty(HTMLElement.prototype, "clientWidth", widthDescriptor);
    if (heightDescriptor)
      Object.defineProperty(HTMLElement.prototype, "clientHeight", heightDescriptor);
  }
}

describe("DropdownMenuContent", () => {
  it("wears FLOATING_PANEL and wraps its items in one SlidingIndicator", () => {
    const { container } = render(() => (
      <DropdownMenu>
        <DropdownMenuTrigger as={Button}>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>One</DropdownMenuItem>
          <DropdownMenuItem>Two</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    fireEvent.pointerDown(container.querySelector("button") as HTMLElement, {
      pointerType: "mouse",
      button: 0,
    });

    const content = document.querySelector('[data-slot="dropdown-menu-content"]');
    expectFloatingPanel(content);
    const indicator = slidingIndicatorOf(content);
    expect(indicator).not.toBeNull();
    expect(indicator?.querySelectorAll('[data-slot="dropdown-menu-item"]')).toHaveLength(2);
  });

  it("keeps every wrapper between the menu and its items out of the a11y tree", () => {
    const { container } = render(() => (
      <DropdownMenu>
        <DropdownMenuTrigger as={Button}>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>One</DropdownMenuItem>
          <DropdownMenuItem>Two</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    fireEvent.pointerDown(container.querySelector("button") as HTMLElement, {
      pointerType: "mouse",
      button: 0,
    });

    const menu = document.querySelector<HTMLElement>('[role="menu"]');
    const item = menu?.querySelector<HTMLElement>('[role="menuitem"]');
    if (!menu || !item) throw new Error("menu did not render");
    for (let el = item.parentElement; el && el !== menu; el = el.parentElement) {
      expect(String(el.getAttribute("role")), el.outerHTML.slice(0, 120)).toMatch(
        /^(none|presentation)$/,
      );
    }
  });

  it("gives DropdownMenuSub a SubContent that wraps its items in an indicator", () => {
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

    fireEvent.pointerDown(container.querySelector("button") as HTMLElement, {
      pointerType: "mouse",
      button: 0,
    });
    const subTrigger = document.querySelector<HTMLElement>(
      '[data-slot="dropdown-menu-sub-trigger"]',
    );
    if (!subTrigger) throw new Error("no sub trigger rendered");
    fireEvent.click(subTrigger);

    const subContent = document.querySelector('[data-slot="dropdown-menu-sub-content"]');
    expectFloatingPanel(subContent);
    const indicator = slidingIndicatorOf(subContent);
    expect(indicator).not.toBeNull();
    expect(indicator?.querySelector('[data-slot="dropdown-menu-item"]')?.textContent).toBe(
      "Nested",
    );
  });

  it("renders a checkbox item with a data-slot and a toggleable indicator", () => {
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

    fireEvent.pointerDown(container.querySelector("button") as HTMLElement, {
      pointerType: "mouse",
      button: 0,
    });
    const item = document.querySelector<HTMLElement>('[data-slot="dropdown-menu-checkbox-item"]');
    if (!item) throw new Error("no checkbox item rendered");
    fireEvent.pointerDown(item, { pointerType: "mouse", button: 0 });
    fireEvent.pointerUp(item, { pointerType: "mouse", button: 0 });
    expect(checked()).toBe(true);
  });
});

describe("ContextMenuContent", () => {
  it("wears FLOATING_PANEL and wraps its items in one SlidingIndicator", () => {
    const { container } = render(() => (
      <ContextMenu>
        <ContextMenuTrigger class="block h-8 w-8">Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>One</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ));

    fireEvent.contextMenu(container.querySelector('[data-slot="context-menu-trigger"]') as Element);

    const content = document.querySelector('[data-slot="context-menu-content"]');
    expectFloatingPanel(content);
    expect(slidingIndicatorOf(content)).not.toBeNull();
  });

  it("gives a destructive item its tone through --glass-tone, not a color variant", () => {
    const { container } = render(() => (
      <ContextMenu>
        <ContextMenuTrigger class="block h-8 w-8">Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem tone="var(--destructive)">Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ));

    fireEvent.contextMenu(container.querySelector('[data-slot="context-menu-trigger"]') as Element);

    const item = document.querySelector<HTMLElement>('[data-slot="context-menu-item"]');
    if (!item) throw new Error("no item rendered");
    expect(item.style.getPropertyValue("--glass-tone")).toBe("var(--destructive)");
    // data-tone is what MENU_ITEM's svg guard keys off, so the row and its
    // icons follow one source instead of a second colour variant axis.
    expect(item.dataset.tone).toBe("");
  });

  it("lets a toned item's real svg child inherit the tone instead of muted-foreground", () => {
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

    fireEvent.contextMenu(container.querySelector('[data-slot="context-menu-trigger"]') as Element);

    const item = document.querySelector<HTMLElement>('[data-slot="context-menu-item"]');
    if (!item) throw new Error("no item rendered");
    expect(item.dataset.tone).toBe("");

    const tokens = item.className.split(/\s+/);
    expect(tokens).toContain(
      "[&:not([data-tone])_svg:not([class*='text-'])]:text-muted-foreground",
    );
    expect(tokens).not.toContain("[&_svg:not([class*='text-'])]:text-muted-foreground");
  });

  it("mirrors the highlighted item's own tone onto the sliding indicator", async () => {
    await withMeasurableLayout(async () => {
      const { container } = render(() => (
        <ContextMenu>
          <ContextMenuTrigger class="block h-8 w-8">Right-click</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>One</ContextMenuItem>
            <ContextMenuItem tone="var(--destructive)">Delete</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ));

      fireEvent.contextMenu(
        container.querySelector('[data-slot="context-menu-trigger"]') as Element,
      );
      const items = document.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]');
      const destructiveItem = items[1];
      if (!destructiveItem) throw new Error("no destructive item rendered");

      // Drives MenuContentIndicator's own [data-highlighted] MutationObserver
      // directly rather than Kobalte's hover/keyboard focus machinery (its
      // own concern, not this batch's, and not reliably driveable through
      // synthetic pointer/keyboard events in happy-dom).
      destructiveItem.setAttribute("data-highlighted", "");
      // The tone sync runs off a MutationObserver callback (microtask).
      await Promise.resolve();
      await Promise.resolve();

      const indicator = document.querySelector<HTMLElement>("[data-sliding-indicator]");
      expect(indicator).not.toBeNull();
      expect(indicator?.style.getPropertyValue("--glass-tone")).toBe("var(--destructive)");
    });
  });
});
