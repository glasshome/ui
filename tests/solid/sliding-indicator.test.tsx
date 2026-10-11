/* The admin tabs bug: only the container was under a ResizeObserver, so an
 * <iconify-icon>/webfont growing the active item after first paint left the
 * indicator at its stale width. These tests pin the fix at the DOM level:
 * the active item itself is observed, and a fonts.ready re-measure recovers
 * from a zero-size first pass. */
import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SlidingIndicator } from "../../src/solid/sliding-indicator.js";
import { useFakeTime } from "../../src/testing/index.js";

type Rect = { left: number; top: number; width: number; height: number };

function stubRect(el: HTMLElement, rect: Rect) {
  el.getBoundingClientRect = () =>
    ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => rect,
    }) as DOMRect;
}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  elements = new Set<Element>();
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.elements.add(el);
  }
  unobserve(el: Element) {
    this.elements.delete(el);
  }
  disconnect() {
    this.elements.clear();
  }
  fire() {
    this.callback([], this as unknown as ResizeObserver);
  }
}

let realResizeObserver: typeof ResizeObserver;

beforeEach(() => {
  FakeResizeObserver.instances = [];
  realResizeObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
  globalThis.ResizeObserver = realResizeObserver;
});

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

async function frames(count = 3) {
  for (let i = 0; i < count; i++) {
    vi.advanceTimersToNextFrame();
    await flush();
  }
  await flush();
}

