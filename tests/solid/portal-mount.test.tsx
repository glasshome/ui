import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { DelegatedEvents, delegateEvents } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
} from "../../src/solid/bottom-sheet/index.js";
import { Button } from "../../src/solid/button.js";
import { Dialog, DialogContent, DialogTitle } from "../../src/solid/dialog.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../../src/solid/dropdown-menu.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../src/solid/popover.js";
import { PortalMountContext } from "../../src/solid/portal-mount.js";
import { useFakeTime } from "../../src/testing/fake-time.js";
import { inShadowRoot } from "../../src/lib/shadow-layer.js";
import uiCss from "../../src/styles/globals.css?inline";

// Fake time holds no CSS clock, so the enter and exit animations layers wait on are finished here.
function finishAnimations() {
  for (const root of [document, ...shadowRoots]) {
    for (const animation of root.getAnimations()) {
      if (animation.effect?.getComputedTiming().endTime !== Infinity) animation.finish();
    }
  }
}

const shadowRoots: ShadowRoot[] = [];

// Frames stay real: animation events are dispatched on them.
beforeEach(() =>
  useFakeTime({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] }),
);

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const unpin = (e: Event) => {
  Reflect.deleteProperty(e, "target");
  Reflect.deleteProperty(e, "currentTarget");
};
delegateEvents([...DelegatedEvents]);
for (const name of DelegatedEvents) document.addEventListener(name, unpin);

/** The realm's wiring (widget-sdk's `delegateInside`): the document cannot see into a closed root, so Solid listens on it. */
function delegateInside(root: ShadowRoot) {
  const target = {
    addEventListener: (type: string, listener: EventListener) =>
      root.addEventListener(type, listener),
    removeEventListener: (type: string, listener: EventListener) =>
      root.removeEventListener(type, listener),
  } as unknown as Document;
  delegateEvents([...DelegatedEvents], target);
  for (const name of DelegatedEvents) root.addEventListener(name, unpin);
  root.adoptedStyleSheets = [uiSheet];
}

/** The realm adopts the widget's compiled stylesheet; page styles never reach into a shadow root. */
const uiSheet = new CSSStyleSheet();
uiSheet.replaceSync(uiCss);

/** A closed shadow root on the page, as a sealed realm's overlay is. */
function closedRoot() {
  const holder = document.createElement("div");
  document.body.appendChild(holder);
  const root = holder.attachShadow({ mode: "closed" });
  delegateInside(root);
  shadowRoots.push(root);
  const mount = document.createElement("div");
  root.appendChild(mount);
  return { holder, root, mount };
}

/** Layers open and close through CSS animations, whose events land on the next frame, and listen for outside presses a timer after they open. */
const layersListening = async () => {
  finishAnimations();
  await new Promise(requestAnimationFrame);
  await vi.advanceTimersByTimeAsync(20);
};

/** A real press on the target (its centre unless a spot inside it is given), aimed at the page: no locator reaches into a closed root. */
async function press(target: Element, spot?: { x: number; y: number }) {
  const box = target.getBoundingClientRect();
  const page = document.documentElement.getBoundingClientRect();
  const { x, y } = spot ?? { x: box.width / 2, y: box.height / 2 };
  await userEvent.click(document.documentElement, {
    position: { x: box.x - page.x + x, y: box.y - page.y + y },
  });
}

// The scrim's centre sits under the dialog itself.
const SCRIM_EDGE = { x: 4, y: 4 };

/** Something to press away from every layer, in the viewport's top-right corner. */
function corner<K extends keyof HTMLElementTagNameMap>(tag: K): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.style.cssText = "position: fixed; top: 0; right: 0; width: 40px; height: 40px;";
  return el;
}

function subTriggerIn(root: ShadowRoot): Element {
  const trigger = root.querySelector('[data-slot="dropdown-menu-sub-trigger"]');
  if (!trigger) throw new Error("no submenu trigger");
  return trigger;
}

const dispatchPress = (target: Element) => {
  for (const type of ["pointerdown", "pointerup", "click"]) {
    target.dispatchEvent(
      new (type === "click" ? MouseEvent : PointerEvent)(type, { bubbles: true, composed: true }),
    );
  }
};

