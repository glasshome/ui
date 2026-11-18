import { CLOSED_ROOTS } from "./closed-roots";

const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));
const target = (a: Animation) => (a.effect instanceof KeyframeEffect ? a.effect.target : null);
// A dormant layer's content is skipped: its motion never ticks, and Chromium never settles its `finished`.
const dormant = (a: Animation) => target(a)?.closest("[data-dormant]") != null;
const finite = (a: Animation) =>
  a.playState === "running" && a.effect?.getComputedTiming().iterations !== Infinity && !dormant(a);
const running = () => [document, ...CLOSED_ROOTS].flatMap((r) => r.getAnimations()).filter(finite);

async function stopped(animations: Animation[]): Promise<void> {
  while (animations.some(finite)) await frame();
}

/** Done once two frames in a row start no finite animation, and every one started has run out. */
export async function settle(): Promise<void> {
  let quiet = 0;
  while (quiet < 2) {
    await frame();
    const now = running();
    quiet = now.length === 0 ? quiet + 1 : 0;
    // A cancelled animation rejects `finished`; it has stopped all the same.
    await Promise.race([
      Promise.all(now.map((a) => a.finished.catch(() => undefined))),
      stopped(now),
    ]);
  }
}
