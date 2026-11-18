import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { scenarioScope } from "../../dev/harness/steps";
import { Avatar, AvatarFallback } from "../../src/solid";
import { useFakeTime } from "../../src/testing/index.js";

afterEach(cleanup);

const FALLBACK_DELAY_MS = 600;

const fallback = () =>
  scenarioScope()
    .map((s) => s.querySelector<HTMLElement>(`[data-slot="avatar-fallback"]`))
    .find((el) => el !== null) ?? null;

describe("Avatar contract, fallback delay", () => {
  it("AV4 fallbackDelay holds the fallback back until the delay passes", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    render(() => (
      <Avatar fallbackDelay={FALLBACK_DELAY_MS}>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    ));
    expect(fallback()).toBeNull();
    await vi.advanceTimersByTimeAsync(FALLBACK_DELAY_MS - 1);
    expect(fallback()).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    expect(fallback()?.textContent).toBe("AL");
  });
});
