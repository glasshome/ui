import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findAll, findTarget } from "../../dev/harness/steps";
import { press } from "../press.js";
import { mountScenario } from "../harness/mount";

afterEach(cleanup);

const pages = (scope: ParentNode[]) =>
  findAll(scope, { role: "button" }).filter((el) =>
    /^Page \d+$/.test(el.getAttribute("aria-label") ?? ""),
  );

describe("Dock contract", () => {
  it("DK1 every item is a button named by its label, on one page", async () => {
    const { scope } = await mountScenario("Dock", "fits");
    for (const name of ["Board 1", "Board 2", "Board 3"]) {
      expect(findAll(scope(), { role: "button", name })).toHaveLength(1);
    }
    expect(pages(scope())).toHaveLength(0);
  });

  it("DK2 more items than room page the strip, which ends on a whole item", async () => {
    const { scope } = await mountScenario("Dock", "pages");
    await vi.waitFor(() => expect(pages(scope()).length).toBeGreaterThan(1));
    expect(pages(scope())[0]?.getAttribute("aria-current")).toBe("true");
    const first = findTarget(scope(), { role: "button", name: "Board 1" }).getBoundingClientRect();
    const second = findTarget(scope(), { role: "button", name: "Board 2" }).getBoundingClientRect();
    const strip = findTarget(scope(), { role: "button", name: "Board 1" }).closest(
      '[data-slot="dock-bar"]',
    );
    if (!strip) throw new Error("no dock strip");
    const step = second.left - first.left;
    const shown = (strip.getBoundingClientRect().width + step - first.width) / step;
    expect(Math.abs(shown - Math.round(shown))).toBeLessThan(0.05);
  });

  it("DK3 pressing a page turns to it", async () => {
    const { scope } = await mountScenario("Dock", "pages");
    await vi.waitFor(() => expect(pages(scope()).length).toBeGreaterThan(1));
    const second = findTarget(scope(), { role: "button", name: "Page 2" });
    const strip = findTarget(scope(), { role: "button", name: "Board 1" }).closest(
      '[data-slot="dock-bar"]',
    );
    if (!strip) throw new Error("no dock strip");
    const scrolled = new Promise<void>((done) =>
      strip.addEventListener("scrollend", () => done(), { once: true }),
    );
    await press(second);
    await scrolled;
    expect(second.getAttribute("aria-current")).toBe("true");
  });
});
