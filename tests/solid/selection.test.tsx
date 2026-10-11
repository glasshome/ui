import { cleanup, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SelectionHighlight, SelectionScope } from "../../src/solid/selection.js";

type Box = { left: number; top: number; width: number; height: number };

function place(el: HTMLElement, box: Box) {
  el.getBoundingClientRect = () =>
    ({
      ...box,
      right: box.left + box.width,
      bottom: box.top + box.height,
      x: box.left,
      y: box.top,
      toJSON: () => box,
    }) as DOMRect;
  Object.defineProperty(el, "offsetWidth", { value: box.width, configurable: true });
  Object.defineProperty(el, "offsetHeight", { value: box.height, configurable: true });
}

type FakeAnimation = {
  el: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  finish: () => void;
  cancel: () => void;
  finished: Promise<unknown>;
};
let animations: FakeAnimation[] = [];

beforeEach(() => {
  animations = [];
  Element.prototype.animate = function (keyframes, options) {
    let resolve: (value: unknown) => void = () => {};
    let reject: (reason: unknown) => void = () => {};
    const finished = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    finished.catch(() => {});
    const animation: FakeAnimation = {
      el: this,
      keyframes: keyframes as Keyframe[],
      options: options as KeyframeAnimationOptions,
      finished,
      finish: () => resolve(animation),
      cancel: () => reject(new DOMException("cancelled", "AbortError")),
    };
    animations.push(animation);
    return animation as unknown as Animation;
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function flush() {
  for (let i = 0; i < 4; i++) await Promise.resolve();
}

function Item(props: { label: string; pressed?: boolean; style?: JSX.CSSProperties }) {
  return (
    <button type="button" data-pressed={props.pressed ? "" : undefined} style={props.style}>
      <SelectionHighlight />
      {props.label}
    </button>
  );
}

function renderGroup(options: { duration?: string } = {}) {
  const { container, unmount } = render(() => (
    <SelectionScope marker="pressed" style={{ "--duration-slide": options.duration ?? "220ms" }}>
      <Item label="One" pressed />
      <Item label="Two" />
      <Item label="Three wide" />
    </SelectionScope>
  ));
  const scope = container.firstElementChild as HTMLElement;
  const items = [...scope.querySelectorAll("button")];
  place(scope, { left: 0, top: 0, width: 300, height: 40 });
  place(items[0] as HTMLElement, { left: 0, top: 0, width: 80, height: 40 });
  place(items[1] as HTMLElement, { left: 80, top: 0, width: 80, height: 40 });
  place(items[2] as HTMLElement, { left: 160, top: 0, width: 140, height: 40 });
  const flyer = scope.querySelector<HTMLElement>("[data-selection-flyer]");
  if (!flyer) throw new Error("no flyer");
  const select = async (index: number) => {
    for (const item of items) item.removeAttribute("data-pressed");
    items[index]?.setAttribute("data-pressed", "");
    await flush();
  };
  return { scope, items, flyer, select, unmount };
}

const translateOf = (a: FakeAnimation) => a.keyframes[0]?.translate;
const flights = () => animations.filter((a) => a.keyframes[0]?.translate !== undefined);

describe("SelectionHighlight", () => {
  it("renders inside its own item, named for the scope's marker", () => {
    const { items } = renderGroup();
    for (const item of items) {
      const highlight = item.firstElementChild;
      expect(highlight?.getAttribute("data-selection-highlight")).toBe("");
      expect(highlight?.getAttribute("data-on")).toBe("pressed");
      expect(highlight?.getAttribute("aria-hidden")).toBe("true");
      expect(highlight?.hasAttribute("data-sliding-indicator")).toBe(true);
    }
  });

  it("renders nothing outside a scope", () => {
    const { container } = render(() => <Item label="Alone" pressed />);
    expect(container.querySelector("[data-selection-highlight]")).toBeNull();
  });
});

describe("SelectionScope", () => {
  it("renders one hidden flyer after the items", () => {
    const { scope, flyer } = renderGroup();
    expect(scope.lastElementChild).toBe(flyer);
    expect(flyer.getAttribute("aria-hidden")).toBe("true");
    expect(flyer.hasAttribute("data-flying")).toBe(false);
  });

  it("flies once from the old item to the new one", async () => {
    const { items, flyer, select } = renderGroup();
    await flush();
    expect(animations).toHaveLength(0);

    await select(2);

    expect(flights()).toHaveLength(1);
    expect(flyer.hasAttribute("data-flying")).toBe(true);
    // centres: 40 to 230, sizes 80 to 140
    expect(translateOf(flights()[0] as FakeAnimation)).toBe("-190px 0px");
    expect(flyer.style.width).toBe("140px");
    expect(flyer.style.left).toBe("160px");
    const landing = items[2]?.querySelector("[data-selection-highlight]");
    expect(landing?.hasAttribute("data-landing")).toBe(true);
  });

  it("starts a redirected flight from where the flyer is", async () => {
    const { flyer, select } = renderGroup();
    await select(2);
    place(flyer, { left: 100, top: 0, width: 110, height: 40 });

    await select(1);

    expect(flights()).toHaveLength(2);
    // flyer centre 155 to item centre 120
    expect(translateOf(flights()[1] as FakeAnimation)).toBe("35px 0px");
  });

  it("hands off to the resting highlight when the flight finishes", async () => {
    const { items, flyer, select } = renderGroup();
    await select(1);
    for (const a of animations) a.finish();
    await flush();

    expect(flyer.hasAttribute("data-flying")).toBe(false);
    expect(items[1]?.querySelector("[data-landing]")).toBeNull();
  });

  it("ends a flight whose marker is gone", async () => {
    const { items, flyer, select } = renderGroup();
    await select(1);
    items[1]?.removeAttribute("data-pressed");
    await flush();

    expect(flyer.hasAttribute("data-flying")).toBe(false);
    expect(items[1]?.querySelector("[data-landing]")).toBeNull();
  });

  it("a cancelled flight from a redirect cannot hide the next one", async () => {
    const { items, flyer, select } = renderGroup();
    await select(1);
    const first = [...animations];
    await select(2);
    for (const a of first) a.cancel();
    await flush();

    expect(flyer.hasAttribute("data-flying")).toBe(true);
    expect(items[2]?.querySelector("[data-landing]")).not.toBeNull();
  });

  it("leaves nothing hidden when unmounted mid-flight", async () => {
    const { items, flyer, select, unmount } = renderGroup();
    await select(1);
    unmount();
    await flush();

    expect(flyer.hasAttribute("data-flying")).toBe(false);
    expect(items[1]?.querySelector("[data-landing]")).toBeNull();
  });

  it("does not fly when motion is reduced", async () => {
    const { flyer, select } = renderGroup({ duration: "0ms" });
    await select(2);

    expect(animations).toHaveLength(0);
    expect(flyer.hasAttribute("data-flying")).toBe(false);
  });

  it("ignores other attributes and its own writes", async () => {
    const { items, select } = renderGroup();
    await select(1);
    const count = animations.length;

    items[0]?.setAttribute("aria-label", "renamed");
    items[1]?.style.setProperty("--i", "2");
    await flush();

    expect(animations).toHaveLength(count);
  });

  it("flies across a short empty gap, not a long one", async () => {
    vi.useFakeTimers({ toFake: ["performance"] });
    const { items, select } = renderGroup();
    items[0]?.removeAttribute("data-pressed");
    await flush();
    vi.advanceTimersByTime(50);
    await select(1);
    expect(flights()).toHaveLength(1);

    items[1]?.removeAttribute("data-pressed");
    await flush();
    vi.advanceTimersByTime(500);
    await select(2);
    expect(flights()).toHaveLength(1);
  });

  it("gives the flyer the target's tone and radius", async () => {
    const { container } = render(() => (
      <SelectionScope marker="pressed" style={{ "--duration-slide": "220ms" }}>
        <Item label="One" pressed />
        <Item
          label="Delete"
          style={{ "--selection-tone": "rgb(200, 0, 0)", "border-radius": "6px" }}
        />
      </SelectionScope>
    ));
    const scope = container.firstElementChild as HTMLElement;
    const items = [...scope.querySelectorAll("button")];
    place(scope, { left: 0, top: 0, width: 200, height: 40 });
    place(items[0] as HTMLElement, { left: 0, top: 0, width: 80, height: 40 });
    place(items[1] as HTMLElement, { left: 80, top: 0, width: 80, height: 40 });
    items[0]?.removeAttribute("data-pressed");
    items[1]?.setAttribute("data-pressed", "");
    await flush();

    const flyer = scope.querySelector<HTMLElement>("[data-selection-flyer]");
    expect(flyer?.style.getPropertyValue("--selection-tone")).toBe("rgb(200, 0, 0)");
    expect(flyer?.style.borderRadius).toBe("6px");
  });

  it("settles on an engine that reports same-value custom property writes", async () => {
    const Real = globalThis.MutationObserver;
    let callbacks = 0;
    globalThis.MutationObserver = class extends Real {
      constructor(callback: MutationCallback) {
        super((records, observer) => {
          if (++callbacks <= 500) callback(records, observer);
        });
      }
    };
    try {
      const { select } = renderGroup();
      await select(1);
      await select(2);
      await flush();
    } finally {
      globalThis.MutationObserver = Real;
    }
    expect(callbacks).toBeLessThan(10);
  });

  it("tells the caller its root through ref", () => {
    let seen: HTMLElement | undefined;
    render(() => (
      <SelectionScope marker="selected" ref={(el) => (seen = el)}>
        <Item label="One" />
      </SelectionScope>
    ));
    expect(seen?.hasAttribute("data-selection-scope")).toBe(true);
  });
});