describe("a portal mount inside a closed shadow root", () => {
  it("keeps dialog content in the shadow root, open through a press inside it", async () => {
    const { root, mount } = closedRoot();
    const [open, setOpen] = createSignal(true);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <Dialog open={open()} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Edit</DialogTitle>
              <Button data-testid="inside">Save</Button>
            </DialogContent>
          </Dialog>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    const content = root.querySelector('[data-slot="dialog-content"]');
    expect(content).toBeTruthy();
    expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull();
    const inside = root.querySelector('[data-testid="inside"]');
    if (!inside) throw new Error("no button");
    await layersListening();
    await press(inside);
    expect(open()).toBe(true);
  });

  it("still closes the dialog on a press on its scrim or on the page", async () => {
    const { root, mount } = closedRoot();
    const page = corner("button");
    document.body.appendChild(page);
    for (const target of ["scrim", "page"] as const) {
      const [open, setOpen] = createSignal(true);
      const dispose = render(
        () => (
          <PortalMountContext.Provider value={mount}>
            <Dialog open={open()} onOpenChange={setOpen}>
              <DialogContent>
                <DialogTitle>Edit</DialogTitle>
              </DialogContent>
            </Dialog>
          </PortalMountContext.Provider>
        ),
        { container: mount },
      );
      await layersListening();
      const scrim = root.querySelector('[data-slot="dialog-overlay"]');
      if (!scrim) throw new Error("no scrim");
      await (target === "scrim" ? press(scrim, SCRIM_EDGE) : press(page));
      expect(open(), target).toBe(false);
      dispose.unmount();
    }
  });

  it("closes the dialog on Escape", async () => {
    const { root, mount } = closedRoot();
    const [open, setOpen] = createSignal(true);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <Dialog open={open()} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Edit</DialogTitle>
              <Button data-testid="inside">Save</Button>
            </DialogContent>
          </Dialog>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    await layersListening();
    const inside = root.querySelector<HTMLElement>('[data-testid="inside"]');
    inside?.focus();
    await userEvent.keyboard("{Escape}");
    expect(open()).toBe(false);
  });

  it("wraps Tab inside the dialog", async () => {
    const { root, mount } = closedRoot();
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <Dialog open>
            <DialogContent>
              <DialogTitle>Edit</DialogTitle>
              <Button data-testid="first">One</Button>
              <Button data-testid="last">Two</Button>
            </DialogContent>
          </Dialog>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    const last = root.querySelector<HTMLElement>('[data-testid="last"]');
    last?.focus();
    expect(root.activeElement).toBe(last);
    await userEvent.keyboard("{Tab}");
    expect(root.activeElement).toBe(root.querySelector('[data-testid="first"]'));
  });

  it("keeps popover content in the shadow root", () => {
    const { root, mount } = closedRoot();
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <Popover open>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent>Hello</PopoverContent>
          </Popover>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    expect(root.textContent).toContain("Hello");
    expect(document.body.textContent).not.toContain("Hello");
  });

  it("keeps a bottom sheet open through a press inside it", async () => {
    const { root, mount } = closedRoot();
    const [open, setOpen] = createSignal(true);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <BottomSheet open={open()} onOpenChange={setOpen}>
            <BottomSheetContent>
              <BottomSheetTitle>Sheet</BottomSheetTitle>
              <Button data-testid="inside">Save</Button>
            </BottomSheetContent>
          </BottomSheet>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    const inside = root.querySelector('[data-testid="inside"]');
    expect(inside).toBeTruthy();
    await layersListening();
    if (inside) await press(inside);
    expect(open()).toBe(true);
  });
});

/** An element with an open shadow root of its own, as `<iconify-icon>` is. */
function iconLike(): HTMLElement {
  const icon = document.createElement("span");
  icon.setAttribute("data-testid", "icon");
  const inner = icon.attachShadow({ mode: "open" });
  const glyph = inner.appendChild(document.createElement("svg"));
  glyph.style.cssText = "display: block; width: 24px; height: 24px;";
  return icon;
}

