import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Dock, type DockPlacement } from "../../src/solid/dock.js";
import { ToggleGroup, ToggleGroupItem } from "../../src/solid/toggle-group.js";
import { frames } from "../frames.js";

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

async function mount(placement: DockPlacement, open: boolean, box = { width: 800, height: 600 }) {
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
  await frames(2);
  const surface = rectOf(view.container.querySelector('[data-slot="dock-surface"]'));
  const companion = rectOf(view.container.querySelector('[data-slot="dock-companion"]'));
  return { view, surface, companion };
}

describe("Dock companion", () => {
  it("sits above a bottom dock", async () => {
    const { surface, companion } = await mount("bottom", true);
    expect(companion.bottom).toBeLessThanOrEqual(surface.top);
    expect(companion.left).toBeGreaterThanOrEqual(surface.left - companion.width);
  });

  for (const placement of ["left", "right"] as const)
    it(`stacks under a ${placement} dock, so the edge it takes keeps its width`, async () => {
      const { surface, companion } = await mount(placement, true);
      expect(companion.top).toBeGreaterThanOrEqual(surface.bottom);
      expect(companion.left).toBeCloseTo(surface.left, 0);
      expect(companion.right).toBeCloseTo(surface.right, 0);
    });

  it("leaves a side dock less height, so the strip pages and the pair stays on screen", async () => {
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
    await frames(3);
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

  it("shows a paging dock only once its pages land, so the dock anyone sees never grows a dot row", async () => {
    const view = render(() => (
      <div class="reduce-motion" style={{ width: `${OVERFLOWING_BOX}px` }}>
        <Dock items={items(12)} />
      </div>
    ));
    const dock = view.container.querySelector<HTMLElement>('[data-slot="dock"]') as HTMLElement;
    const shown: { height: number; dots: boolean }[] = [];
    const unplacedOpacities: string[] = [];
    for (let i = 0; i < 4; i++) {
      await frames(1);
      if (dock.hasAttribute("data-placed"))
        shown.push({
          height: rectOf(dock).height,
          dots: dock.querySelector('[data-slot="dock-pages"]') !== null,
        });
      else unplacedOpacities.push(getComputedStyle(dock).opacity);
    }
    expect(unplacedOpacities.every((opacity) => opacity === "0")).toBe(true);
    expect(shown.length).toBeGreaterThan(0);
    for (const frame of shown) expect(frame).toEqual({ ...shown[0], dots: true });
    await frames(1);
    expect(getComputedStyle(dock).opacity).toBe("1");
  });

  it("pages a narrow dock under an app that watches its size, without a resize loop", async () => {
    const loops: string[] = [];
    const onError = (event: ErrorEvent) => {
      if (event.message.includes("ResizeObserver")) loops.push(event.message);
    };
    window.addEventListener("error", onError);
    const app = new ResizeObserver(() => {});
    try {
      const [open, setOpen] = createSignal(false);
      render(() => (
        <div
          ref={(el) => app.observe(el)}
          class="reduce-motion"
          style={{ width: `${OVERFLOWING_BOX}px` }}
        >
          <Dock
            items={items(12)}
            editing
            onAdd={() => {}}
            companion={
              <button type="button" style={{ "white-space": "nowrap" }}>
                Done
              </button>
            }
            companionOpen={open()}
          />
        </div>
      ));
      await frames(3);
      setOpen(true);
      await frames(4);
      setOpen(false);
      await frames(4);
    } finally {
      app.disconnect();
      window.removeEventListener("error", onError);
    }
    expect(loops).toEqual([]);
  });

  it("takes no room and no input while closed", async () => {
    const { view } = await mount("bottom", false);
    const bare = render(() => <Dock items={items(3)} />);
    await frames(2);
    const height = (root: HTMLElement) => rectOf(root.querySelector('[data-slot="dock"]')).height;
    const reveal = view.container.querySelector('[data-slot="dock-companion-reveal"]');
    expect(rectOf(reveal).height).toBe(0);
    expect(height(view.container)).toBeCloseTo(height(bare.container), 0);
    expect(reveal?.hasAttribute("inert")).toBe(true);
  });
});

describe("Side dock pages", () => {
  it("keep the dock as wide as an unpaged one", async () => {
    const width = async (count: number) => {
      const view = render(() => (
        <div class="flex items-start" style={{ height: `${OVERFLOWING_BOX}px` }}>
          <Dock items={items(count)} placement="left" />
        </div>
      ));
      await frames(2);
      return {
        paged: view.container.querySelector('[data-slot="dock-pages"]') !== null,
        width: rectOf(view.container.querySelector('[data-slot="dock-surface"]')).width,
      };
    };
    const few = await width(2);
    const many = await width(12);
    expect([few.paged, many.paged]).toEqual([false, true]);
    expect(many.width).toBeCloseTo(few.width, 0);
  });
});

describe("Dock lead", () => {
  it("stays in the glass before the strip while the strip pages", async () => {
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
    await frames(2);
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
