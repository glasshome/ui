import type { CDPSession } from "playwright";

const SAMPLES = [0.25, 0.5, 0.75, 1];
const ROUNDS = 8;
const TWO_FRAMES = "new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))";
const COMPOSITED = ["transform", "translate", "rotate", "scale", "opacity", "filter"];
const NOT_PROPERTIES = ["offset", "computedOffset", "easing", "composite"];
const PROPERTIES = `function () {
  return [...new Set((this.effect?.getKeyframes() ?? []).flatMap((k) => Object.keys(k)))];
}`;

/** Holds the document timeline still and draws each finite animation at four fixed points, so its counts never follow the frames the host manages. */
export async function createAnimationStepper(cdp: CDPSession) {
  const ends = new Map<string, number>();
  cdp.on("Animation.animationStarted", ({ animation }) => {
    const { delay, duration, iterations, endDelay } = animation.source ?? {};
    // CDP leaves `iterations` out of an endless animation.
    if (iterations === undefined || animation.playbackRate <= 0) return;
    const end = (delay ?? 0) + (duration ?? 0) * iterations + (endDelay ?? 0);
    if (end > 0) ends.set(animation.id, end);
  });
  cdp.on("Animation.animationCanceled", ({ id }) => ends.delete(id));
  await cdp.send("Animation.enable");

  const frames = () => cdp.send("Runtime.evaluate", { expression: TWO_FRAMES, awaitPromise: true });

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
      ends.clear();
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 });
    },
    release: () => cdp.send("Animation.setPlaybackRate", { playbackRate: 1 }),
    /** Draws what the step started and what those animations start as they end; returns the properties they animate on the main thread. */
    async play(): Promise<string[]> {
      const animated = new Set<string>();
      for (let round = 0; round < ROUNDS; round++) {
        await frames();
        if (ends.size === 0) break;
        const byEnd = Map.groupBy([...ends], ([, end]) => end);
        ends.clear();
        for (const id of [...byEnd.values()].flat().map(([id]) => id)) {
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
          await frames();
        }
      }
      return [...animated]
        .filter((p) => !COMPOSITED.includes(p) && !NOT_PROPERTIES.includes(p))
        .toSorted();
    },
  };
}
