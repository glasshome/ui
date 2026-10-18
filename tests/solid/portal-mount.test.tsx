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
import { Popover, PopoverContent, PopoverTrigger } from "../../src/solid/popover.js";
import { PortalMountContext } from "../../src/solid/portal-mount.js";
import { useFakeTime } from "../../src/testing/fake-time.js";

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
