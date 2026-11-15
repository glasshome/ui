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

declare module "vitest/browser" {
  interface BrowserCommands {
    mouse(action: "move" | "down" | "up", x: number, y: number): Promise<void>;
    touch(action: "down" | "up" | "cancel", x: number, y: number): Promise<void>;
  }
}
