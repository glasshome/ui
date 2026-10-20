import { expect, it } from "vitest";
import { whenAnimationsSettle } from "../../src/lib/when-animations-settle.js";

function withAnimations(animations: { finished: Promise<unknown> }[]): Element {
  const el = document.createElement("div");
  el.getAnimations = (() => animations) as unknown as typeof el.getAnimations;
  return el;
}

it("resolves at once when nothing runs or the environment cannot animate", async () => {
  await expect(whenAnimationsSettle(document.createElement("div"))).resolves.toBeUndefined();
  await expect(whenAnimationsSettle(withAnimations([]))).resolves.toBeUndefined();
});

it("waits for every running animation, and survives a cancelled one", async () => {
  let finishA: () => void = () => {};
  let cancelB: (reason: unknown) => void = () => {};
  const el = withAnimations([
    { finished: new Promise<void>((resolve) => (finishA = resolve)) },
    { finished: new Promise<void>((_, reject) => (cancelB = reject)) },
  ]);
  let settled = false;
  const done = whenAnimationsSettle(el).then(() => (settled = true));
  await Promise.resolve();
  finishA();
  await Promise.resolve();
  await Promise.resolve();
  expect(settled).toBe(false);
  cancelB(new DOMException("cancelled", "AbortError"));
  await done;
  expect(settled).toBe(true);
});

it("ignores animations the filter rejects", async () => {
  const el = withAnimations([
    { finished: new Promise<void>(() => {}), id: "ambient" } as never,
    { finished: Promise.resolve(), id: "slide" } as never,
  ]);
  await expect(
    whenAnimationsSettle(el, {
      filter: (a) => (a as unknown as { id: string }).id === "slide",
    }),
  ).resolves.toBeUndefined();
});
