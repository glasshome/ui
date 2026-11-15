import { CLOSED_ROOTS } from "./closed-roots";

const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));
const finite = (a: Animation) => a.effect?.getComputedTiming().iterations !== Infinity;

/** Two frames, then every finite animation in the page and the closed roots runs out. */
export async function settle(): Promise<void> {
  await frame();
  await frame();
  const running = [document, ...CLOSED_ROOTS].flatMap((r) => r.getAnimations()).filter(finite);
  // A cancelled animation rejects `finished`; it has stopped all the same.
  await Promise.all(running.map((a) => a.finished.catch(() => undefined)));
}
