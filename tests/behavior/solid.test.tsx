import { createRoot, createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { effect, merge, omit } from "../../src/lib/behavior/solid";

describe("effect", () => {
  it("re-runs apply when compute's reads change", () => {
    const [n, setN] = createSignal(1);
    const seen: number[] = [];
    const dispose = createRoot((stop) => {
      effect(n, (value) => {
        seen.push(value);
      });
      return stop;
    });
    setN(2);
    setN(3);
    dispose();
    expect(seen).toEqual([1, 2, 3]);
  });

  it("apply's cleanup runs before the next apply and on dispose", () => {
    const [n, setN] = createSignal(1);
    const log: string[] = [];
    const dispose = createRoot((stop) => {
      effect(n, (value) => {
        log.push(`apply ${value}`);
        return () => log.push(`cleanup ${value}`);
      });
      return stop;
    });
    setN(2);
    dispose();
    expect(log).toEqual(["apply 1", "cleanup 1", "apply 2", "cleanup 2"]);
  });

  it("a signal read inside apply is not tracked", () => {
    const [watched, setWatched] = createSignal(1);
    const [hidden, setHidden] = createSignal(1);
    let runs = 0;
    const dispose = createRoot((stop) => {
      effect(watched, () => {
        hidden();
        runs += 1;
      });
      return stop;
    });
    setHidden(2);
    setHidden(3);
    expect(runs).toBe(1);
    setWatched(2);
    dispose();
    expect(runs).toBe(2);
  });
});

describe("omit and merge", () => {
  it("omit hides the named props and keeps the rest reactive", () => {
    const [label, setLabel] = createSignal("a");
    const props = {
      get label() {
        return label();
      },
      secret: 1,
    };
    const rest = omit(props, "secret");
    expect("secret" in rest).toBe(false);
    expect(rest.label).toBe("a");
    setLabel("b");
    expect(rest.label).toBe("b");
  });

  it("merge lets the later props win and stays reactive", () => {
    const [on, setOn] = createSignal(false);
    const merged = merge(
      { open: true, id: "x" },
      {
        get open() {
          return on();
        },
      },
    );
    expect(merged.open).toBe(false);
    expect(merged.id).toBe("x");
    setOn(true);
    expect(merged.open).toBe(true);
  });
});
