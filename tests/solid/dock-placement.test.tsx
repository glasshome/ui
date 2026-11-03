import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Dock, type DockPlacement } from "../../src/solid/dock.js";
import { useFakeTime } from "../../src/testing/index.js";

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `d${i}`,
    icon: <span />,
    label: `Dashboard ${i}`,
    onClick: () => {},
  }));

/* Room for five of twelve items at the sm sizes, so three pages. */
const OVERFLOWING_BOX = 340;

const rectOf = (el: Element | null | undefined) => el?.getBoundingClientRect() as DOMRect;

/** An item is on the page the strip shows when its box sits inside the strip's along its axis. */
function insideStrip(container: HTMLElement, id: string, axis: "x" | "y"): boolean {
  const bar = rectOf(container.querySelector('[data-slot="dock-bar"]'));
  const item = rectOf(container.querySelector(`[data-dock-id="${id}"]`));
  return axis === "x"
    ? item.left >= bar.left - 1 && item.right <= bar.right + 1
    : item.top >= bar.top - 1 && item.bottom <= bar.bottom + 1;
}

/** Smooth scrolling runs on the browser's own clock; the event says when it landed. */
const scrolled = (el: HTMLElement) =>
  new Promise<void>((resolve) => el.addEventListener("scrollend", () => resolve(), { once: true }));

function mountSide(placement: DockPlacement, count: number, height = 600) {
  useFakeTime();
  const view = render(() => (
    <div style={{ height: `${height}px`, width: "200px" }}>
      <Dock items={items(count)} placement={placement} />
    </div>
  ));
  vi.advanceTimersToNextFrame();
  return view;
}

describe("Dock placement", () => {
  it("lays items in a column on a side edge and says where it sits", () => {
    const { container } = mountSide("left", 3);
    const dock = container.querySelector('[data-slot="dock"]');
    expect(dock?.getAttribute("data-placement")).toBe("left");
    const rects = [...container.querySelectorAll('[data-slot="dock-item"]')].map(rectOf);
    expect(rects).toHaveLength(3);
    expect(rects[0]?.left).toBe(rects[1]?.left);
    expect(rects[1]?.top).toBeGreaterThan(rects[0]?.top ?? 0);
  });

  it("keeps the bottom dock a row", () => {
    useFakeTime();
    const { container } = render(() => (
      <div style={{ width: "400px" }}>
        <Dock items={items(3)} />
      </div>
    ));
    vi.advanceTimersToNextFrame();
    const rects = [...container.querySelectorAll('[data-slot="dock-item"]')].map(rectOf);
    expect(container.querySelector('[data-slot="dock"]')?.getAttribute("data-placement")).toBe(
      "bottom",
    );
    expect(rects[0]?.top).toBe(rects[1]?.top);
    expect(rects[1]?.left).toBeGreaterThan(rects[0]?.left ?? 0);
  });

  it("pages a side dock vertically, one dot per page, the first one current", () => {
    const { container } = mountSide("left", 12, OVERFLOWING_BOX);
    const bar = container.querySelector<HTMLElement>('[data-slot="dock-bar"]');
    expect(bar?.className).toContain("snap-y");
    expect((bar?.scrollHeight ?? 0) > (bar?.clientHeight ?? 0)).toBe(true);
    const dots = container.querySelectorAll('[data-slot="dock-pages"] button');
    expect(dots).toHaveLength(3);
    expect(dots[0]?.getAttribute("aria-current")).toBe("true");
  });

  it("draws the dot column on the inner edge, inside the glass", () => {
    const left = mountSide("left", 12, OVERFLOWING_BOX);
    const leftBar = rectOf(left.container.querySelector('[data-slot="dock-bar"]'));
    const leftDots = rectOf(left.container.querySelector('[data-slot="dock-pages"]'));
    const leftSurface = rectOf(left.container.querySelector('[data-slot="dock-surface"]'));
    expect(leftDots.left).toBeGreaterThanOrEqual(leftBar.right);
    expect(leftDots.right).toBeLessThanOrEqual(leftSurface.right + 0.5);
    left.unmount();

    const right = mountSide("right", 12, OVERFLOWING_BOX);
    const rightBar = rectOf(right.container.querySelector('[data-slot="dock-bar"]'));
    const rightDots = rectOf(right.container.querySelector('[data-slot="dock-pages"]'));
    expect(rightDots.right).toBeLessThanOrEqual(rightBar.left);
    right.unmount();
  });

  it("turns to a page when its dot is pressed", async () => {
    const { container } = render(() => (
      <div style={{ height: `${OVERFLOWING_BOX}px`, width: "200px" }}>
        <Dock items={items(12)} placement="right" />
      </div>
    ));
    await new Promise(requestAnimationFrame);
    const bar = container.querySelector<HTMLElement>('[data-slot="dock-bar"]') as HTMLElement;
    const dots = container.querySelectorAll<HTMLElement>('[data-slot="dock-pages"] button');
    const turned = scrolled(bar);
    dots[1]?.click();
    await turned;
    expect(bar.scrollTop).toBeGreaterThan(0);
    expect(dots[1]?.getAttribute("aria-current")).toBe("true");
  });

  it("sits flush and full height when docked on a side edge", () => {
    useFakeTime();
    const { container } = render(() => (
      <div style={{ height: "600px", width: "200px" }}>
        <Dock items={items(3)} placement="left" dockMode="docked" />
      </div>
    ));
    vi.advanceTimersToNextFrame();
    const surface = container.querySelector<HTMLElement>('[data-slot="dock-surface"]');
    expect(rectOf(surface).height).toBe(600);
    expect(getComputedStyle(surface as Element).borderTopLeftRadius).toBe("0px");
  });
});

