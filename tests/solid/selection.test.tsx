import { cleanup, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SelectionHighlight, SelectionScope } from "../../src/solid/selection.js";
import { useFakeTime } from "../../src/testing/index.js";

const realAnimate = Object.getOwnPropertyDescriptor(Element.prototype, "animate");
let seen = new Set<Animation>();

beforeEach(() => {
  seen = new Set();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  // test-change-ok puts back the real animate after the one test that needs it to throw
  if (realAnimate) Object.defineProperty(Element.prototype, "animate", realAnimate);
});

async function flush() {
  for (let i = 0; i < 4; i++) await Promise.resolve();
}

function record() {
  for (const a of document.getAnimations()) {
    if (!(a instanceof CSSAnimation || a instanceof CSSTransition)) seen.add(a);
  }
}

const animations = () => [...seen];
const keyframesOf = (a: Animation) => (a.effect as KeyframeEffect).getKeyframes();
const translateOf = (a: Animation) => keyframesOf(a)[0]?.translate;
const flights = () => animations().filter((a) => translateOf(a) !== undefined);

function asTranslate(value: string) {
  const probe = document.createElement("div");
  probe.style.translate = value;
  return probe.style.translate;
}

function midFlight(flyer: HTMLElement) {
  for (const a of flyer.getAnimations()) {
    a.currentTime = Number(a.effect?.getTiming().duration) / 2;
  }
}

function centreIn(scope: HTMLElement, el: Element) {
  const rect = el.getBoundingClientRect();
  return rect.left + rect.width / 2 - scope.getBoundingClientRect().left;
}

const sized = (width: number): JSX.CSSProperties => ({
  flex: "none",
  width: `${width}px`,
  height: "40px",
  padding: "0",
  border: "0",
  margin: "0",
  "box-sizing": "border-box",
});

function Item(props: { label: string; pressed?: boolean; style?: JSX.CSSProperties }) {
  return (
    <button type="button" data-pressed={props.pressed ? "" : undefined} style={props.style}>
      <SelectionHighlight />
      {props.label}
    </button>
  );
}

function renderGroup(
  options: {
    duration?: string;
    widths?: [number, number, number];
    scope?: JSX.CSSProperties;
    ancestor?: JSX.CSSProperties;
  } = {},
) {
  const [a, b, c] = options.widths ?? [80, 80, 140];
  const { container, unmount } = render(() => (
    <div style={options.ancestor}>
      <SelectionScope
        marker="pressed"
        style={{
          display: "flex",
          width: "300px",
          height: "40px",
          "--duration-slide": options.duration ?? "220ms",
          ...options.scope,
        }}
      >
        <Item label="One" pressed style={sized(a)} />
        <Item label="Two" style={sized(b)} />
        <Item label="Three wide" style={sized(c)} />
      </SelectionScope>
    </div>
  ));
  const scope = container.querySelector<HTMLElement>("[data-selection-scope]");
  if (!scope) throw new Error("no scope");
  const items = [...scope.querySelectorAll("button")];
  const flyer = scope.querySelector<HTMLElement>("[data-selection-flyer]");
  if (!flyer) throw new Error("no flyer");
  const select = async (index: number) => {
    for (const item of items) item.removeAttribute("data-pressed");
    items[index]?.setAttribute("data-pressed", "");
    await flush();
    record();
  };
  return { scope, items, flyer, select, unmount };
}

