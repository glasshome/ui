import { afterEach, describe, expect, it, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { createHold, HOLD_MS } from "../../src/lib/hold.js";
import { useFakeTime } from "../../src/testing/index.js";

function sheet(): HTMLElement {
  const el = document.body.appendChild(document.createElement("div"));
  el.textContent = "Kitchen lights";
  el.style.cssText = "width: 200px; height: 100px;";
  return el;
}

afterEach(() => {
  document.body.replaceChildren();
  window.getSelection()?.removeAllRanges();
});

declare module "vitest/browser" {
  interface BrowserCommands {
    mouse(
      action: "move" | "down" | "up" | "press",
      x: number,
      y: number,
      button?: "left" | "right",
    ): Promise<void>;
  }
}

describe("createHold", () => {
  it("swallows one mouse release click and lets the next ones through", async () => {
    useFakeTime();
    const el = sheet();
    let clicks = 0;
    el.addEventListener("click", () => clicks++);
    const hold = createHold({ onHold: () => {} });
    el.addEventListener("pointerdown", hold.down);
    await commands.mouse("down", 50, 50);
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    await commands.mouse("up", 50, 50);
    expect(clicks).toBe(0);
    await userEvent.click(el);
    await userEvent.click(el);
    expect(clicks).toBe(2);
  });

  it("claims its release once it fires, until the press ends", async () => {
    useFakeTime();
    const el = sheet();
    const hold = createHold({ onHold: () => {} });
    el.addEventListener("pointerdown", hold.down);
    await commands.mouse("down", 50, 50);
    expect(hold.claim()).toBeUndefined();
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    expect(hold.claim()).toBe("prevent:touchend prevent:click stop:click");
    await commands.mouse("up", 50, 50);
    expect(hold.claim()).toBeUndefined();
  });

  it("a press that moves past the slop never fires", async () => {
    useFakeTime();
    const el = sheet();
    let held = 0;
    const hold = createHold({ onHold: () => held++ });
    el.addEventListener("pointerdown", hold.down);
    el.addEventListener("pointermove", hold.move);
    await commands.mouse("down", 50, 50);
    await commands.mouse("move", 50, 70);
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    await commands.mouse("up", 50, 70);
    expect(held).toBe(0);
  });

  it("arms after the grace time and disarms when the press ends", async () => {
    useFakeTime();
    const el = sheet();
    const log: string[] = [];
    const hold = createHold({
      onHold: () => log.push("hold"),
      onArm: () => log.push("arm"),
      onDisarm: () => log.push("disarm"),
    });
    el.addEventListener("pointerdown", hold.down);
    el.addEventListener("pointerup", hold.up);
    await commands.mouse("down", 50, 50);
    await vi.advanceTimersByTimeAsync(HOLD_MS / 2);
    await commands.mouse("up", 50, 50);
    await vi.runAllTimersAsync();
    expect({ log, fired: hold.fired() }).toEqual({ log: ["arm", "disarm"], fired: false });
  });

  it("a release off the pressed node ends the press, so no hold fires and no click is swallowed", async () => {
    useFakeTime();
    const el = sheet();
    const other = document.body.appendChild(document.createElement("button"));
    other.textContent = "Other";
    let held = 0;
    let clicks = 0;
    other.addEventListener("click", () => clicks++);
    const hold = createHold({ onHold: () => held++ });
    el.addEventListener("pointerdown", hold.down);
    await commands.mouse("down", 50, 50);
    await commands.mouse("move", 50, 150);
    await commands.mouse("up", 50, 150);
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    await userEvent.click(other);
    expect({ held, clicks }).toEqual({ held: 0, clicks: 1 });
  });
});
