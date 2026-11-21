import type { CDPSession } from "playwright";
import { MUTATIONS } from "./settle";

const SAMPLES = [0.25, 0.5, 0.75, 1];
const ROUNDS = 8;
const TWO_FRAMES = "new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))";
const LAYOUT = "void document.documentElement.offsetHeight";
const COMPOSITED = ["transform", "translate", "rotate", "scale", "opacity", "filter"];
const NOT_PROPERTIES = ["offset", "computedOffset", "easing", "composite"];
const PROPERTIES = `function () {
  return [...new Set((this.effect?.getKeyframes() ?? []).flatMap((k) => Object.keys(k)))];
}`;

/** Holds the document timeline still and lays each finite animation out at four fixed points, so its counts never follow the frames the host manages. */
export async function createAnimationStepper(cdp: CDPSession) {
  const started = new Map<string, number>();
  cdp.on("Animation.animationStarted", ({ animation }) => {
    const { delay, duration, iterations, endDelay } = animation.source ?? {};
    // CDP leaves `iterations` out of an endless animation.
    if (iterations === undefined || animation.playbackRate <= 0) return;
    const end = (delay ?? 0) + (duration ?? 0) * iterations + (endDelay ?? 0);
    if (end > 0) started.set(animation.id, end);
  });
  cdp.on("Animation.animationCanceled", ({ id }) => started.delete(id));
  await cdp.send("Animation.enable");
  let mutations = 0;
  for (const event of MUTATIONS) cdp.on(event, () => mutations++);
  await cdp.send("DOM.enable", {});

  const evaluate = (expression: string) =>
    cdp.send("Runtime.evaluate", { expression, awaitPromise: true });

  async function properties(id: string): Promise<string[]> {
    try {
      const { remoteObject } = await cdp.send("Animation.resolveAnimation", { animationId: id });
      const { result } = await cdp.send("Runtime.callFunctionOn", {
        objectId: remoteObject.objectId,
        functionDeclaration: PROPERTIES,
        returnByValue: true,
      });
      return Array.isArray(result.value) ? result.value : [];
    } catch {
      // The element left the page before the read.
      return [];
    }
  }

  return {
    async hold() {
      started.clear();
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 });
    },
    release: () => cdp.send("Animation.setPlaybackRate", { playbackRate: 1 }),
    /** Lays out what the step started and what those animations start as they end; returns the properties they animate on the main thread. */
    async play(): Promise<string[]> {
      const animated = new Set<string>();
      for (let round = 0; round < ROUNDS; round++) {
        // An animation is reported once a frame starts it, and the last round's end events fire in a frame.
        const before = mutations;
        await evaluate(TWO_FRAMES);
        // A page that still changes may start one more: a closed layer hands focus back, and the trigger fades.
        if (started.size === 0 && mutations === before) break;
        if (started.size === 0) continue;
        const byEnd = Map.groupBy([...started], ([, end]) => end);
        started.clear();
        const ids = [...byEnd.values()].flat().map(([id]) => id);
        // One at a time: resolving an animation releases the object the last resolve returned.
        for (const id of ids) {
          for (const property of await properties(id)) animated.add(property);
        }
        for (const at of SAMPLES) {
          for (const [end, group] of byEnd) {
            await cdp
              .send("Animation.seekAnimations", {
                animations: group.map(([id]) => id),
                currentTime: end * at,
              })
              // An animation whose element left the page fails the whole seek.
              .catch(() => undefined);
          }
          // A forced layout, never a frame: a timer that ends an exit has no time to land between two points. The end is drawn by the next frame, with what its end events change.
          if (at < 1) await evaluate(LAYOUT);
        }
      }
      return [...animated]
        .filter((p) => !COMPOSITED.includes(p) && !NOT_PROPERTIES.includes(p))
        .toSorted();
    },
  };
}
