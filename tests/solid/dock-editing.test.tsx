import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cdp, userEvent } from "vitest/browser";
import { Dock, type DockItem } from "../../src/solid/dock.js";

const items = (n: number, onClick: () => void = () => {}): DockItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `d${i}`,
    icon: <span />,
    label: `Dashboard ${i}`,
    onClick,
  }));

const OVERFLOWING_BOX = 340;

/** Real input waits for a target to hold still; a swaying item never does, so input tests run with motion off, as a person with reduced motion would. */
const still = (dock: () => JSX.Element, style: JSX.CSSProperties = {}) =>
  render(() => (
    <div class="reduce-motion" style={style}>
      {dock()}
    </div>
  ));

const byId = (container: HTMLElement, id: string) =>
  container.querySelector(`[data-dock-id="${id}"]`) as HTMLElement;

const scrolled = (el: HTMLElement) =>
  new Promise<void>((resolve) => el.addEventListener("scrollend", () => resolve(), { once: true }));

/** A held mouse button, for the moments a test must stop mid-drag. The test page lives in a scaled iframe; CDP input is in the outer page's coordinates. */
const hand = {
  x: 0,
  y: 0,
  down: false,
  send(type: "mousePressed" | "mouseMoved" | "mouseReleased") {
    return cdp().send("Input.dispatchMouseEvent", {
      type,
      x: this.x,
      y: this.y,
      button: "left",
      buttons: this.down && type !== "mouseReleased" ? 1 : 0,
      clickCount: type === "mouseMoved" ? 0 : 1,
    });
  },
  at(el: Element, dx = 0) {
    const rect = el.getBoundingClientRect();
    const frame = window.frameElement?.getBoundingClientRect();
    const scale = frame ? frame.width / window.innerWidth : 1;
    this.x = (frame?.left ?? 0) + (rect.left + rect.width / 2 + dx) * scale;
    this.y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  },
  async moveTo(el: Element, dx = 0) {
    this.at(el, dx);
    await this.send("mouseMoved");
  },
  async press() {
    this.down = true;
    await this.send("mousePressed");
  },
  async release() {
    await this.send("mouseReleased");
    this.down = false;
  },
  async drag(from: Element, to: Element) {
    await this.moveTo(from);
    await this.press();
    await this.moveTo(to);
    await this.release();
  },
};

/* Real input hits what is on screen: a dock left by an earlier test would push this one below the fold. */
afterEach(async () => {
  if (hand.down) await hand.release();
  cleanup();
});