describe("SlidingIndicator", () => {
  it("observes the active item, not just the container, and follows it when it resizes", async () => {
    const { container } = render(() => (
      <SlidingIndicator active={0}>
        <button type="button">Overview</button>
        <button type="button">Activity</button>
      </SlidingIndicator>
    ));
    const root = container.querySelector("[data-slot], .relative") ?? container.firstElementChild;
    const buttons = container.querySelectorAll("button");
    const active = buttons[0] as HTMLElement;
    if (!(root instanceof HTMLElement)) throw new Error("no root");
    stubRect(root, { left: 0, top: 0, width: 200, height: 32 });
    stubRect(active, { left: 0, top: 0, width: 80, height: 32 });
    stubRect(buttons[1] as HTMLElement, { left: 80, top: 0, width: 80, height: 32 });
    Object.defineProperty(root, "clientWidth", { value: 200, configurable: true });
    Object.defineProperty(root, "clientHeight", { value: 32, configurable: true });

    await flush();
    const ro = FakeResizeObserver.instances[0];
    if (!ro) throw new Error("no ResizeObserver constructed");
    expect(ro.elements.has(active)).toBe(true);

    // Simulate the icon/webfont growing the active trigger after first paint.
    stubRect(active, { left: 0, top: 0, width: 140, height: 32 });
    ro.fire();
    await flush();

    const indicator = container.querySelector<HTMLElement>("[data-sliding-indicator]");
    expect(indicator?.style.width).toBe("140px");
  });

  it("re-measures once document.fonts.ready resolves", async () => {
    let ready: () => void = () => {};
    const readyPromise = new Promise<FontFaceSet>((resolve) => {
      ready = () => resolve({} as FontFaceSet);
    });
    const originalFonts = document.fonts;
    Object.defineProperty(document, "fonts", {
      value: { ready: readyPromise },
      configurable: true,
    });

    const [active] = createSignal(0);
    const { container } = render(() => (
      <SlidingIndicator active={active()}>
        <button type="button">One</button>
      </SlidingIndicator>
    ));
    const root = container.firstElementChild;
    const button = container.querySelector("button") as HTMLElement;
    if (!(root instanceof HTMLElement)) throw new Error("no root");
    // Zero size on the first pass: geometry not settled yet (pre-fonts-ready).
    stubRect(root, { left: 0, top: 0, width: 0, height: 0 });
    stubRect(button, { left: 0, top: 0, width: 0, height: 0 });
    Object.defineProperty(root, "clientWidth", { value: 0, configurable: true });
    Object.defineProperty(root, "clientHeight", { value: 0, configurable: true });
    await flush();
    expect(container.querySelector("[data-sliding-indicator]")).toBeNull();

    // The font finishes loading: real geometry, then fonts.ready resolves.
    stubRect(root, { left: 0, top: 0, width: 100, height: 32 });
    stubRect(button, { left: 0, top: 0, width: 100, height: 32 });
    Object.defineProperty(root, "clientWidth", { value: 100, configurable: true });
    Object.defineProperty(root, "clientHeight", { value: 32, configurable: true });
    ready();
    await flush();

    expect(container.querySelector<HTMLElement>("[data-sliding-indicator]")?.style.width).toBe(
      "100px",
    );
    Object.defineProperty(document, "fonts", { value: originalFonts, configurable: true });
  });

  it("retries after a zero-size pass instead of resting on it", async () => {
    useFakeTime();
    const { container } = render(() => (
      <SlidingIndicator active={0}>
        <button type="button">One</button>
      </SlidingIndicator>
    ));
    const root = container.firstElementChild;
    const button = container.querySelector("button") as HTMLElement;
    if (!(root instanceof HTMLElement)) throw new Error("no root");
    // A dialog still running its open transform: layout size is intact, the
    // rects are not, and nothing here observes the ancestor's animation.
    stubRect(root, { left: 0, top: 0, width: 0, height: 0 });
    stubRect(button, { left: 0, top: 0, width: 0, height: 0 });
    Object.defineProperty(root, "clientWidth", { value: 100, configurable: true });
    Object.defineProperty(root, "clientHeight", { value: 32, configurable: true });
    await flush();
    expect(container.querySelector("[data-sliding-indicator]")).toBeNull();

    // The transform settles. No resize, no animationend, no mutation.
    stubRect(root, { left: 0, top: 0, width: 100, height: 32 });
    stubRect(button, { left: 0, top: 0, width: 100, height: 32 });
    await frames();

    expect(container.querySelector<HTMLElement>("[data-sliding-indicator]")?.style.width).toBe(
      "100px",
    );
  });

  it("treats one zero dimension as unmeasured, not as a zero-width item", async () => {
    const { container } = render(() => (
      <SlidingIndicator active={0}>
        <button type="button">One</button>
      </SlidingIndicator>
    ));
    const root = container.firstElementChild;
    const button = container.querySelector("button") as HTMLElement;
    if (!(root instanceof HTMLElement)) throw new Error("no root");
    stubRect(root, { left: 0, top: 0, width: 200, height: 32 });
    stubRect(button, { left: 0, top: 0, width: 0, height: 32 });
    Object.defineProperty(root, "clientWidth", { value: 200, configurable: true });
    Object.defineProperty(root, "clientHeight", { value: 32, configurable: true });
    await flush();

    expect(container.querySelector("[data-sliding-indicator]")).toBeNull();
  });

  it("lands in layout pixels while an ancestor is mid-zoom", async () => {
    const { container } = render(() => (
      <SlidingIndicator active={1}>
        <button type="button">Edit</button>
        <button type="button">Debug</button>
      </SlidingIndicator>
    ));
    const root = container.firstElementChild;
    const buttons = container.querySelectorAll("button");
    if (!(root instanceof HTMLElement)) throw new Error("no root");
    stubRect(root, { left: 6, top: 1, width: 188, height: 30.08 });
    stubRect(buttons[1] as HTMLElement, { left: 100, top: 1, width: 75.2, height: 30.08 });
    Object.defineProperty(root, "offsetWidth", { value: 200, configurable: true });
    Object.defineProperty(root, "offsetHeight", { value: 32, configurable: true });
    await flush();

    const indicator = container.querySelector<HTMLElement>("[data-sliding-indicator]");
    expect(indicator?.style.transform).toBe("translateX(100px)");
    expect(indicator?.style.width).toBe("80px");
  });

  it("slides when the active item changes and lands at once when the same item re-measures", async () => {
    const [active, setActive] = createSignal(0);
    const { container } = render(() => (
      <SlidingIndicator active={active()}>
        <button type="button">One</button>
        <button type="button">Two</button>
      </SlidingIndicator>
    ));
    const root = container.firstElementChild;
    const buttons = container.querySelectorAll("button");
    if (!(root instanceof HTMLElement)) throw new Error("no root");
    stubRect(root, { left: 0, top: 0, width: 160, height: 32 });
    stubRect(buttons[0] as HTMLElement, { left: 0, top: 0, width: 80, height: 32 });
    stubRect(buttons[1] as HTMLElement, { left: 80, top: 0, width: 80, height: 32 });
    Object.defineProperty(root, "offsetWidth", { value: 160, configurable: true });
    Object.defineProperty(root, "offsetHeight", { value: 32, configurable: true });
    await flush();
    const indicator = () => container.querySelector<HTMLElement>("[data-sliding-indicator]");
    expect(indicator()?.style.transition).toBe("none");

    stubRect(buttons[0] as HTMLElement, { left: 0, top: 0, width: 96, height: 32 });
    FakeResizeObserver.instances[0]?.fire();
    await flush();
    expect(indicator()?.style.width).toBe("96px");
    expect(indicator()?.style.transition).toBe("none");

    setActive(1);
    await flush();
    expect(indicator()?.style.transform).toBe("translateX(80px)");
    expect(indicator()?.style.transition).toContain("transform 220ms ease-in-out");
    expect(indicator()?.style.transition).toContain("width 220ms ease-in-out");
  });

  it("does not re-measure after unmount once document.fonts.ready resolves late", async () => {
    let ready: () => void = () => {};
    const readyPromise = new Promise<FontFaceSet>((resolve) => {
      ready = () => resolve({} as FontFaceSet);
    });
    const originalFonts = document.fonts;
    Object.defineProperty(document, "fonts", {
      value: { ready: readyPromise },
      configurable: true,
    });

    const { container, unmount } = render(() => (
      <SlidingIndicator active={0}>
        <button type="button">One</button>
      </SlidingIndicator>
    ));
    const root = container.firstElementChild;
    const button = container.querySelector("button") as HTMLElement;
    if (!(root instanceof HTMLElement)) throw new Error("no root");
    stubRect(root, { left: 0, top: 0, width: 80, height: 32 });
    stubRect(button, { left: 0, top: 0, width: 80, height: 32 });
    Object.defineProperty(root, "clientWidth", { value: 80, configurable: true });
    Object.defineProperty(root, "clientHeight", { value: 32, configurable: true });
    await flush();

    // containerRef itself isn't nulled on unmount, so measure() would still
    // call getBoundingClientRect on it without the disposed guard.
    const rectSpy = vi.spyOn(root, "getBoundingClientRect");
    unmount();
    const callsAtUnmount = rectSpy.mock.calls.length;
    ready();
    await flush();

    expect(rectSpy.mock.calls.length).toBe(callsAtUnmount);
    Object.defineProperty(document, "fonts", { value: originalFonts, configurable: true });
  });
});