describe("Dock arrival", () => {
  it("glows an arrived item once and leaves the others alone", () => {
    const [arrived, setArrived] = createSignal<string[]>([]);
    useFakeTime();
    const { container } = render(() => (
      <div style={{ width: "400px" }}>
        <Dock items={items(3)} arrivedIds={arrived()} />
      </div>
    ));
    vi.advanceTimersToNextFrame();
    expect(container.querySelector('[data-slot="dock-item-arrival"]')).toBeNull();

    setArrived(["d1"]);
    const marked = [...container.querySelectorAll("[data-arrived]")].map((e) =>
      e.getAttribute("data-dock-id"),
    );
    expect(marked).toEqual(["d1"]);
    const glow = container.querySelector<HTMLElement>('[data-slot="dock-item-arrival"]');
    expect(glow?.getAnimations().length).toBe(1);
    expect(glow?.getAnimations()[0]?.effect?.getTiming().iterations).toBe(1);
  });

  it("turns the dock to the page an arrived item sits on", async () => {
    const [arrived, setArrived] = createSignal<string[]>([]);
    const { container } = render(() => (
      <div style={{ width: `${OVERFLOWING_BOX}px` }}>
        <Dock items={items(12)} arrivedIds={arrived()} />
      </div>
    ));
    await new Promise(requestAnimationFrame);
    const bar = container.querySelector<HTMLElement>('[data-slot="dock-bar"]') as HTMLElement;
    expect(insideStrip(container, "d11", "x")).toBe(false);

    const turned = scrolled(bar);
    setArrived(["d11"]);
    await turned;
    expect(insideStrip(container, "d11", "x")).toBe(true);
  });

  it("turns a side dock to the arrived item's page too", async () => {
    const [arrived, setArrived] = createSignal<string[]>([]);
    const { container } = render(() => (
      <div style={{ height: `${OVERFLOWING_BOX}px`, width: "200px" }}>
        <Dock items={items(12)} placement="left" arrivedIds={arrived()} />
      </div>
    ));
    await new Promise(requestAnimationFrame);
    const bar = container.querySelector<HTMLElement>('[data-slot="dock-bar"]') as HTMLElement;
    const turned = scrolled(bar);
    setArrived(["d11"]);
    await turned;
    expect(insideStrip(container, "d11", "y")).toBe(true);
  });
});