describe("on the page, with no portal mount", () => {
  it("a bottom sheet stays open through a press inside an icon's own shadow root", async () => {
    const [open, setOpen] = createSignal(true);
    const icon = iconLike();
    render(() => (
      <BottomSheet open={open()} onOpenChange={setOpen}>
        <BottomSheetContent>
          <BottomSheetTitle>Sheet</BottomSheetTitle>
          {icon}
        </BottomSheetContent>
      </BottomSheet>
    ));
    await layersListening();
    const svg = icon.shadowRoot?.firstElementChild;
    if (!svg) throw new Error("no icon content");
    await press(svg);
    expect(open()).toBe(true);
  });

  it("inShadowRoot answers false where there is no ShadowRoot at all, as on a server", () => {
    const saved = globalThis.ShadowRoot;
    // @ts-expect-error a server has no ShadowRoot
    delete globalThis.ShadowRoot;
    try {
      expect(inShadowRoot(document.body)).toBe(false);
    } finally {
      globalThis.ShadowRoot = saved;
    }
  });
});

describe("layers stacked inside a closed shadow root", () => {
  function dialogWithPopover() {
    const { root, mount } = closedRoot();
    const [dialog, setDialog] = createSignal(true);
    const [popover, setPopover] = createSignal(true);
    const icon = iconLike();
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <Dialog open={dialog()} onOpenChange={setDialog}>
            <DialogContent>
              <DialogTitle>Edit</DialogTitle>
              <input data-testid="field" />
              {icon}
              <Popover open={popover()} onOpenChange={setPopover}>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>
                  <Button data-testid="in-popover">Pick</Button>
                </PopoverContent>
              </Popover>
            </DialogContent>
          </Dialog>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    const q = (id: string) => {
      const el = root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      if (!el) throw new Error(`no ${id}`);
      return el;
    };
    return { root, dialog, popover, q, icon };
  }

  it("a press inside the newer layer closes neither", async () => {
    const { dialog, popover, q } = dialogWithPopover();
    await layersListening();
    await press(q("in-popover"));
    expect([dialog(), popover()]).toEqual([true, true]);
  });

  it("a press on the dialog body closes only the popover, and focus stays where it went", async () => {
    const { root, dialog, popover, q } = dialogWithPopover();
    await layersListening();
    const field = q("field");
    field.focus();
    await press(field);
    await layersListening();
    expect([dialog(), popover()]).toEqual([true, false]);
    expect(root.activeElement).toBe(field);
  });

  it("a press on the scrim closes only the newest layer", async () => {
    const { root, dialog, popover } = dialogWithPopover();
    await layersListening();
    const scrim = root.querySelector('[data-slot="dialog-overlay"]');
    if (!scrim) throw new Error("no scrim");
    await press(scrim, SCRIM_EDGE);
    expect([dialog(), popover()]).toEqual([true, false]);
  });

  it("a press inside an icon's own shadow root in the dialog is inside it", async () => {
    const { dialog, icon } = dialogWithPopover();
    await layersListening();
    const svg = icon.shadowRoot?.firstElementChild;
    if (!svg) throw new Error("no icon content");
    await press(svg);
    expect(dialog()).toBe(true);
  });
});

describe("focus in a dialog inside a closed shadow root", () => {
  function editDialog() {
    const { root, mount } = closedRoot();
    const [open, setOpen] = createSignal(true);
    const outside = document.createElement("button");
    root.appendChild(outside);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <Dialog open={open()} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Edit</DialogTitle>
              <Button data-testid="first">One</Button>
              <Button data-testid="last">Two</Button>
            </DialogContent>
          </Dialog>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    return { root, setOpen, outside };
  }

  it("starts on the first control once the open settles", async () => {
    const { root } = editDialog();
    await layersListening();
    expect(root.activeElement).toBe(root.querySelector('[data-testid="first"]'));
  });

  it("leaves Tab alone once the dialog has closed", async () => {
    const { setOpen, outside } = editDialog();
    await layersListening();
    setOpen(false);
    await layersListening();
    outside.focus();
    const tabs: KeyboardEvent[] = [];
    const seen = (e: KeyboardEvent) => e.key === "Tab" && tabs.push(e);
    window.addEventListener("keydown", seen);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    window.removeEventListener("keydown", seen);
    expect(tabs[0]?.defaultPrevented).toBe(false);
  });
});

