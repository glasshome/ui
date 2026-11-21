import type { CDPSession } from "playwright";
import { closedRoots, MUTATIONS } from "./settle";

const SAMPLES = [0.25, 0.5, 0.75, 1];
const ROUNDS = 8;
const TWO_FRAMES = "new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))";
const LAYOUT = "void document.documentElement.offsetHeight";
const COMPOSITED = ["transform", "translate", "rotate", "scale", "opacity", "filter"];
const NOT_PROPERTIES = ["offset", "computedOffset", "easing", "composite"];
// Every point in one task: a timer that ends an exit cannot land between two.
const DRAW = `function (samples, ...roots) {
  const timed = [...new Set([this, ...roots].flatMap((root) => root.getAnimations()))]
    .map((animation) => ({ animation, end: Number(animation.effect?.getComputedTiming().endTime) }))
    .filter(({ animation, end }) => Number.isFinite(end) && end > 0 && animation.playState !== "finished");
  for (const at of samples) {
    for (const { animation, end } of timed) animation.currentTime = end * at;
    if (at < 1) void document.documentElement.offsetHeight;
  }
  return {
    drawn: timed.length,
    properties: [...new Set(timed.flatMap(({ animation }) =>
      (animation.effect?.getKeyframes() ?? []).flatMap((k) => Object.keys(k))))],
  };
}`;

interface Drawn {
  drawn: number;
  properties: string[];
}

/** Holds the document timeline still and lays each finite animation out at four fixed points, so its counts never follow the frames the host manages. */
export async function createAnimationStepper(cdp: CDPSession) {
  let mutations = 0;
  for (const event of MUTATIONS) cdp.on(event, () => mutations++);
  await cdp.send("DOM.enable", {});

  const evaluate = (expression: string) =>
    cdp.send("Runtime.evaluate", { expression, awaitPromise: true });

  async function draw(roots: string[]): Promise<Drawn> {
    const { result: page } = await cdp.send("Runtime.evaluate", { expression: "document" });
    const { result } = await cdp.send("Runtime.callFunctionOn", {
      objectId: page.objectId,
      functionDeclaration: DRAW,
      arguments: [{ value: SAMPLES }, ...roots.map((objectId) => ({ objectId }))],
      returnByValue: true,
    });
    return result.value;
  }

  return {
    async hold() {
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 });
      // The style a running animation left pending is flushed here, before the trace starts.
      await evaluate(LAYOUT);
    },
    release: () => cdp.send("Animation.setPlaybackRate", { playbackRate: 1 }),
    /** Lays out what the step started and what those animations start as they end; returns the properties they animate on the main thread. */
    async play(): Promise<string[]> {
      const animated = new Set<string>();
      for (let round = 0; round < ROUNDS; round++) {
        // A frame starts an animation, and the last round's end events fire in one.
        const before = mutations;
        await evaluate(TWO_FRAMES);
        const { drawn, properties } = await draw(await closedRoots(cdp));
        for (const property of properties) animated.add(property);
        // A page that still changes may start one more: a closed layer hands focus back, and the trigger fades.
        if (drawn === 0 && mutations === before) break;
      }
      return [...animated]
        .filter((p) => !COMPOSITED.includes(p) && !NOT_PROPERTIES.includes(p))
        .toSorted();
    },
  };
}
