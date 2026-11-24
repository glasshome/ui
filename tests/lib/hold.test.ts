import { afterEach, describe, expect, it, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { createHold, HOLD_MS, spendLongPress } from "../../src/lib/hold.js";
import { useFakeTime } from "../../src/testing/index.js";

// Commands leave the fake clock still; a userEvent press moves it and runs the release under test.
const NATIVE: Record<"contextmenu" | "selectstart", () => Promise<void>> = {
  contextmenu: () => commands.mouse("press", 50, 50, "right"),
  selectstart: () => commands.mouse("press", 50, 50),
};

async function fire(type: keyof typeof NATIVE): Promise<boolean | undefined> {
  let prevented: boolean | undefined;
  const look = (e: Event) => {
    prevented ??= e.defaultPrevented;
  };
  window.addEventListener(type, look);
  await NATIVE[type]();
  window.removeEventListener(type, look);
  return prevented;
}

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

describe("spendLongPress", () => {
  it("keeps the browser's long press off what a hold opened until the finger lifts", async () => {
    useFakeTime();
    const el = sheet();
    spendLongPress();

    expect(await fire("contextmenu")).toBe(true);
    expect(await fire("selectstart")).toBe(true);

    await userEvent.click(el);
    await vi.runAllTimersAsync();

    expect(await fire("contextmenu")).toBe(false);
    expect(await fire("selectstart")).toBe(false);
  });

  it("lets go on its own when the release never arrives", async () => {
    useFakeTime();
    sheet();
    spendLongPress();
    await vi.runAllTimersAsync();

    expect(await fire("selectstart")).toBe(false);
  });
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