describe("the rest of the shadow-root review's cases", () => {
  it("a press inside an open submenu keeps the menu and the submenu open", async () => {
    const { root, mount } = closedRoot();
    const [menu, setMenu] = createSignal(true);
    const [sub, setSub] = createSignal(false);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <DropdownMenu open={menu()} onOpenChange={setMenu}>
            <DropdownMenuTrigger>Open</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuSub onOpenChange={setSub}>
                <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem data-testid="nested" closeOnSelect={false}>
                    Nested
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    await press(subTriggerIn(root));
    await layersListening();
    const nested = root.querySelector<HTMLElement>('[data-testid="nested"]');
    if (!nested) throw new Error("no submenu item");
    nested.focus();
    await press(nested);
    await layersListening();
    expect([menu(), sub()]).toEqual([true, true]);
  });

  it("a touch that starts outside a popover closes it on its click, never on the touch alone", async () => {
    const { root, mount } = closedRoot();
    const outside = document.createElement("div");
    root.appendChild(outside);
    const [open, setOpen] = createSignal(true);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <Popover open={open()} onOpenChange={setOpen}>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent>Hello</PopoverContent>
          </Popover>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    await layersListening();
    outside.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "touch" }),
    );
    expect(open()).toBe(true);
    outside.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    expect(open()).toBe(false);
  });

  it("a popover the caller holds a ref to still counts a press inside it as inside", async () => {
    const { root, mount } = closedRoot();
    const [open, setOpen] = createSignal(true);
    let held: HTMLElement | undefined;
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <Popover open={open()} onOpenChange={setOpen}>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent ref={(el: HTMLElement) => (held = el)}>
              <Button data-testid="in-popover">Pick</Button>
            </PopoverContent>
          </Popover>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    await layersListening();
    const inside = root.querySelector<HTMLElement>('[data-testid="in-popover"]');
    if (!inside) throw new Error("no popover content");
    await press(inside);
    expect(open()).toBe(true);
    expect(held?.contains(inside)).toBe(true);
  });

  it("a popover whose caller closes it on an outside interaction stays open through a press inside it", async () => {
    const { root, mount } = closedRoot();
    const [open, setOpen] = createSignal(true);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <Popover open={open()} onOpenChange={setOpen}>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent onInteractOutside={() => setOpen(false)}>
              <Button data-testid="in-popover">Pick</Button>
            </PopoverContent>
          </Popover>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    await layersListening();
    expect(open()).toBe(true);
    const inside = root.querySelector<HTMLElement>('[data-testid="in-popover"]');
    if (!inside) throw new Error("no popover content");
    await press(inside);
    expect(open()).toBe(true);
  });

  it("a bottom sheet in a shadow root closes on a press on the page outside the root's host", async () => {
    const { mount } = closedRoot();
    const page = corner("button");
    document.body.appendChild(page);
    const [open, setOpen] = createSignal(true);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <BottomSheet open={open()} onOpenChange={setOpen}>
            <BottomSheetContent>
              <BottomSheetTitle>Sheet</BottomSheetTitle>
            </BottomSheetContent>
          </BottomSheet>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    await layersListening();
    await press(page);
    expect(open()).toBe(false);
  });
});

