/** A press held this long, without moving, is a hold. Matches Android's long-press timeout, so the
 *  browser's own long press never wins the race. */
export const HOLD_MS = 350;

/** A tap ends inside this window, so it never shows the hold fill. The fill then grows on
 *  --duration-hold, which is HOLD_MS - HOLD_GRACE_MS. */
export const HOLD_GRACE_MS = 100;
