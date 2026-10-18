import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
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

/* happy-dom runs no animations, so Kobalte's exit presence is ended by hand. */
function endExitAnimations() {
  for (const root of [document, ...shadowRoots]) {
    for (const el of root.querySelectorAll('[data-slot$="-content"], [data-slot$="-overlay"]')) {
      const event = new Event("animationend");
      Object.defineProperty(event, "animationName", { value: "" });
      el.dispatchEvent(event);
    }
  }
}

const shadowRoots: ShadowRoot[] = [];

beforeEach(() => useFakeTime());

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

/** A closed shadow root on the page, as a sealed realm's overlay is. */
function closedRoot() {
  const holder = document.createElement("div");
  document.body.appendChild(holder);
  const root = holder.attachShadow({ mode: "closed" });
  holderRoots.set(holder, root);
  shadowRoots.push(root);
  const mount = document.createElement("div");
  root.appendChild(mount);
  return { holder, root, mount };
}

/**
 * What a browser does and happy-dom does not: outside the shadow root, an event's target and
 * the document's active element are the shadow host, never a node inside it.
 */
function retargetAtPage(holder: Element): () => void {
  const root = holder.shadowRoot ?? holderRoots.get(holder);
  const add = document.addEventListener.bind(document);
  const remove = document.removeEventListener.bind(document);
  const wrapped = new WeakMap<object, EventListener>();
  const view = (e: Event): Event => {
    const t = e.target;
    if (!(t instanceof Node) || t.getRootNode() !== root) return e;
    return new Proxy(e, {
      get: (event, key) => {
        if (key === "target") return holder;
        const value = Reflect.get(event, key, event) as unknown;
        return typeof value === "function" ? value.bind(event) : value;
      },
    });
  };
  document.addEventListener = function (
    this: Document,
    type: string,
    listener: unknown,
    options?: unknown,
  ) {
    if (typeof listener !== "function") {
      add.call(this, type, listener as never, options as never);
      return;
    }
    let w = wrapped.get(listener);
    if (!w) {
      w = (e: Event) => (listener as EventListener).call(document, view(e));
      wrapped.set(listener, w);
    }
    add.call(this, type, w, options as never);
  } as typeof document.addEventListener;
  document.removeEventListener = function (
    this: Document,
    type: string,
    listener: unknown,
    options?: unknown,
  ) {
    const w = typeof listener === "function" ? wrapped.get(listener) : undefined;
    remove.call(this, type, (w ?? listener) as never, options as never);
  } as typeof document.removeEventListener;
  Object.defineProperty(document, "activeElement", { configurable: true, get: () => holder });
  return () => {
    delete (document as { addEventListener?: unknown }).addEventListener;
    delete (document as { removeEventListener?: unknown }).removeEventListener;
    delete (document as { activeElement?: unknown }).activeElement;
  };
}

const holderRoots = new WeakMap<Element, ShadowRoot>();

/** Dismissable layers start listening for outside presses a timer after they open. */
const layersListening = async () => {
  await vi.advanceTimersByTimeAsync(20);
};

const press = (target: Element) => {
  for (const type of ["pointerdown", "pointerup", "click"]) {
    target.dispatchEvent(
      new (type === "click" ? MouseEvent : PointerEvent)(type, { bubbles: true, composed: true }),
    );
  }
};

describe("a portal mount inside a closed shadow root", () => {
  it("keeps dialog content in the shadow root, open through a press inside it", async () => {
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
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
    press(inside);
    expect(open()).toBe(true);
  });

  it("still closes the dialog on a press on its scrim or on the page", async () => {
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
    const page = document.createElement("button");
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
      press(target === "scrim" ? scrim : page);
      expect(open(), target).toBe(false);
      dispose.unmount();
    }
  });

  it("closes the dialog on Escape", async () => {
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
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
    inside?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }),
    );
    expect(open()).toBe(false);
  });

  it("wraps Tab inside the dialog", () => {
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
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
    last?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true, composed: true }),
    );
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
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
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
    if (inside) press(inside);
    expect(open()).toBe(true);
  });
});

