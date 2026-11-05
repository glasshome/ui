/** A press held this long, without moving, is a hold. Matches Android's long-press timeout, so the
 *  browser's own long press never wins the race. */
export const HOLD_MS = 350;

/** A tap ends inside this window, so it never shows the hold fill. The fill then grows on
 *  --duration-hold, which is HOLD_MS - HOLD_GRACE_MS. */
export const HOLD_GRACE_MS = 100;

const HOLD_SLOP_PX = 10;
const NATIVE_LONG_PRESS = ["contextmenu", "selectstart"] as const;
// Not pointercancel: Android may cancel the pointer before its own long press fires.
const RELEASE = ["pointerup", "touchend"] as const;

function spendPress(): void {
  if (typeof document === "undefined") return;
  const cancel = (e: Event) => e.preventDefault();
  for (const type of NATIVE_LONG_PRESS) document.addEventListener(type, cancel, true);
  const release = () => {
    clearTimeout(fallback);
    for (const type of RELEASE) window.removeEventListener(type, onEnd, true);
    for (const type of NATIVE_LONG_PRESS) document.removeEventListener(type, cancel, true);
  };
  const onEnd = () => setTimeout(release, 0);
  // A release that never reaches the window (its target left the DOM) must not leave selection off.
  const fallback = setTimeout(release, 5000);
  for (const type of RELEASE) window.addEventListener(type, onEnd, true);
}

/** A fired hold spends the press: the browser's own long press (text selection, context menu)
 *  must not land on what the hold opened under the finger. Lasts until the release.
 *  @deprecated use createHold, which also spends the release. */
export function spendLongPress(): void {
  spendPress();
}

/** The release of a fired hold belongs to the hold: a finger's compat mousedown and click, or a
 *  mouse's click, never reach what the hold opened under the pointer. */
function spendRelease(): () => void {
  const stopTouch = (e: Event) => {
    if (e.cancelable) e.preventDefault();
    window.removeEventListener("touchend", stopTouch, true);
  };
  const swallow = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    off();
  };
  const afterUp = () => setTimeout(off, 0);
  const off = () => {
    window.removeEventListener("touchend", stopTouch, true);
    window.removeEventListener("click", swallow, true);
    window.removeEventListener("pointerup", afterUp, true);
    window.removeEventListener("pointercancel", off, true);
  };
  window.addEventListener("touchend", stopTouch, { capture: true, passive: false });
  window.addEventListener("click", swallow, true);
  window.addEventListener("pointerup", afterUp, true);
  window.addEventListener("pointercancel", off, true);
  return off;
}

export interface HoldOptions {
  onHold: () => void;
  delayMs?: number;
  slopPx?: number;
  /** The press outlasted a tap: show the hold fill from where it started. */
  onArm?: (at: { x: number; y: number }) => void;
  /** The armed press ended, fired or not, or moved away. */
  onDisarm?: () => void;
}

export interface Hold {
  down: (e: PointerEvent) => void;
  move: (e: PointerEvent) => void;
  up: () => void;
  cancel: () => void;
  /** The current press, or the last one, became a hold. */
  fired: () => boolean;
}

/** The one hold door: a press held still for `delayMs` calls `onHold`, after it spends the
 *  press and its release so neither lands on what the hold opened. */
export function createHold(opts: HoldOptions): Hold {
  let grace: ReturnType<typeof setTimeout> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let start = { x: 0, y: 0 };
  let armed = false;
  let didFire = false;
  let unspend: (() => void) | undefined;

  const stop = () => {
    clearTimeout(grace);
    clearTimeout(timer);
    grace = timer = undefined;
    if (armed) opts.onDisarm?.();
    armed = false;
  };

  return {
    down(e) {
      stop();
      unspend?.();
      unspend = undefined;
      didFire = false;
      start = { x: e.clientX, y: e.clientY };
      const delay = opts.delayMs ?? HOLD_MS;
      grace = setTimeout(
        () => {
          armed = true;
          opts.onArm?.(start);
        },
        Math.min(HOLD_GRACE_MS, delay),
      );
      timer = setTimeout(() => {
        timer = undefined;
        didFire = true;
        spendPress();
        unspend = spendRelease();
        opts.onHold();
      }, delay);
    },
    move(e) {
      if (timer === undefined) return;
      const slop = opts.slopPx ?? HOLD_SLOP_PX;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > slop) stop();
    },
    up: stop,
    cancel() {
      stop();
      unspend?.();
      unspend = undefined;
    },
    fired: () => didFire,
  };
}