function countWakes(target: Node) {
  let callbacks = 0;
  const records: MutationRecord[] = [];
  const observer = new MutationObserver((batch) => {
    callbacks += 1;
    records.push(...batch);
  });
  observer.observe(target, { subtree: true, attributes: true, attributeOldValue: true });
  return {
    callbacks: () => callbacks,
    records: () => [...records, ...observer.takeRecords()],
    stop: () => observer.disconnect(),
  };
}

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
    record();
    expect(animations()).toHaveLength(0);

    await select(2);

    expect(flights()).toHaveLength(1);
    expect(flyer.hasAttribute("data-flying")).toBe(true);
    // centres: 40 to 230, sizes 80 to 140; placed by translate, which lays nothing out
    expect(translateOf(flights()[0] as Animation)).toBe(asTranslate("-30px 0px"));
    expect(keyframesOf(flights()[0] as Animation)[1]?.translate).toBe(asTranslate("160px 0px"));
    expect(flyer.style.translate).toBe(asTranslate("160px 0px"));
    expect(flyer.style.width).toBe("140px");
    expect(flyer.style.left).toBe("");
    const landing = items[2]?.querySelector("[data-selection-highlight]");
    expect(landing?.hasAttribute("data-landing")).toBe(true);
  });

  it("starts a redirected flight from where the flyer is", async () => {
    const { scope, flyer, select } = renderGroup({ widths: [80, 80, 220] });
    await select(2);
    midFlight(flyer);
    expect(centreIn(scope, flyer)).toBe(155);

    await select(1);

    expect(flights()).toHaveLength(2);
    // flyer centre 155 to item centre 120, whose box starts at 80
    expect(translateOf(flights()[1] as Animation)).toBe(asTranslate("115px 0px"));
  });

  it("hands off to the resting highlight when the flight finishes", async () => {
    const { items, flyer, select } = renderGroup();
    await select(1);
    for (const a of animations()) a.finish();
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
    const first = animations();
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

    expect(animations()).toHaveLength(0);
    expect(flyer.hasAttribute("data-flying")).toBe(false);
  });

  it("ignores other attributes and its own writes", async () => {
    const { items, select } = renderGroup();
    await select(1);
    const count = animations().length;

    items[0]?.setAttribute("aria-label", "renamed");
    items[1]?.style.setProperty("--i", "2");
    await flush();
    record();

    expect(animations()).toHaveLength(count);
  });

  it("flies across a short empty gap, not a long one", async () => {
    useFakeTime({ toFake: ["performance"] });
    const { items, select } = renderGroup();
    items[0]?.removeAttribute("data-pressed");
    await flush();
    await vi.advanceTimersByTimeAsync(50);
    await select(1);
    expect(flights()).toHaveLength(1);

    items[1]?.removeAttribute("data-pressed");
    await flush();
    await vi.advanceTimersByTimeAsync(500);
    await select(2);
    expect(flights()).toHaveLength(1);
  });

  it("starts from where the flyer was when the pointer crosses a gap mid-flight", async () => {
    useFakeTime({ toFake: ["performance"] });
    const { scope, items, flyer, select } = renderGroup();
    await select(1);
    midFlight(flyer);
    expect(centreIn(scope, flyer)).toBe(80);
    items[1]?.removeAttribute("data-pressed");
    await flush();
    await vi.advanceTimersByTimeAsync(20);
    await select(2);

    // flyer centre 80 to item centre 230, whose box starts at 160
    expect(translateOf(flights()[1] as Animation)).toBe(asTranslate("10px 0px"));
  });

  it("leaves no highlight hidden when the flight cannot start", async () => {
    const { items, flyer, select } = renderGroup();
    Element.prototype.animate = () => {
      throw new Error("no animations here");
    };
    await select(1);

    expect(flyer.hasAttribute("data-flying")).toBe(false);
    expect(items[1]?.querySelector("[data-landing]")).toBeNull();
  });

  it("places the flyer in the content of a scope that scrolls", async () => {
    const { scope, items, flyer, select } = renderGroup({
      widths: [80, 130, 140],
      scope: { overflow: "hidden" },
    });
    scope.scrollLeft = 50;
    expect(centreIn(scope, items[2] as HTMLElement)).toBe(230);
    await select(2);

    // item 2 starts 160px into the visible box, 210px into the scrolled content
    expect(flyer.style.translate).toBe(asTranslate("210px 0px"));
    expect(items[2]).toBeDefined();
  });

  it("lands in layout pixels while an ancestor is mid-zoom", async () => {
    const { scope, flyer, select } = renderGroup({ ancestor: { scale: "0.9" } });
    expect(scope.getBoundingClientRect().width).toBeCloseTo(270);
    await select(2);

    expect(flyer.style.translate).toBe(asTranslate("160px 0px"));
    expect(flyer.style.width).toBe("140px");
  });

  it("wakes only for its marker", async () => {
    const { scope, items, flyer } = renderGroup();
    await flush();
    const wakes = countWakes(scope);
    items[1]?.setAttribute("aria-label", "renamed");
    items[1]?.style.setProperty("--glass-tone", "red");
    await flush();
    record();
    const records = wakes.records();
    wakes.stop();

    expect(records.map((r) => [r.target, r.attributeName])).toEqual([
      [items[1], "aria-label"],
      [items[1], "style"],
    ]);
    expect(animations()).toHaveLength(0);
    expect(flyer.hasAttribute("data-flying")).toBe(false);
  });

  it("flies to the item when a part inside it carries the marker too", async () => {
    const { items } = renderGroup();
    const part = document.createElement("span");
    items[2]?.append(part);
    items[0]?.removeAttribute("data-pressed");
    items[2]?.setAttribute("data-pressed", "");
    part.setAttribute("data-pressed", "");
    await flush();
    record();

    expect(flights()).toHaveLength(1);
  });

  it("gives the flyer the target's tone and radius", async () => {
    const { container } = render(() => (
      <SelectionScope
        marker="pressed"
        style={{ display: "flex", width: "200px", height: "40px", "--duration-slide": "220ms" }}
      >
        <Item label="One" pressed style={sized(80)} />
        <Item
          label="Delete"
          style={{ ...sized(80), "--selection-tone": "rgb(200, 0, 0)", "border-radius": "6px" }}
        />
      </SelectionScope>
    ));
    const scope = container.firstElementChild as HTMLElement;
    const items = [...scope.querySelectorAll("button")];
    items[0]?.removeAttribute("data-pressed");
    items[1]?.setAttribute("data-pressed", "");
    await flush();

    const flyer = scope.querySelector<HTMLElement>("[data-selection-flyer]");
    expect(flyer?.style.getPropertyValue("--selection-tone")).toBe("rgb(200, 0, 0)");
    expect(flyer?.style.getPropertyValue("--selection-radius")).toBe("6px");
    expect(flyer?.style.borderRadius).toBe("");
  });

  it("settles on an engine that reports same-value custom property writes", async () => {
    const { scope, select } = renderGroup();
    const wakes = countWakes(scope);
    await select(1);
    await select(2);
    await flush();
    wakes.stop();
    expect(wakes.callbacks()).toBeLessThan(10);
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
