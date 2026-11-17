import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { findTarget, runSteps } from "../../dev/harness/steps";
import { input } from "../harness/input";
import { mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

describe("solid contract", () => {
  it("SO1 pressing the toggle applies the new value through the effect", async () => {
    const { scope } = await mountScenario("solid", "effect-attribute");
    const toggle = () => findTarget(scope(), { role: "button", name: "Toggle" });
    expect(toggle().getAttribute("aria-pressed")).toBe("false");
    await runSteps(scope, [{ press: { role: "button", name: "Toggle" } }], input, settle);
    expect(toggle().getAttribute("aria-pressed")).toBe("true");
  });
});
