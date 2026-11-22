import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runSteps } from "../../dev/harness/steps";
import { useFakeTime } from "../../src/testing";
import { input } from "../harness/input";
import { mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const OPEN_DELAY_MS = 700;
const TRIGGER = { role: "link", name: "12 creators" };

describe("HoverCard contract, finger", () => {
  it("HC7 a touch on the trigger opens no card", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const { scope } = await mountScenario("HoverCard", "touch");
    await runSteps(scope, [{ touch: TRIGGER }], input, settle);
    await vi.advanceTimersByTimeAsync(OPEN_DELAY_MS);
    await settle();
    const cards = scope().flatMap((root) => [
      ...root.querySelectorAll('[data-slot="hover-card-content"]'),
    ]);
    expect(cards).toHaveLength(0);
  });
});
