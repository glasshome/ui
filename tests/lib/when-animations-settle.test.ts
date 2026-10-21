import { afterEach, expect, it } from "vitest";
import { whenAnimationsSettle } from "../../src/lib/when-animations-settle.js";

const FADE: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

function attached(): HTMLElement {
  return document.body.appendChild(document.createElement("div"));
}

afterEach(() => {
  for (const animation of document.getAnimations()) animation.cancel();
  document.body.replaceChildren();
});

it("resolves at once when nothing runs or the environment cannot animate", async () => {
  await expect(whenAnimationsSettle(document.createElement("div"))).resolves.toBeUndefined();
  await expect(whenAnimationsSettle(attached())).resolves.toBeUndefined();
});

it("waits for every running animation, and survives a cancelled one", async () => {
  const el = attached();
  const a = el.animate(FADE, 60_000);
  const b = el.animate(FADE, 60_000);
  let settled = false;
  const done = whenAnimationsSettle(el).then(() => (settled = true));
  await Promise.resolve();
  a.finish();
  await a.finished;
  await Promise.resolve();
  await Promise.resolve();
  expect(settled).toBe(false);
  b.cancel();
  await done;
  expect(settled).toBe(true);
});

it("ignores animations the filter rejects", async () => {
  const el = attached();
  el.animate(FADE, { duration: 1000, iterations: Infinity, id: "ambient" });
  const slide = el.animate(FADE, { duration: 60_000, id: "slide" });
  const done = whenAnimationsSettle(el, { filter: (a) => a.id === "slide" });
  await Promise.resolve();
  slide.finish();
  await expect(done).resolves.toBeUndefined();
});
