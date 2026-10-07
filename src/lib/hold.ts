/** A press held this long, without moving, is a hold. Matches Android's long-press timeout, so the
 *  browser's own long press never wins the race. */
export const HOLD_MS = 350;

/** A tap ends inside this window, so it never shows the hold fill. The fill then grows on
 *  --duration-hold, which is HOLD_MS - HOLD_GRACE_MS. */
export const HOLD_GRACE_MS = 100;

const NATIVE_LONG_PRESS = ["contextmenu", "selectstart"] as const;
// Not pointercancel: Android may cancel the pointer before its own long press fires.
const RELEASE = ["pointerup", "touchend"] as const;

/** A fired hold spends the press: the browser's own long press (text selection, context menu)
 *  must not land on what the hold opened under the finger. Lasts until the release. */
export function spendLongPress(): void {
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
