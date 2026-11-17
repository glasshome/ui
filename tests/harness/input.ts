import { commands, userEvent } from "vitest/browser";
import type { Input } from "../../dev/harness/steps";

const centre = (el: Element) => {
  const box = el.getBoundingClientRect();
  return [box.x + box.width / 2, box.y + box.height / 2] as const;
};

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
  async touch(el) {
    const [x, y] = centre(el);
    await commands.touch("down", x, y);
    await commands.touch("up", x, y);
  },
  async hover(el) {
    const [x, y] = centre(el);
    await commands.mouse("move", x, y);
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
    mouse(action: "move" | "down" | "up", x: number, y: number): Promise<void>;
    touch(action: "down" | "move" | "up" | "cancel", x: number, y: number): Promise<void>;
    wheel(x: number, y: number, deltaY: number): Promise<void>;
    compose(on: boolean): Promise<void>;
  }
}
