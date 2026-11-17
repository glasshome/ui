import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { settle } from "../harness/mount";
import { corner, openBlock, pageY } from "./scroll-contain-parts";

afterEach(cleanup);

describe("scroll-contain contract, touch", () => {
  it("SC2 a touch drag on the scrim leaves the page where it is", async () => {
    const parts = await openBlock("modal", "page");
    await commands.pointer("finger");
    const { x, y } = corner;
    await commands.touch("down", x, y + 400);
    for (let step = 1; step <= 8; step++) await commands.touch("move", x, y + 400 - step * 45);
    await commands.touch("up", x, y);
    await settle();
    await commands.pointer("mouse");
    expect(pageY()).toBe(0);
    expect(parts.scrim.isConnected).toBe(true);
  });
});
