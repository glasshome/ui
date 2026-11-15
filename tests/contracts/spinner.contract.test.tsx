import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { findAll, findTarget } from "../../dev/harness/steps";
import { focusedElement, mountScenario } from "../harness/mount";

afterEach(async () => {
  cleanup();
  await commands.emulateMedia({ reducedMotion: "no-preference" });
});

const infinite = (el: Element) =>
  el
    .getAnimations()
    .filter(
      (a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity,
    );

describe("Spinner contract", () => {
  it("SP1 one status named Loading, outside the tab order", async () => {
    const { scope } = await mountScenario("Spinner", "default");
    expect(findAll(scope(), { role: "status" })).toHaveLength(1);
    const status = findTarget(scope(), { role: "status", name: "Loading" });
    status.ownerDocument.body.focus();
    expect(status.matches(":focus-visible, [tabindex]")).toBe(false);
    expect(focusedElement()).not.toBe(status);
  });

  it("SP2 one infinite animation turns it, with or without reduced motion", async () => {
    for (const reducedMotion of ["no-preference", "reduce"] as const) {
      await commands.emulateMedia({ reducedMotion });
      const { scope } = await mountScenario("Spinner", "default");
      expect(infinite(findTarget(scope(), { role: "status" })), reducedMotion).toHaveLength(1);
      cleanup();
    }
  });

  it("SP3 a caller's aria-label names the status", async () => {
    const { scope } = await mountScenario("Spinner", "labelled");
    expect(findAll(scope(), { role: "status", name: "Saving" })).toHaveLength(1);
    expect(findAll(scope(), { role: "status", name: "Loading" })).toHaveLength(0);
  });
});
