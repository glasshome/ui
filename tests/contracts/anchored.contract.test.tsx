import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { findTarget } from "../../dev/harness/steps";
import { input } from "../harness/input";
import { mountScenario, settle } from "../harness/mount";

const OFFSET = 8;
const EDGE = 16;

afterEach(() => {
  cleanup();
  for (const spacer of document.querySelectorAll("[data-test-spacer]")) spacer.remove();
  window.scrollTo(0, 0);
});

async function open(id: string) {
  const { scope } = await mountScenario("anchored", id);
  const anchor = findTarget(scope(), { role: "button", name: "Anchor" });
  await input.press(anchor);
  await settle();
  const part = findTarget(scope(), { role: "dialog", name: "Part" });
  return { scope, anchor, part };
}

const gapBelow = (anchor: Element, part: Element) =>
  part.getBoundingClientRect().top - anchor.getBoundingClientRect().bottom;

const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));

describe("anchored contract", () => {
  it("PO1 opens below the trigger, offset from its edge, inside the viewport", async () => {
    const { anchor, part } = await open("below");
    expect(Math.abs(gapBelow(anchor, part) - OFFSET)).toBeLessThanOrEqual(1);
    const box = part.getBoundingClientRect();
    expect(box.left).toBeGreaterThanOrEqual(EDGE);
    expect(box.right).toBeLessThanOrEqual(window.innerWidth - EDGE);
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight - EDGE);
  });

  it("PO2 opens above the trigger when there is no room below", async () => {
    const { anchor, part } = await open("flip");
    const box = part.getBoundingClientRect();
    expect(Math.abs(anchor.getBoundingClientRect().top - box.bottom - OFFSET)).toBeLessThanOrEqual(
      1,
    );
    expect(box.top).toBeGreaterThanOrEqual(EDGE);
  });

  it("PO3 follows the trigger through a scroll container and through the page", async () => {
    const { anchor, part, scope } = await open("scrolling");
    const scroller = scope()
      .map((root) => root.querySelector('[data-slot="scroller"]'))
      .find((el) => el);
    if (!scroller) throw new Error("no scroller");
    const before = gapBelow(anchor, part);
    const anchorY = anchor.getBoundingClientRect().top;
    const rect = scroller.getBoundingClientRect();
    await commands.wheel(rect.x + rect.width / 2, rect.y + 10, 40);
    await vi.waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(0));
    await frame();
    await frame();
    expect(anchor.getBoundingClientRect().top).not.toBe(anchorY);
    expect(Math.abs(gapBelow(anchor, part) - before)).toBeLessThanOrEqual(1);

    const tall = document.createElement("div");
    tall.setAttribute("data-test-spacer", "");
    tall.style.height = "3000px";
    document.body.append(tall);
    const pageBefore = anchor.getBoundingClientRect().top;
    await commands.wheel(window.innerWidth - 8, 8, 30);
    await vi.waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
    await frame();
    await frame();
    expect(anchor.getBoundingClientRect().top).not.toBe(pageBefore);
    expect(Math.abs(gapBelow(anchor, part) - before)).toBeLessThanOrEqual(1);
  });

  it("PO4 is at least as wide as the trigger when asked", async () => {
    const { anchor, part } = await open("match-width");
    expect(part.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      anchor.getBoundingClientRect().width - 1,
    );
  });

  it("PO5 opens below a trigger inside a closed shadow root", async () => {
    const { anchor, part } = await open("in-shadow-root");
    expect(anchor.getRootNode()).toBeInstanceOf(ShadowRoot);
    expect(part.getRootNode()).toBe(anchor.getRootNode());
    expect(Math.abs(gapBelow(anchor, part) - OFFSET)).toBeLessThanOrEqual(1);
  });

  it("PO6 reads no computed style and leaves no anchor property on the part", async () => {
    const { scope } = await mountScenario("anchored", "below");
    const anchor = findTarget(scope(), { role: "button", name: "Anchor" });
    const spy = vi.spyOn(window, "getComputedStyle");
    await input.press(anchor);
    await settle();
    const calls = spy.mock.calls.length;
    spy.mockRestore();
    expect(calls).toBe(0);
    const part = findTarget(scope(), { role: "dialog", name: "Part" }) as HTMLElement;
    expect(part.getAttribute("style") ?? "").not.toMatch(/anchor/);
    expect(anchor.getAttribute("style") ?? "").not.toMatch(/anchor/);
  });

  it("PO7 marks the part it places while open, and only then", async () => {
    const { anchor, part } = await open("below");
    expect(part.hasAttribute("data-anchored")).toBe(true);
    expect(anchor.hasAttribute("data-anchored")).toBe(false);
    await input.press(anchor);
    await settle();
    expect(part.hasAttribute("data-anchored")).toBe(false);
  });
});
