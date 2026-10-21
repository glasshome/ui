import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { Dock } from "../../src/solid/dock.js";
import { useFakeTime } from "../../src/testing/index.js";
import { setViewportWidth } from "../viewport.js";

describe("Dock paging", () => {
  const items = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `d${i}`,
      icon: <span />,
      label: `Dashboard ${i}`,
      onClick: () => {},
    }));

  /* Room for five of twelve items at the sm sizes, so three pages. */
  const OVERFLOWING_BOX = 340;

  it("shows no page dots while every item fits", async () => {
    useFakeTime();
    const { container } = render(() => (
      <div style={{ width: "400px" }}>
        <Dock items={items(3)} />
      </div>
    ));
    vi.advanceTimersToNextFrame();

    expect(container.querySelector('[data-slot="dock-pages"]')).toBeNull();
  });

  it("takes the room it has from the box the app gave it, not from its own surface", async () => {
    onTestFinished(() => setViewportWidth(1024));
    // The surface hugs the strip; only the outer box knows what the app allowed.
    const [box, setBox] = createSignal(OVERFLOWING_BOX);
    const { container } = render(() => (
      <div style={{ width: `${box()}px` }}>
        <Dock items={items(10)} />
      </div>
    ));
    await new Promise(requestAnimationFrame);
    expect(container.querySelector<HTMLElement>('[data-slot="dock-bar"]')?.style.width).not.toBe(
      "",
    );
    setBox(1200);
    await setViewportWidth(1000);
    await new Promise(requestAnimationFrame);

    expect(container.querySelector('[data-slot="dock-pages"]')).toBeNull();
    expect(container.querySelector<HTMLElement>('[data-slot="dock-bar"]')?.style.width).toBe("");
  });

  it("shows a dot per page once the strip overflows, the first one current", async () => {
    useFakeTime();
    const { container } = render(() => (
      <div style={{ width: `${OVERFLOWING_BOX}px` }}>
        <Dock items={items(12)} />
      </div>
    ));
    vi.advanceTimersToNextFrame();

    const dots = container.querySelectorAll('[data-slot="dock-pages"] button');
    expect(dots).toHaveLength(3);
    expect(dots[0]?.getAttribute("aria-current")).toBe("true");
    expect(dots[1]?.getAttribute("aria-current")).toBeNull();
  });

  it("snaps the strip instead of free-scrolling it", async () => {
    useFakeTime();
    const { container } = render(() => (
      <div style={{ width: `${OVERFLOWING_BOX}px` }}>
        <Dock items={items(12)} />
      </div>
    ));
    vi.advanceTimersToNextFrame();

    const bar = container.querySelector('[data-slot="dock-bar"]');
    expect(bar?.className).toContain("snap-x");
    expect(container.querySelector('[data-slot="dock-item"]')?.className).toContain("snap-start");
  });
});

describe("Dock hold", () => {
  const two = [
    { id: "a", icon: <span />, label: "A", onClick: () => {} },
    { id: "b", icon: <span />, label: "B", onClick: () => {} },
  ];

  it("grows the flood while held, dissolves it once fired, and drains where it grew", () => {
    const [hold, setHold] = createSignal<{ x: number; y: number; fired: boolean } | null>(null);
    const { container } = render(() => <Dock items={two} hold={hold()} />);
    const flood = () => container.querySelector('[data-slot="dock-flood"]') as HTMLElement;

    expect(flood().hasAttribute("data-hold")).toBe(false);
    setHold({ x: 12, y: 8, fired: false });
    expect(flood().hasAttribute("data-hold")).toBe(true);
    expect(flood().style.left).toBe("12px");
    expect(flood().style.width).toMatch(/px$/);
    setHold({ x: 12, y: 8, fired: true });
    expect(flood().hasAttribute("data-fired")).toBe(true);
    expect(flood().hasAttribute("data-hold")).toBe(false);
    setHold(null);
    expect(flood().hasAttribute("data-fired")).toBe(false);
    expect(flood().style.left).toBe("12px");
  });
});

describe("Dock mode rim", () => {
  const two = [
    { id: "a", icon: <span />, label: "A", onClick: () => {} },
    { id: "b", icon: <span />, label: "B", onClick: () => {} },
  ];

  it("orbits the rim only while a mode is on", () => {
    const [on, setOn] = createSignal(false);
    const { container } = render(() => <Dock items={two} glow={on()} />);
    expect(container.querySelector('[data-slot="dock-glow"]')).toBeNull();
    setOn(true);
    expect(container.querySelector('[data-slot="dock-glow"]')).not.toBeNull();
  });
});

describe("Dock drop target", () => {
  it("names each item and marks the one a drag would land on", () => {
    const [target, setTarget] = createSignal<string | null>(null);
    const { container, unmount } = render(() => (
      <Dock
        items={["a", "b"].map((id) => ({
          id,
          icon: <span />,
          label: id,
          isDropTarget: id === target(),
        }))}
      />
    ));
    const marked = () =>
      [...container.querySelectorAll("[data-drop-target]")].map((e) =>
        e.getAttribute("data-dock-id"),
      );
    expect(marked()).toEqual([]);
    setTarget("b");
    expect(marked()).toEqual(["b"]);
    // Unmounting clears the dock's overflow timer, which would otherwise fire after teardown.
    unmount();
  });

  it("lights the active item, and lends the light to a drop target while a drag is over it", () => {
    const [target, setTarget] = createSignal<string | null>(null);
    const { container, unmount } = render(() => (
      <Dock
        items={["a", "b"].map((id) => ({
          id,
          icon: <span />,
          label: id,
          isActive: id === "a",
          isDropTarget: id === target(),
        }))}
      />
    ));
    const lit = () =>
      [...container.querySelectorAll("[data-lit]")].map((e) => e.getAttribute("data-dock-id"));
    for (const item of container.querySelectorAll('[data-slot="dock-item"]')) {
      expect(item.firstElementChild?.getAttribute("data-on")).toBe("lit");
    }
    expect(lit()).toEqual(["a"]);
    setTarget("b");
    expect(lit()).toEqual(["b"]);
    unmount();
  });
});
