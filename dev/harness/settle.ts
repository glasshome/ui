import { CLOSED_ROOTS } from "./closed-roots";

const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));
const finite = (a: Animation) =>
  a.playState === "running" && a.effect?.getComputedTiming().iterations !== Infinity;
const running = () => [document, ...CLOSED_ROOTS].flatMap((r) => r.getAnimations()).filter(finite);

/** Done once two frames in a row start no finite animation, and every one started has run out. */
export async function settle(): Promise<void> {
  let quiet = 0;
  while (quiet < 2) {
    await frame();
    const now = running();
    quiet = now.length === 0 ? quiet + 1 : 0;
    // A cancelled animation rejects `finished`; it has stopped all the same.
    await Promise.all(now.map((a) => a.finished.catch(() => undefined)));
  }
}
