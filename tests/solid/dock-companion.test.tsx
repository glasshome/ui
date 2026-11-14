import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Dock, type DockPlacement } from "../../src/solid/dock.js";
import { ToggleGroup, ToggleGroupItem } from "../../src/solid/toggle-group.js";
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

function mount(placement: DockPlacement, open: boolean, box = { width: 800, height: 600 }) {
  useFakeTime();
  const view = render(() => (
    <div
      class="reduce-motion flex items-start"
      style={{ width: `${box.width}px`, height: `${box.height}px` }}
    >
      <Dock
        items={items(3)}
        placement={placement}
        companion={
          <button type="button" style={{ "white-space": "nowrap" }}>
            Done for the day, every widget placed
          </button>
        }
        companionOpen={open}
      />
    </div>
  ));
  vi.advanceTimersToNextFrame();
  const surface = rectOf(view.container.querySelector('[data-slot="dock-surface"]'));
  const companion = rectOf(view.container.querySelector('[data-slot="dock-companion"]'));
  return { view, surface, companion };
}

describe("Dock companion", () => {
  it("sits above a bottom dock", () => {
    const { surface, companion } = mount("bottom", true);
    expect(companion.bottom).toBeLessThanOrEqual(surface.top);
    expect(companion.left).toBeGreaterThanOrEqual(surface.left - companion.width);
  });

  for (const placement of ["left", "right"] as const)
    it(`stacks under a ${placement} dock, so the edge it takes keeps its width`, () => {
      const { surface, companion } = mount(placement, true);
      expect(companion.top).toBeGreaterThanOrEqual(surface.bottom);
      expect(companion.left).toBeCloseTo(surface.left, 0);
      expect(companion.right).toBeCloseTo(surface.right, 0);
    });

  it("leaves a side dock less height, so the strip pages and the pair stays on screen", () => {
    useFakeTime();
    const view = render(() => (
      <div class="reduce-motion" style={{ width: "800px", height: `${OVERFLOWING_BOX}px` }}>
        <Dock
          items={items(6)}
          placement="left"
          companion={
            <button type="button" style={{ width: "40px", height: "160px" }}>
              Done
            </button>
          }
          companionOpen
        />
      </div>
    ));
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();
    const companion = rectOf(view.container.querySelector('[data-slot="dock-companion"]'));
    const dock = rectOf(view.container.querySelector('[data-slot="dock"]'));
    expect(view.container.querySelector('[data-slot="dock-pages"]')).not.toBeNull();
    const surface = rectOf(view.container.querySelector('[data-slot="dock-surface"]'));
    const bar = rectOf(view.container.querySelector('[data-slot="dock-bar"]'));
    expect(companion.bottom).toBeLessThanOrEqual(dock.bottom + 1);
    expect(bar.bottom).toBeLessThanOrEqual(surface.bottom + 1);
    const cut = Array.from(
      view.container.querySelectorAll('[data-slot="dock-item"]'),
      rectOf,
    ).filter((item) => item.top < bar.bottom - 1 && item.bottom > bar.bottom + 1);
    expect(cut).toEqual([]);
  });

  it("takes no room and no input while closed", () => {
    const { view } = mount("bottom", false);
    const bare = render(() => <Dock items={items(3)} />);
    vi.advanceTimersToNextFrame();
    const height = (root: HTMLElement) => rectOf(root.querySelector('[data-slot="dock"]')).height;
    const reveal = view.container.querySelector('[data-slot="dock-companion-reveal"]');
    expect(rectOf(reveal).height).toBe(0);
    expect(height(view.container)).toBeCloseTo(height(bare.container), 0);
    expect(reveal?.hasAttribute("inert")).toBe(true);
  });
});

describe("Side dock pages", () => {
  it("keep the dock as wide as an unpaged one", () => {
    useFakeTime();
    const width = (count: number) => {
      const view = render(() => (
        <div class="flex items-start" style={{ height: `${OVERFLOWING_BOX}px` }}>
          <Dock items={items(count)} placement="left" />
        </div>
      ));
      vi.advanceTimersToNextFrame();
      return {
        paged: view.container.querySelector('[data-slot="dock-pages"]') !== null,
        width: rectOf(view.container.querySelector('[data-slot="dock-surface"]')).width,
      };
    };
    const few = width(2);
    const many = width(12);
    expect([few.paged, many.paged]).toEqual([false, true]);
    expect(many.width).toBeCloseTo(few.width, 0);
  });
});

describe("Dock lead", () => {
  it("stays in the glass before the strip while the strip pages", () => {
    useFakeTime();
    const view = render(() => (
      <div style={{ width: `${OVERFLOWING_BOX}px` }}>
        <Dock
          items={items(12)}
          lead={
            <button type="button" style={{ width: "60px", height: "40px" }}>
              Home
            </button>
          }
        />
      </div>
    ));
    vi.advanceTimersToNextFrame();
    const lead = rectOf(view.container.querySelector('[data-slot="dock-lead"]'));
    const bar = rectOf(view.container.querySelector('[data-slot="dock-bar"]'));
    const surface = rectOf(view.container.querySelector('[data-slot="dock-surface"]'));
    expect(view.container.querySelector('[data-slot="dock-pages"]')).not.toBeNull();
    expect(lead.right).toBeLessThanOrEqual(bar.left);
    expect(bar.right).toBeLessThanOrEqual(surface.right + 1);
    expect(surface.width).toBeLessThanOrEqual(OVERFLOWING_BOX);
  });
});

describe("ToggleGroup orientation", () => {
  it("stacks its segments in a column when vertical", () => {
    const view = render(() => (
      <ToggleGroup orientation="vertical" value="b">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>
    ));
    const [a, b, c] = Array.from(
      view.container.querySelectorAll('[data-slot="toggle-group-item"]'),
      rectOf,
    );
    expect(b?.top).toBeGreaterThanOrEqual(a?.bottom ?? 0);
    expect(c?.top).toBeGreaterThanOrEqual(b?.bottom ?? 0);
    expect(Math.abs((a?.left ?? 0) - (c?.left ?? 0))).toBeLessThan(1);
  });
});
