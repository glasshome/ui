import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { settle } from "../harness/mount";
import { mount, OUTSIDE, press } from "./dismiss-parts";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("dismiss contract, finger", () => {
  it("DI5 a touch that scrolls closes nothing, and a tap outside closes on its click", async () => {
    const { dialogs, text, run } = await mount("outside");
    await run(press("Open Layer"));
    await commands.touch("down", OUTSIDE.x, OUTSIDE.y);
    await commands.touch("cancel", OUTSIDE.x, OUTSIDE.y);
    await settle();
    expect(dialogs()).toHaveLength(1);
    await commands.touch("down", OUTSIDE.x, OUTSIDE.y);
    await commands.touch("up", OUTSIDE.x, OUTSIDE.y);
    await settle();
    expect(dialogs()).toHaveLength(0);
    expect(text("Layer dismissals")).toBe("1");
  });
});