describe("SlidingIndicator with an attribute selector", () => {
  function renderPressedGroup() {
    const { container } = render(() => (
      <SlidingIndicator activeSelector="[data-pressed]">
        <button type="button" data-pressed="">
          One
        </button>
        <button type="button">Two</button>
      </SlidingIndicator>
    ));
    const root = container.firstElementChild;
    const buttons = container.querySelectorAll("button");
    if (!(root instanceof HTMLElement)) throw new Error("no root");
    stubRect(root, { left: 0, top: 0, width: 160, height: 32 });
    stubRect(buttons[0] as HTMLElement, { left: 0, top: 0, width: 80, height: 32 });
    stubRect(buttons[1] as HTMLElement, { left: 80, top: 0, width: 80, height: 32 });
    Object.defineProperty(root, "offsetWidth", { value: 160, configurable: true });
    Object.defineProperty(root, "offsetHeight", { value: 32, configurable: true });
    const indicator = () => container.querySelector<HTMLElement>("[data-sliding-indicator]");
    return { root, buttons, indicator };
  }

  const RealMutationObserver = globalThis.MutationObserver;
  afterEach(() => {
    globalThis.MutationObserver = RealMutationObserver;
  });

  // happy-dom, like Chromium up to 131, queues a style mutation for a same-value
  // custom property write; a loop would never yield, so stop delivering at a cap.
  function capObserverCallbacks(cap: number) {
    let callbacks = 0;
    globalThis.MutationObserver = class extends RealMutationObserver {
      constructor(callback: MutationCallback) {
        super((records, observer) => {
          if (++callbacks <= cap) callback(records, observer);
        });
      }
    };
    return () => callbacks;
  }

  it("settles instead of re-measuring on its own style writes", async () => {
    useFakeTime();
    const callbacks = capObserverCallbacks(500);
    const { indicator } = renderPressedGroup();
    await frames();

    expect(indicator()?.style.width).toBe("80px");
    expect(callbacks()).toBeLessThan(10);
  });

  it("settles even when every measure lands half a pixel from the last", async () => {
    useFakeTime();
    const callbacks = capObserverCallbacks(500);
    const { buttons } = renderPressedGroup();
    let width = 80;
    const first = buttons[0] as HTMLElement;
    first.getBoundingClientRect = () => {
      width = width === 80 ? 80.5 : 80;
      return {
        left: 0,
        top: 0,
        width,
        height: 32,
        right: width,
        bottom: 32,
        x: 0,
        y: 0,
      } as DOMRect;
    };
    await frames();

    expect(callbacks()).toBeLessThan(10);
  });

  it("follows an id-based selector when the id moves", async () => {
    const { container } = render(() => (
      <SlidingIndicator activeSelector="#current">
        <button type="button" id="current">
          One
        </button>
        <button type="button">Two</button>
      </SlidingIndicator>
    ));
    const root = container.firstElementChild;
    const buttons = container.querySelectorAll("button");
    if (!(root instanceof HTMLElement)) throw new Error("no root");
    stubRect(root, { left: 0, top: 0, width: 160, height: 32 });
    stubRect(buttons[0] as HTMLElement, { left: 0, top: 0, width: 80, height: 32 });
    stubRect(buttons[1] as HTMLElement, { left: 80, top: 0, width: 80, height: 32 });
    Object.defineProperty(root, "offsetWidth", { value: 160, configurable: true });
    Object.defineProperty(root, "offsetHeight", { value: 32, configurable: true });
    await flush();

    buttons[0]?.removeAttribute("id");
    buttons[1]?.setAttribute("id", "current");
    await flush();

    expect(container.querySelector<HTMLElement>("[data-sliding-indicator]")?.style.transform).toBe(
      "translateX(80px)",
    );
  });

  it("re-measures when the marker moves, not when an item's style changes", async () => {
    const { buttons, indicator } = renderPressedGroup();
    await flush();
    const first = buttons[0] as HTMLElement;
    const second = buttons[1] as HTMLElement;
    const measures = vi.spyOn(first, "getBoundingClientRect");

    first.style.setProperty("--i", "3");
    await flush();
    expect(measures).not.toHaveBeenCalled();

    first.removeAttribute("data-pressed");
    second.setAttribute("data-pressed", "");
    await flush();
    expect(indicator()?.style.transform).toBe("translateX(80px)");
  });

  it("follows a class-based selector when the class moves", async () => {
    const { container } = render(() => (
      <SlidingIndicator activeSelector=".is-active">
        <button type="button" class="is-active">
          One
        </button>
        <button type="button">Two</button>
      </SlidingIndicator>
    ));
    const root = container.firstElementChild;
    const buttons = container.querySelectorAll("button");
    if (!(root instanceof HTMLElement)) throw new Error("no root");
    stubRect(root, { left: 0, top: 0, width: 160, height: 32 });
    stubRect(buttons[0] as HTMLElement, { left: 0, top: 0, width: 80, height: 32 });
    stubRect(buttons[1] as HTMLElement, { left: 80, top: 0, width: 80, height: 32 });
    Object.defineProperty(root, "offsetWidth", { value: 160, configurable: true });
    Object.defineProperty(root, "offsetHeight", { value: 32, configurable: true });
    await flush();

    buttons[0]?.classList.remove("is-active");
    buttons[1]?.classList.add("is-active");
    await flush();

    expect(container.querySelector<HTMLElement>("[data-sliding-indicator]")?.style.transform).toBe(
      "translateX(80px)",
    );
  });

  it("writes nothing when a re-measure finds the same place", async () => {
    const { indicator } = renderPressedGroup();
    await flush();
    const el = indicator();
    if (!el) throw new Error("no indicator");
    const writes = vi.spyOn(el.style, "setProperty");

    FakeResizeObserver.instances[0]?.fire();
    await flush();

    expect(writes).not.toHaveBeenCalled();
  });
});
