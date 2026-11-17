import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { findAll, findTarget } from "../../dev/harness/steps";
import { input } from "../harness/input";
import { focusedElement, mountScenario } from "../harness/mount";

afterEach(async () => {
  cleanup();
  await commands.emulateMedia({ reducedMotion: "no-preference" });
});

const veil = () => document.querySelector<HTMLElement>('[data-slot="stale-veil"]');

const tileButton = (scope: ParentNode[]) => {
  const button = findAll(scope, { role: "button" }).find((b) => b.textContent?.includes("Hallway"));
  if (!button) throw new Error("no widget button");
  return button;
};

const stateDuration = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--duration-state"));

describe("StaleVeil contract", () => {
  it("SV1 one cover in the parent's box, hidden from assistive technology, in no tab order", async () => {
    await mountScenario("StaleVeil", "over-a-widget");
    const el = veil() as HTMLElement;
    const tile = el.parentElement as HTMLElement;
    expect(document.querySelectorAll('[data-slot="stale-veil"]')).toHaveLength(1);
    const box = el.getBoundingClientRect();
    const outer = tile.getBoundingClientRect();
    const border = parseFloat(getComputedStyle(tile).borderLeftWidth);
    expect(box.width).toBeCloseTo(outer.width - 2 * border, 1);
    expect(box.height).toBeCloseTo(outer.height - 2 * border, 1);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.tabIndex).toBe(-1);
  });

  it("SV2 one finite animation fades it in on the state duration, then nothing animates", async () => {
    const { scope } = await mountScenario("StaleVeil", "reveal");
    expect(veil()).toBeNull();
    await input.press(findTarget(scope(), { role: "button", name: "Stale" }));
    const el = veil() as HTMLElement;
    const [fade, ...others] = el.getAnimations();
    expect(others).toHaveLength(0);
    expect(fade?.effect?.getComputedTiming().iterations).toBe(1);
    expect(fade?.effect?.getComputedTiming().duration).toBe(stateDuration());
    await fade?.finished;
    expect(el.getAnimations()).toHaveLength(0);
  });

  it("SV3 with reduced motion no animation runs and the cover is fully shown at once", async () => {
    await commands.emulateMedia({ reducedMotion: "reduce" });
    await mountScenario("StaleVeil", "over-a-widget");
    const el = veil() as HTMLElement;
    expect(el.getAnimations()).toHaveLength(0);
    expect(getComputedStyle(el).opacity).toBe("1");
  });

  it("SV4 a press at its centre reaches the content beneath and focus stays there", async () => {
    const { scope } = await mountScenario("StaleVeil", "over-a-widget");
    const button = tileButton(scope());
    let presses = 0;
    button.addEventListener("click", () => (presses += 1));
    await input.press(button);
    expect(presses).toBe(1);
    expect(focusedElement()).toBe(button);
  });

  it("SV5 once no longer shown the cover is gone and the content is the top element", async () => {
    const { scope } = await mountScenario("StaleVeil", "reveal");
    const toggle = findTarget(scope(), { role: "button", name: "Stale" });
    await input.press(toggle);
    expect(veil()).not.toBeNull();
    await input.press(toggle);
    expect(veil()).toBeNull();
    const button = tileButton(scope());
    const box = button.getBoundingClientRect();
    const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    expect(button.contains(top)).toBe(true);
  });
});