describe("Dock edit chrome", () => {
  it("shows a remove button only on items that can leave", () => {
    const list: DockItem[] = [...items(2), { ...items(1)[0], id: "settings", removable: false }];
    const { container } = render(() => (
      <Dock items={list} editing onRemove={() => {}} onReorder={() => {}} />
    ));
    expect(container.querySelectorAll('[data-slot="dock-item-remove"]')).toHaveLength(2);
    expect(
      container.querySelector('[data-slot="dock-cell"]:last-child [data-slot="dock-item-remove"]'),
    ).toBeNull();
  });

  it("shows no edit chrome when not editing", () => {
    const { container } = render(() => (
      <Dock items={items(2)} onRemove={() => {}} onAdd={() => {}} onMovePlacement={() => {}} />
    ));
    expect(container.querySelector('[data-slot="dock-item-remove"]')).toBeNull();
    expect(container.querySelector('[data-slot="dock-add"]')).toBeNull();
    expect(container.querySelector('[data-slot="dock-grip"]')).toBeNull();
  });

  it("removes through the badge and leaves the item's own press alone", async () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    still(() => <Dock items={items(3, onClick)} editing onRemove={onRemove} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove Dashboard 1" }));
    expect(onRemove).toHaveBeenCalledExactlyOnceWith("d1");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("still presses an item while editing", async () => {
    const onClick = vi.fn();
    const { container } = still(() => <Dock items={items(2, onClick)} editing />);
    await userEvent.click(byId(container, "d0"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("ends the strip with a dashed slot that adds", async () => {
    const onAdd = vi.fn();
    const { container } = still(() => <Dock items={items(3)} editing onAdd={onAdd} />);
    const slot = screen.getByRole("button", { name: "Add to dock" });
    const cells = [...container.querySelectorAll('[data-slot="dock-cell"]')];
    expect(slot.getBoundingClientRect().left).toBeGreaterThan(
      cells.at(-1)?.getBoundingClientRect().right ?? 0,
    );
    await userEvent.click(slot);
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("reports the new order when an item is dragged past its neighbour", async () => {
    const onReorder = vi.fn();
    const { container } = still(() => <Dock items={items(3)} editing onReorder={onReorder} />, {
      width: "400px",
    });
    await hand.drag(byId(container, "d0"), byId(container, "d1"));
    expect(onReorder).toHaveBeenCalledExactlyOnceWith(["d1", "d0", "d2"]);
  });

  it("shows the new order while the item is still held, and settles when it lets go", async () => {
    const { container } = still(() => <Dock items={items(3)} editing onReorder={() => {}} />, {
      width: "400px",
    });
    const cellOf = (id: string) =>
      byId(container, id).closest('[data-slot="dock-cell"]') as HTMLElement;
    await hand.moveTo(byId(container, "d0"));
    await hand.press();
    await hand.moveTo(byId(container, "d2"));
    expect(cellOf("d0").hasAttribute("data-dragging")).toBe(true);
    expect(cellOf("d0").style.order).toBe("2");
    expect(cellOf("d2").style.order).toBe("1");
    expect(cellOf("d1").style.order).toBe("0");
    await hand.release();
    expect(container.querySelector("[data-dragging]")).toBeNull();
    expect(cellOf("d0").style.order).toBe("");
  });

  it("reorders a side dock along its column", async () => {
    const onReorder = vi.fn();
    const { container } = still(
      () => <Dock items={items(3)} placement="left" editing onReorder={onReorder} />,
      { height: "500px", width: "200px" },
    );
    await hand.drag(byId(container, "d2"), byId(container, "d0"));
    expect(onReorder).toHaveBeenCalledExactlyOnceWith(["d2", "d0", "d1"]);
  });

  it("reports nothing when the drag ends where it began, and the release is not a press", async () => {
    const onReorder = vi.fn();
    const onClick = vi.fn();
    const { container } = still(
      () => <Dock items={items(3, onClick)} editing onReorder={onReorder} />,
      { width: "400px" },
    );
    const d1 = byId(container, "d1");
    await hand.moveTo(d1);
    await hand.press();
    await hand.moveTo(d1, 12);
    await hand.moveTo(d1, 3);
    await hand.release();
    expect(onReorder).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not drag when not editing", async () => {
    const onReorder = vi.fn();
    const { container } = render(() => (
      <div style={{ width: "400px" }}>
        <Dock items={items(3)} onReorder={onReorder} />
      </div>
    ));
    await hand.drag(byId(container, "d0"), byId(container, "d1"));
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("moves an item with Alt and an arrow key", async () => {
    const onReorder = vi.fn();
    const { container } = render(() => (
      <div style={{ width: "400px" }}>
        <Dock items={items(3)} editing onReorder={onReorder} />
      </div>
    ));
    byId(container, "d1").focus();
    await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    expect(onReorder).toHaveBeenCalledExactlyOnceWith(["d1", "d0", "d2"]);
  });

  it("keeps the end items where they are on a push past the end", async () => {
    const onReorder = vi.fn();
    const { container } = render(() => (
      <div style={{ width: "400px" }}>
        <Dock items={items(3)} editing onReorder={onReorder} />
      </div>
    ));
    byId(container, "d0").focus();
    await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("turns the page when a dragged item rests on a page dot", async () => {
    const [order, setOrder] = createSignal(items(12));
    const { container } = still(
      () => <Dock items={order()} editing onReorder={() => setOrder(order())} />,
      { width: `${OVERFLOWING_BOX}px` },
    );
    await new Promise(requestAnimationFrame);
    const bar = container.querySelector<HTMLElement>('[data-slot="dock-bar"]') as HTMLElement;
    const dots = container.querySelectorAll('[data-slot="dock-pages"] button');
    expect(bar.scrollLeft).toBe(0);

    const turned = scrolled(bar);
    await hand.moveTo(byId(container, "d0"));
    await hand.press();
    await hand.moveTo(dots[1] as Element);
    await turned;
    await hand.release();
    expect(bar.scrollLeft).toBeGreaterThan(0);
  });

  it("sways the items, and holds still under reduced motion", async () => {
    const { container } = render(() => (
      <>
        <div data-testid="normal">
          <Dock items={items(2)} editing />
        </div>
        <div class="reduce-motion" data-testid="calm">
          <Dock items={items(2)} editing />
        </div>
      </>
    ));
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const cellOf = (box: string) =>
      container.querySelector(`[data-testid="${box}"] [data-slot="dock-cell"]`) as HTMLElement;
    expect(cellOf("normal").getAnimations().length).toBe(1);
    expect(cellOf("calm").getAnimations().length).toBe(0);
  });
});

describe("Dock move grip", () => {
  /** A target for the release: the pointer ends over this marker. */
  function marker(left: string, top: string) {
    const el = document.createElement("div");
    el.style.cssText = `position:fixed;left:${left};top:${top};width:16px;height:16px;`;
    document.body.append(el);
    return el;
  }

  it("moves the dock to the side whose zone the grip is released over", async () => {
    const onMovePlacement = vi.fn();
    const { container } = render(() => (
      <Dock items={items(2)} editing onMovePlacement={onMovePlacement} />
    ));
    const grip = container.querySelector('[data-slot="dock-grip"]') as HTMLElement;
    const target = marker("4px", "40%");
    await hand.drag(grip, target);
    target.remove();
    expect(onMovePlacement).toHaveBeenCalledExactlyOnceWith("left");
  });

  it("moves it to the right edge too", async () => {
    const onMovePlacement = vi.fn();
    const { container } = render(() => (
      <Dock items={items(2)} editing onMovePlacement={onMovePlacement} />
    ));
    const grip = container.querySelector('[data-slot="dock-grip"]') as HTMLElement;
    const target = marker("calc(100% - 20px)", "40%");
    await hand.drag(grip, target);
    target.remove();
    expect(onMovePlacement).toHaveBeenCalledExactlyOnceWith("right");
  });

  it("does nothing when released over no zone or over the edge it already sits on", async () => {
    const onMovePlacement = vi.fn();
    const { container } = render(() => (
      <Dock items={items(2)} placement="left" editing onMovePlacement={onMovePlacement} />
    ));
    const grip = container.querySelector('[data-slot="dock-grip"]') as HTMLElement;
    const middle = marker("50%", "10%");
    await hand.drag(grip, middle);
    const same = marker("4px", "40%");
    await hand.drag(grip, same);
    middle.remove();
    same.remove();
    expect(onMovePlacement).not.toHaveBeenCalled();
  });

  it("lights the landing zones only while the grip is held", async () => {
    const { container } = render(() => (
      <Dock items={items(2)} editing onMovePlacement={() => {}} />
    ));
    const grip = container.querySelector('[data-slot="dock-grip"]') as HTMLElement;
    expect(document.querySelector('[data-slot="dock-edge-zones"]')).toBeNull();
    await hand.moveTo(grip);
    await hand.press();
    expect(document.querySelectorAll('[data-slot="dock-edge-zones"] [data-zone]')).toHaveLength(3);
    await hand.release();
    expect(document.querySelector('[data-slot="dock-edge-zones"]')).toBeNull();
  });
});
