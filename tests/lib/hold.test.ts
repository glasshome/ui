import { afterEach, describe, expect, it, vi } from "vitest";
import { spendLongPress } from "../../src/lib/hold.js";

const fire = (target: EventTarget, type: string) => {
  const e = new Event(type, { bubbles: true, cancelable: true });
  target.dispatchEvent(e);
  return e.defaultPrevented;
};

describe("spendLongPress", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps the browser's long press off what a hold opened until the finger lifts", () => {
    vi.useFakeTimers();
    const sheet = document.body.appendChild(document.createElement("div"));
    spendLongPress();

    expect(fire(sheet, "contextmenu")).toBe(true);
    expect(fire(sheet, "selectstart")).toBe(true);

    fire(window, "pointerup");
    vi.runAllTimers();

    expect(fire(sheet, "contextmenu")).toBe(false);
    expect(fire(sheet, "selectstart")).toBe(false);
  });

  it("lets go on its own when the release never arrives", () => {
    vi.useFakeTimers();
    spendLongPress();
    vi.runAllTimers();

    expect(fire(document.body, "selectstart")).toBe(false);
  });
});
