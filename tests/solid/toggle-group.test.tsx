import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toggle } from "../../src/solid/toggle.js";
import { ToggleGroup, ToggleGroupItem } from "../../src/solid/toggle-group.js";
import { useFakeTime } from "../harness/fake-time.js";

afterEach(cleanup);

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

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("ToggleGroup", () => {
  it("leaves the hover fill to the standalone Toggle, so no square paints behind the indicator", () => {
    const standalone = render(() => <Toggle>Notify</Toggle>);
    expect(
      standalone.container.querySelector<HTMLElement>('[data-slot="toggle"]')?.className,
    ).toContain("not-data-[pressed]:hover:bg-muted");
    cleanup();

    const { container } = render(() => (
      <ToggleGroup value="left">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
    ));
    const items = container.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]');
    expect(items).toHaveLength(2);
    for (const item of items) {
      // `:not([data-pressed]):hover` (0,3,0) outranks the group's own
      // `hover:bg-transparent` (0,2,0), so the fill must never reach an item.
      expect(item.className).not.toContain("hover:bg-muted");
      expect(item.className).toContain("hover:text-(--material-accent)");
    }
  });

  it("gives a multi-select segment hover feedback without a fill", () => {
    const { container } = render(() => (
      <ToggleGroup multiple value={["left"]}>
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
    ));
    // No selection highlight paints this group, so each pressed segment keeps its
    // own fill, and the unpressed ones still have to answer the pointer.
    expect(container.querySelector("[data-selection-highlight]")).toBeNull();
    expect(container.querySelector("[data-selection-scope]")).toBeNull();
    for (const item of container.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]')) {
      expect(item.className).toContain("not-data-[pressed]:hover:text-(--material-accent)");
      expect(item.className).not.toContain("hover:bg-muted");
      expect(item.className).toContain("data-[pressed]:bg-muted");
    }
  });

  it("gives every segment its own highlight, shown by Kobalte's pressed marker", () => {
    const { container } = render(() => (
      <ToggleGroup value="left">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
    ));
    const items = container.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]');
    for (const item of items) {
      const highlight = item.firstElementChild;
      expect(highlight?.getAttribute("data-on")).toBe("pressed");
      expect(highlight?.hasAttribute("data-selection-highlight")).toBe(true);
    }
    expect(items[0]?.hasAttribute("data-pressed")).toBe(true);
  });

  it("paints the highlight in the group's tone", () => {
    const { container } = render(() => (
      <ToggleGroup value="left" tone="oklch(0.66 0.2 30)">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
    ));
    const scope = container.querySelector<HTMLElement>("[data-selection-scope]");
    expect(scope?.style.getPropertyValue("--selection-tone")).toBe("oklch(0.66 0.2 30)");
  });

  it("builds a segment's content once", () => {
    let built = 0;
    const Label = () => {
      built += 1;
      return <span>Left</span>;
    };
    render(() => (
      <ToggleGroup value="left">
        <ToggleGroupItem value="left">
          <Label />
        </ToggleGroupItem>
      </ToggleGroup>
    ));
    expect(built).toBe(1);
  });

  it("still renders a segment given as a function of its pressed state", () => {
    const { container } = render(() => (
      <ToggleGroup value="left">
        <ToggleGroupItem value="left">
          {(state) => (state.pressed() ? "On" : "Off")}
        </ToggleGroupItem>
      </ToggleGroup>
    ));
    const item = container.querySelector<HTMLElement>('[data-slot="toggle-group-item"]');
    expect(item?.textContent).toBe("On");
    expect(item?.firstElementChild?.hasAttribute("data-selection-highlight")).toBe(true);
  });

  it("in scroll mode keeps one row and still picks on a tap", async () => {
    let picked: string | null = "left";
    const view = render(() => (
      <ToggleGroup scroll value="left" onChange={(v: string | null) => (picked = v)}>
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
    ));
    const root = view.container.querySelector<HTMLElement>('[data-slot="toggle-group"]');
    expect(root?.hasAttribute("data-scroll")).toBe(true);
    expect(root?.className).toContain("overflow-x-auto");
    expect(root?.className).not.toContain("flex-wrap");
    view.getByRole("button", { name: "Right" }).click();
    await flush();
    expect(picked).toBe("right");
  });

  it("in scroll mode brings a pressed item past the edge into view and marks the clipped edge", async () => {
    useFakeTime();
    const view = render(() => (
      <ToggleGroup scroll value="far">
        <ToggleGroupItem value="near">Near</ToggleGroupItem>
        <ToggleGroupItem value="far">Far</ToggleGroupItem>
      </ToggleGroup>
    ));
    const root = view.container.querySelector<HTMLElement>('[data-slot="toggle-group"]');
    if (!root) throw new Error("no toggle group");
    Object.defineProperty(root, "scrollWidth", { value: 400 });
    Object.defineProperty(root, "clientWidth", { value: 200 });
    stubRect(root, { left: 0, top: 0, width: 200, height: 40 });
    const far = view.getByRole("button", { name: "Far" });
    stubRect(far, { left: 300, top: 0, width: 80, height: 40 });
    let scrolledTo: number | undefined;
    root.scrollTo = ((opts: ScrollToOptions) => {
      scrolledTo = opts.left;
    }) as typeof root.scrollTo;

    vi.advanceTimersToNextFrame();

    expect(scrolledTo).toBe(240);
    expect(root.hasAttribute("data-clip-end")).toBe(true);
    expect(root.hasAttribute("data-clip-start")).toBe(false);
  });
});
