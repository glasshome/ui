import { vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { settle } from "../../dev/harness/settle";
import type { Input } from "../../dev/harness/steps";
import { PRESENCE_TIMEOUT_MS } from "../../src/lib/behavior/presence";
import { HOLD_GRACE_MS, HOLD_MS } from "../../src/lib/hold";
import { useFakeTime } from "../../src/testing/index.js";

const centre = (el: Element) => {
  const box = el.getBoundingClientRect();
  return [box.x + box.width / 2, box.y + box.height / 2] as const;
};

const DRAG_MOVES = 4;

/**
 * A finger's timers run on a clock only the harness moves, so a slow round trip between down and
 * up never reads as a hold. Fails if the gesture leaves a timer that switching back would drop.
 */
async function onHarnessClock(gesture: () => Promise<void>, afterMs: number) {
  if (vi.isFakeTimers()) {
    await gesture();
    await vi.advanceTimersByTimeAsync(afterMs);
    return;
  }
  useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
  try {
    await gesture();
    // The tap's click comes from the browser's gesture detector, after the touch command returns.
    await settle();
    await vi.advanceTimersByTimeAsync(afterMs);
    const pending = vi.getTimerCount();
    if (pending)
      throw new Error(`${pending} timers still pending ${afterMs} ms after the finger left`);
  } finally {
    vi.useRealTimers();
  }
}

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
    await onHarnessClock(async () => {
      await commands.touch("down", x, y);
      await commands.touch("up", x, y);
    }, HOLD_MS);
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
    await onHarnessClock(async () => {
      await commands.touch("down", x, y);
      await vi.advanceTimersByTimeAsync(HOLD_MS + PRESENCE_TIMEOUT_MS);
      await commands.touch("up", x, y);
    }, HOLD_GRACE_MS);
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
    contextMenu(el) {
      pointer.pending = centre(el);
      return base.contextMenu(el);
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
      action: "move" | "down" | "up" | "press",
      x: number,
      y: number,
      button?: "left" | "right",
    ): Promise<void>;
    drag(
      from: { x: number; y: number },
      by: { x: number; y: number },
      moves: number,
      stepMs: number,
    ): Promise<void>;
    touch(action: "down" | "move" | "up" | "cancel", x: number, y: number): Promise<void>;
    wheel(x: number, y: number, deltaY: number): Promise<void>;
    compose(on: boolean): Promise<void>;
    axTree(): Promise<string>;
  }
}
