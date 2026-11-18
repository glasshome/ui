import { vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import type { Input } from "../../dev/harness/steps";
import { PRESENCE_TIMEOUT_MS } from "../../src/lib/behavior/presence";
import { HOLD_GRACE_MS, HOLD_MS } from "../../src/lib/hold";
import { useFakeTime } from "../../src/testing/index.js";

const centre = (el: Element) => {
  const box = el.getBoundingClientRect();
  return [box.x + box.width / 2, box.y + box.height / 2] as const;
};

const DRAG_MOVES = 4;

/** Real input at the element's centre: a selector cannot reach into a closed shadow root, a point can. */
export const input: Input = {
  async press(el) {
    const [x, y] = centre(el);
    await commands.mouse("move", x, y);
    await commands.mouse("down", x, y);
    await commands.mouse("up", x, y);
  },
  async pressAt(x, y) {
    await commands.mouse("move", x, y);
    await commands.mouse("down", x, y);
    await commands.mouse("up", x, y);
  },
  async drag(el, by) {
    const [x, y] = centre(el);
    await commands.mouse("move", x, y);
    await commands.mouse("down", x, y);
    for (let i = 1; i <= DRAG_MOVES; i++) {
      await commands.mouse("move", x + (by.x * i) / DRAG_MOVES, y + (by.y * i) / DRAG_MOVES);
    }
    await commands.mouse("up", x + by.x, y + by.y);
  },
  async touch(el) {
    const [x, y] = centre(el);
    await commands.touch("down", x, y);
    await commands.touch("up", x, y);
  },
  async hover(el) {
    const [x, y] = centre(el);
    await commands.mouse("move", x, y);
  },
  async contextMenu(el) {
    const [x, y] = centre(el);
    await commands.mouse("move", x, y);
    await commands.mouse("down", x, y, "right");
    await commands.mouse("up", x, y, "right");
  },
  async hold(el) {
    const [x, y] = centre(el);
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    await commands.touch("down", x, y);
    await vi.advanceTimersByTimeAsync(HOLD_MS + PRESENCE_TIMEOUT_MS);
    await commands.touch("up", x, y);
    await vi.advanceTimersByTimeAsync(HOLD_GRACE_MS);
    vi.useRealTimers();
  },
  key: (key) => userEvent.keyboard(`{${key}}`),
  type: (text) => userEvent.keyboard(text),
};

/**
 * Content that opens under a still pointer is hovered or not by timing; `rehover` moves the pointer
 * again so it always is. Only once per pointer step: a key that later scrolls the page leaves it be.
 */
export function trackPointer(base: Input) {
  const pointer: { pending?: readonly [number, number] } = {};
  const tracked: Input = {
    ...base,
    press(el) {
      pointer.pending = centre(el);
      return base.press(el);
    },
    hover(el) {
      pointer.pending = centre(el);
      return base.hover(el);
    },
  };
  async function rehover() {
    if (!pointer.pending) return;
    const [x, y] = pointer.pending;
    pointer.pending = undefined;
    await commands.mouse("move", x + 1, y);
    await commands.mouse("move", x, y);
  }
  return { input: tracked, rehover };
}

declare module "vitest/browser" {
  interface BrowserCommands {
    mouse(
      action: "move" | "down" | "up",
      x: number,
      y: number,
      button?: "left" | "right",
    ): Promise<void>;
    touch(action: "down" | "move" | "up" | "cancel", x: number, y: number): Promise<void>;
    wheel(x: number, y: number, deltaY: number): Promise<void>;
    compose(on: boolean): Promise<void>;
    axTree(): Promise<string>;
  }
}
