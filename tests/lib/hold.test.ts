import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { spendLongPress } from "../../src/lib/hold.js";
import { useFakeTime } from "../../src/testing/index.js";

const NATIVE: Record<"contextmenu" | "selectstart", (el: Element) => Promise<void>> = {
  contextmenu: (el) => userEvent.click(el, { button: "right" }),
  selectstart: (el) => userEvent.dblClick(el),
};

async function fire(target: Element, type: keyof typeof NATIVE): Promise<boolean | undefined> {
  let prevented: boolean | undefined;
  const look = (e: Event) => {
    prevented ??= e.defaultPrevented;
  };
  window.addEventListener(type, look);
  await NATIVE[type](target);
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

    expect(await fire(el, "contextmenu")).toBe(true);
    expect(await fire(el, "selectstart")).toBe(true);

    await userEvent.click(el);
    await vi.runAllTimersAsync();

    expect(await fire(el, "contextmenu")).toBe(false);
    expect(await fire(el, "selectstart")).toBe(false);
  });

  it("lets go on its own when the release never arrives", async () => {
    useFakeTime();
    const el = sheet();
    spendLongPress();
    await vi.runAllTimersAsync();

    expect(await fire(el, "selectstart")).toBe(false);
  });
});
