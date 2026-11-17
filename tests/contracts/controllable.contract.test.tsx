import { cleanup } from "@solidjs/testing-library";
import { createRoot, createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { findTarget, runSteps } from "../../dev/harness/steps";
import { createControllableSignal } from "../../src/lib/behavior/controllable";
import { input } from "../harness/input";
import { mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const press = { role: "button", name: "Toggle" };

describe("controllable contract", () => {
  it("CS1 an uncontrolled set updates the getter and calls onChange once", async () => {
    const { scope } = await mountScenario("controllable", "uncontrolled");
    const toggle = () => findTarget(scope(), press);
    expect(toggle().getAttribute("aria-pressed")).toBe("false");
    await runSteps(scope, [{ press }], input, settle);
    expect(toggle().getAttribute("aria-pressed")).toBe("true");

    createRoot((dispose) => {
      const calls: number[] = [];
      const [get, set] = createControllableSignal<number>({
        value: () => undefined,
        defaultValue: () => 1,
        onChange: (next) => calls.push(next),
      });
      set(2);
      expect(get()).toBe(2);
      expect(calls).toEqual([2]);
      dispose();
    });
  });

  it("CS2 a controlled set calls onChange once and the getter waits for the owner", async () => {
    const { scope } = await mountScenario("controllable", "controlled");
    await runSteps(scope, [{ press }], input, settle);
    expect(findTarget(scope(), press).getAttribute("aria-pressed")).toBe("true");

    createRoot((dispose) => {
      const [owner, setOwner] = createSignal<number | undefined>(1);
      const calls: number[] = [];
      const [get, set] = createControllableSignal<number>({
        value: owner,
        defaultValue: () => 0,
        onChange: (next) => calls.push(next),
      });
      set(5);
      expect(calls).toEqual([5]);
      expect(get()).toBe(1);
      setOwner(5);
      expect(get()).toBe(5);
      dispose();
    });
  });

  it("CS3 setting the current value runs nothing", () => {
    createRoot((dispose) => {
      const calls: unknown[] = [];
      const [get, set] = createControllableSignal<number>({
        value: () => undefined,
        defaultValue: () => 3,
        onChange: (next) => calls.push(next),
      });
      set(3);
      expect(calls).toEqual([]);
      expect(get()).toBe(3);

      const same: unknown[] = [];
      const [, setObject] = createControllableSignal<{ id: number }>({
        value: () => undefined,
        defaultValue: () => ({ id: 1 }),
        onChange: (next) => same.push(next),
        equals: (a, b) => a.id === b.id,
      });
      setObject({ id: 1 });
      expect(same).toEqual([]);
      setObject({ id: 2 });
      expect(same).toEqual([{ id: 2 }]);
      dispose();
    });
  });

  it("CS4 when the owner's value turns undefined the getter returns the last stored value", () => {
    createRoot((dispose) => {
      const [owner, setOwner] = createSignal<number | undefined>(1);
      const [get, set] = createControllableSignal<number>({
        value: owner,
        defaultValue: () => 0,
      });
      set(7);
      expect(get()).toBe(1);
      setOwner(undefined);
      expect(get()).toBe(7);
      dispose();
    });
  });
});
