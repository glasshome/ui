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

// A task queued from a frame callback runs after every other callback of that frame; a message, since a test may fake timers.
const afterFrame = async () => {
  await frame();
  const channel = new MessageChannel();
  await new Promise<void>((done) => {
    channel.port1.onmessage = () => done();
    channel.port2.postMessage(null);
  });
  channel.port1.close();
};

// A DOM that keeps changing, such as a ticking clock, counts as settled after this many frames.
const CHANGING_FRAMES = 60;

/**
 * Done once two frames in a row change no DOM and start no finite animation, and every one
 * started has run out. A ResizeObserver answer applied a frame later is such a change.
 */
export async function settle(): Promise<void> {
  let changed = false;
  const changes = new MutationObserver(() => (changed = true));
  for (const root of [document, ...CLOSED_ROOTS])
    changes.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
  try {
    let quiet = 0;
    let changing = 0;
    while (quiet < 2) {
      await afterFrame();
      const now = running();
      if (changed) changing++;
      quiet = now.length === 0 && (!changed || changing > CHANGING_FRAMES) ? quiet + 1 : 0;
      changed = false;
      // A cancelled animation rejects `finished`; it has stopped all the same.
      await Promise.race([
        Promise.all(now.map((a) => a.finished.catch(() => undefined))),
        stopped(now),
      ]);
    }
  } finally {
    changes.disconnect();
  }
}
