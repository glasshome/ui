import { render } from "@solidjs/testing-library";
import { createSignal, flush } from "solid-js";
import { describe, expect, it, onTestFinished } from "vitest";
import { Dock } from "../../src/solid/dock.js";
import { nextFrame } from "../harness/frame";
import { settle } from "../harness/mount";
import { setViewportWidth } from "../viewport.js";

/* Every slot has a dot; the ones past the last page draw nothing and take no input. */
const PAGE_DOTS = '[data-slot="dock-page"]:not([inert])';

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
    const { container } = render(() => (
      <div style={{ width: "400px" }}>
        <Dock items={items(3)} />
      </div>
    ));
    await settle();

    expect(container.querySelectorAll(PAGE_DOTS)).toHaveLength(0);
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
    await settle();
    expect(container.querySelectorAll(PAGE_DOTS).length).toBeGreaterThan(1);
    setBox(1200);
    await setViewportWidth(1000);
    await settle();

    expect(container.querySelectorAll(PAGE_DOTS)).toHaveLength(0);
  });

  it("shows a dot per page once the strip overflows, the first one current", async () => {
    const { container } = render(() => (
      <div style={{ width: `${OVERFLOWING_BOX}px` }}>
        <Dock items={items(12)} />
      </div>
    ));
    await settle();

    const dots = container.querySelectorAll(PAGE_DOTS);
    expect(dots).toHaveLength(3);
    expect(dots[0]?.getAttribute("aria-current")).toBe("true");
    expect(dots[1]?.getAttribute("aria-current")).toBeNull();
  });

  it("snaps the strip instead of free-scrolling it", async () => {
    const { container } = render(() => (
      <div style={{ width: `${OVERFLOWING_BOX}px` }}>
        <Dock items={items(12)} />
      </div>
    ));
    await settle();

    const bar = container.querySelector('[data-slot="dock-bar"]');
    expect(bar?.className).toContain("snap-x");
    expect(container.querySelector('[data-slot="dock-item"]')?.className).toContain("snap-start");
  });

  it.each(["bottom", "left", "right"] as const)(
    "draws a %s dock's pages in its first frame and never moves them after",
    async (placement) => {
      const side = placement !== "bottom";
      const { container } = render(() => (
        <div
          style={{ width: side ? "200px" : `${OVERFLOWING_BOX}px`, height: side ? "340px" : "" }}
        >
          <Dock items={items(12)} placement={placement} />
        </div>
      ));
      const look = () => {
        const box = (slot: string) => {
          const r = container.querySelector(`[data-slot="${slot}"]`)?.getBoundingClientRect();
          return [r?.left, r?.top, r?.width, r?.height].map((n) => Math.round(n ?? 0));
        };
        const drawn = [...container.querySelectorAll('[data-slot="dock-page"]')].filter((dot) => {
          const r = dot.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }).length;
        return { surface: box("dock-surface"), bar: box("dock-bar"), drawn };
      };
      const first = look();
      expect(first.drawn).toBe(3);
      for (let i = 0; i < 4; i++) {
        // per-frame the surface, strip and drawn dots in each of the four frames after mount
        await nextFrame();
        expect(look()).toEqual(first);
      }
    },
  );

  it.each(["bottom", "left", "right"] as const)(
    "draws a paging %s dock's items in its first frame where they stay once the strip scrolls",
    async (placement) => {
      const side = placement !== "bottom";
      const { container } = render(() => (
        <div
          style={{ width: side ? "200px" : `${OVERFLOWING_BOX}px`, height: side ? "340px" : "" }}
        >
          <Dock items={items(12)} placement={placement} />
        </div>
      ));
      const places = () =>
        [...container.querySelectorAll('[data-slot="dock-item"]')].map((item) => {
          const r = item.getBoundingClientRect();
          return [Math.round(r.left), Math.round(r.top)];
        });
      const first = places();
      await settle();

      expect(container.querySelector('[data-slot="dock-bar"]')?.className).toMatch(
        /overflow-[xy]-auto/,
      );
      expect(places()).toEqual(first);
    },
  );
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
    flush();
    expect(flood().hasAttribute("data-hold")).toBe(true);
    expect(flood().style.left).toBe("12px");
    expect(flood().style.width).toMatch(/px$/);
    setHold({ x: 12, y: 8, fired: true });
    flush();
    expect(flood().hasAttribute("data-fired")).toBe(true);
    expect(flood().hasAttribute("data-hold")).toBe(false);
    setHold(null);
    flush();
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
    flush();
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
    flush();
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
    flush();
    expect(lit()).toEqual(["b"]);
    unmount();
  });
});