/** An element with an open shadow root of its own, as `<iconify-icon>` is. */
function iconLike(): HTMLElement {
  const icon = document.createElement("span");
  icon.setAttribute("data-testid", "icon");
  const inner = icon.attachShadow({ mode: "open" });
  inner.appendChild(document.createElement("svg"));
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
    press(svg);
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
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
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
    press(q("in-popover"));
    expect([dialog(), popover()]).toEqual([true, true]);
  });

  it("a press on the dialog body closes only the popover, and focus stays where it went", async () => {
    const { root, dialog, popover, q } = dialogWithPopover();
    await layersListening();
    const field = q("field");
    field.focus();
    press(field);
    await layersListening();
    expect([dialog(), popover()]).toEqual([true, false]);
    expect(root.activeElement).toBe(field);
  });

  it("a press on the scrim closes only the newest layer", async () => {
    const { root, dialog, popover } = dialogWithPopover();
    await layersListening();
    const scrim = root.querySelector('[data-slot="dialog-overlay"]');
    if (!scrim) throw new Error("no scrim");
    press(scrim);
    expect([dialog(), popover()]).toEqual([true, false]);
  });

  it("a press inside an icon's own shadow root in the dialog is inside it", async () => {
    const { dialog, icon } = dialogWithPopover();
    await layersListening();
    const svg = icon.shadowRoot?.firstElementChild;
    if (!svg) throw new Error("no icon content");
    press(svg);
    expect(dialog()).toBe(true);
  });
});

describe("focus in a dialog inside a closed shadow root", () => {
  function editDialog() {
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
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
    endExitAnimations();
    await layersListening();
    outside.focus();
    const tab = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    outside.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
  });
});

describe("the rest of the shadow-root review's cases", () => {
  it("a press inside an open submenu keeps the menu and the submenu open", async () => {
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
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
    root.querySelector<HTMLElement>('[data-slot="dropdown-menu-sub-trigger"]')?.click();
    await layersListening();
    const nested = root.querySelector<HTMLElement>('[data-testid="nested"]');
    if (!nested) throw new Error("no submenu item");
    nested.focus();
    press(nested);
    await layersListening();
    expect([menu(), sub()]).toEqual([true, true]);
  });

  it("a touch that starts outside a popover closes it on its click, never on the touch alone", async () => {
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
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
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
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
    press(inside);
    expect(open()).toBe(true);
    expect(held?.contains(inside)).toBe(true);
  });

  it("a bottom sheet in a shadow root closes on a press on the page outside the root's host", async () => {
    const { holder, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
    const page = document.createElement("button");
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
    press(page);
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
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
    const outside = document.createElement("div");
    root.appendChild(outside);
    const { open } = popoverIn(mount);
    await layersListening();
    touchDown(outside);
    const inside = root.querySelector<HTMLElement>('[data-testid="in-popover"]');
    if (!inside) throw new Error("no popover content");
    press(inside);
    expect(open()).toBe(true);
  });

  it("a press on an open popover's own trigger closes it and leaves it closed", async () => {
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
    const { open } = popoverIn(mount);
    await layersListening();
    const trigger = root.querySelector<HTMLElement>('[data-testid="trigger"]');
    if (!trigger) throw new Error("no trigger");
    press(trigger);
    await layersListening();
    expect(open()).toBe(false);
  });

  it("a dropdown menu closed by a press on a field leaves focus on that field", async () => {
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
    const field = document.createElement("input");
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
    press(field);
    endExitAnimations();
    await layersListening();
    expect(open()).toBe(false);
    expect(root.activeElement).toBe(field);
  });

  it("a dropdown menu in a shadow root never hides the realm's host from assistive tech", async () => {
    const { holder, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
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
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
    const outside = document.createElement("div");
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
    root.querySelector<HTMLElement>('[data-slot="dropdown-menu-sub-trigger"]')?.click();
    await layersListening();
    expect(root.querySelector('[data-slot="dropdown-menu-sub-content"]')).not.toBeNull();
    press(outside);
    expect(menu()).toBe(false);
  });

  it("a bottom sheet in a realm that sits inside a page dialog still closes on a press elsewhere in the realm", async () => {
    const pageDialog = document.createElement("div");
    pageDialog.setAttribute("role", "dialog");
    document.body.appendChild(pageDialog);
    const holder = document.createElement("div");
    pageDialog.appendChild(holder);
    const root = holder.attachShadow({ mode: "closed" });
    holderRoots.set(holder, root);
    shadowRoots.push(root);
    const mount = document.createElement("div");
    root.appendChild(mount);
    const elsewhere = document.createElement("div");
    root.appendChild(elsewhere);
    onTestFinished(retargetAtPage(holder));
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
    press(elsewhere);
    expect(open()).toBe(false);
  });

  it("a close the caller refused leaves no trace on the next close's focus", async () => {
    const { holder, root, mount } = closedRoot();
    onTestFinished(retargetAtPage(holder));
    const outside = document.createElement("div");
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
    press(outside);
    expect(open()).toBe(true);
    setOpen(false);
    endExitAnimations();
    await layersListening();
    expect(prevented).toEqual([false]);
  });

  it("an open layer in one realm never stops a press closing another realm's layer", async () => {
    const a = closedRoot();
    const b = closedRoot();
    onTestFinished(retargetAtPage(b.holder));
    const elsewhereInB = document.createElement("div");
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
    press(elsewhereInB);
    expect(inB.open()).toBe(false);
  });
});