describe("the second shadow-root review's cases", () => {
  const touchDown = (target: Element) =>
    target.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "touch" }),
    );

  function popoverIn(mount: HTMLElement, props: { onCloseAutoFocus?: (e: Event) => void } = {}) {
    const [open, setOpen] = createSignal(true);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <Popover open={open()} onOpenChange={setOpen}>
            <PopoverTrigger data-testid="trigger">Open</PopoverTrigger>
            <PopoverContent onCloseAutoFocus={props.onCloseAutoFocus}>
              <Button data-testid="in-popover">Pick</Button>
            </PopoverContent>
          </Popover>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    return { open, setOpen };
  }

  it("a touch outside that became a scroll never closes the popover on a later tap inside it", async () => {
    const { root, mount } = closedRoot();
    const outside = document.createElement("div");
    root.appendChild(outside);
    const { open } = popoverIn(mount);
    await layersListening();
    touchDown(outside);
    const inside = root.querySelector<HTMLElement>('[data-testid="in-popover"]');
    if (!inside) throw new Error("no popover content");
    dispatchPress(inside);
    expect(open()).toBe(true);
  });

  it("a press on an open popover's own trigger closes it and leaves it closed", async () => {
    const { root, mount } = closedRoot();
    const { open } = popoverIn(mount);
    await layersListening();
    const trigger = root.querySelector<HTMLElement>('[data-testid="trigger"]');
    if (!trigger) throw new Error("no trigger");
    dispatchPress(trigger);
    await layersListening();
    expect(open()).toBe(false);
  });

  it("a dropdown menu closed by a press on a field leaves focus on that field", async () => {
    const { root, mount } = closedRoot();
    const field = corner("input");
    root.appendChild(field);
    const [open, setOpen] = createSignal(true);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <DropdownMenu open={open()} onOpenChange={setOpen}>
            <DropdownMenuTrigger>Open</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>One</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    await layersListening();
    field.focus();
    await press(field);
    await layersListening();
    expect(open()).toBe(false);
    expect(root.activeElement).toBe(field);
  });

  it("a dropdown menu in a shadow root never hides the realm's host from assistive tech", async () => {
    const { holder, mount } = closedRoot();
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <DropdownMenu open>
            <DropdownMenuTrigger>Open</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>One</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    await layersListening();
    expect(holder.getAttribute("aria-hidden")).toBeNull();
  });

  it("one press outside a menu and its open submenu closes both", async () => {
    const { root, mount } = closedRoot();
    const outside = corner("div");
    root.appendChild(outside);
    const [menu, setMenu] = createSignal(true);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <DropdownMenu open={menu()} onOpenChange={setMenu}>
            <DropdownMenuTrigger>Open</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Nested</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    await press(subTriggerIn(root));
    await layersListening();
    expect(root.querySelector('[data-slot="dropdown-menu-sub-content"]')).not.toBeNull();
    await press(outside);
    expect(menu()).toBe(false);
  });

  it("a bottom sheet in a realm that sits inside a page dialog still closes on a press elsewhere in the realm", async () => {
    const pageDialog = document.createElement("div");
    pageDialog.setAttribute("role", "dialog");
    document.body.appendChild(pageDialog);
    const holder = document.createElement("div");
    pageDialog.appendChild(holder);
    const root = holder.attachShadow({ mode: "closed" });
    delegateInside(root);
    shadowRoots.push(root);
    const mount = document.createElement("div");
    root.appendChild(mount);
    const elsewhere = corner("div");
    root.appendChild(elsewhere);
    const [open, setOpen] = createSignal(true);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <BottomSheet open={open()} onOpenChange={setOpen}>
            <BottomSheetContent>
              <BottomSheetTitle>Sheet</BottomSheetTitle>
            </BottomSheetContent>
          </BottomSheet>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    await layersListening();
    await press(elsewhere);
    expect(open()).toBe(false);
  });

  it("a close the caller refused leaves no trace on the next close's focus", async () => {
    const { root, mount } = closedRoot();
    const outside = corner("div");
    root.appendChild(outside);
    const prevented: boolean[] = [];
    const [open, setOpen] = createSignal(true);
    render(
      () => (
        <PortalMountContext.Provider value={mount}>
          <Popover open={open()} onOpenChange={() => {}}>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent onCloseAutoFocus={(e: Event) => prevented.push(e.defaultPrevented)}>
              Hello
            </PopoverContent>
          </Popover>
        </PortalMountContext.Provider>
      ),
      { container: mount },
    );
    await layersListening();
    await press(outside);
    expect(open()).toBe(true);
    setOpen(false);
    await layersListening();
    expect(prevented).toEqual([false]);
  });

  it("an open layer in one realm never stops a press closing another realm's layer", async () => {
    const a = closedRoot();
    const b = closedRoot();
    const elsewhereInB = corner("div");
    b.root.appendChild(elsewhereInB);
    const inB = popoverIn(b.mount);
    await layersListening();
    // The other realm's layer stays open on presses outside it, as one whose caller refuses the close does.
    render(
      () => (
        <PortalMountContext.Provider value={a.mount}>
          <Popover open onOpenChange={() => {}}>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent>Stays</PopoverContent>
          </Popover>
        </PortalMountContext.Provider>
      ),
      { container: a.mount },
    );
    await layersListening();
    await press(elsewhereInB);
    expect(inB.open()).toBe(false);
  });
});
