import { afterEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
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
    touch(action: "down" | "up" | "cancel", x: number, y: number): Promise<void>;
    mouse(
      action: "move" | "down" | "up" | "press",
      x: number,
      y: number,
      button?: "left" | "right",
    ): Promise<void>;
  }
}

describe("createHold", () => {
  it("fires after the hold time and spends a finger's release", async () => {
    useFakeTime();
    const el = sheet();
    const seen: string[] = [];
    for (const t of ["mousedown", "click"]) el.addEventListener(t, () => seen.push(t));
    let held = 0;
    const hold = createHold({ onHold: () => held++ });
    el.addEventListener("pointerdown", hold.down);
    await commands.touch("down", 50, 50);
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    await commands.touch("up", 50, 50);
    await vi.runAllTimersAsync();
    expect({ held, seen }).toEqual({ held: 1, seen: [] });
    el.removeEventListener("pointerdown", hold.down);
    await commands.touch("down", 50, 50);
    await commands.touch("up", 50, 50);
    await expect.poll(() => seen).toEqual(["mousedown", "click"]);
  });

  it("a cancelled pointer leaves no click swallowed", async () => {
    useFakeTime();
    const el = sheet();
    let clicks = 0;
    el.addEventListener("click", () => clicks++);
    const hold = createHold({ onHold: () => {} });
    el.addEventListener("pointerdown", hold.down);
    await commands.touch("down", 50, 50);
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    await commands.touch("cancel", 50, 50);
    el.removeEventListener("pointerdown", hold.down);
    // Raw mouse input carries no action timer, so a cold module server cannot time the press out.
    await commands.mouse("press", 50, 50);
    expect(clicks).toBe(1);
  });

  it("spends a finger's release when the hold takes the pressed node out of the page", async () => {
    useFakeTime();
    const el = sheet();
    const opened = document.createElement("div");
    opened.style.cssText = "width: 200px; height: 100px;";
    const seen: string[] = [];
    for (const t of ["mousedown", "click"]) opened.addEventListener(t, () => seen.push(t));
    const hold = createHold({ onHold: () => el.replaceWith(opened) });
    el.addEventListener("pointerdown", hold.down);
    await commands.touch("down", 50, 50);
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    await commands.touch("up", 50, 50);
    await vi.runAllTimersAsync();
    expect(seen).toEqual([]);
  });
});
