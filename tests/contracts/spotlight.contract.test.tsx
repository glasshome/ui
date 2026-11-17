import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findAll, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { input } from "../harness/input";
import { mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const NEXT = { press: { role: "button", name: "Next" } };

async function mount() {
  const { scope } = await mountScenario("Spotlight", "tour-step");
  const part = (slot: string) => document.querySelectorAll(`[data-slot="spotlight-${slot}"]`);
  const hole = () => part("scrim")[0]?.getAttribute("style") ?? "";
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  return { scope, part, hole, run };
}

describe("Spotlight contract", () => {
  it("SL1 mounted over a target it shows one scrim and a bubble with the first step", async () => {
    const { scope, part } = await mount();
    expect(part("scrim")).toHaveLength(1);
    expect(part("bubble")).toHaveLength(1);
    expect(part("bubble")[0]?.textContent).toContain("Step 1");
    expect(findAll(scope(), { role: "button", name: "Next" })).toHaveLength(1);
  });

  it("SL2 pressing Next shows the second step and moves the hole to the second target", async () => {
    const { part, hole, run } = await mount();
    const before = hole();
    await run(NEXT);
    await vi.waitFor(() => expect(part("bubble")[0]?.textContent).toContain("Step 2"));
    await vi.waitFor(() => expect(hole()).not.toBe(before));
  });

  it("SL3 Escape skips: the tour returns to its first step", async () => {
    const { part, run } = await mount();
    await run(NEXT, { key: "Escape" });
    await vi.waitFor(() => expect(part("bubble")[0]?.textContent).toContain("Step 1"));
  });
});
