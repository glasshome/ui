import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { input } from "../harness/input";
import { centre, chosen, expectCornerAt, menus, mount, step } from "./context-menu-parts";

afterEach(() => cleanup());

describe("ContextMenu contract, finger", () => {
  it("CM3 a held touch opens the menu under the finger and its release chooses nothing", async () => {
    const { scope, area } = await mount();
    const [x, y] = centre(area);
    await step(input.hold(area));
    const all = menus(scope);
    expect(all).toHaveLength(1);
    expectCornerAt(all[0], x, y);
    expect(chosen(scope)).toBe("nothing");
  });

  it("CM4 a short tap opens nothing", async () => {
    const { scope, area } = await mount();
    await step(input.touch(area));
    expect(menus(scope)).toHaveLength(0);
  });
});
