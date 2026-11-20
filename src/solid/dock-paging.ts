/** The page a scroll position sits on, counting a half-page as turned. */
export function pageOf(scrollLeft: number, viewport: number): number {
  if (viewport <= 0) return 0;
  return Math.round(scrollLeft / viewport);
}

/** Where to scroll for a page, clamped to the end of the strip. */
export function pageOffset(page: number, viewport: number, scrollWidth: number): number {
  const max = Math.max(0, scrollWidth - viewport);
  return Math.min(max, Math.max(0, page * viewport));
}

/** Where a dragged item lands: the slot whose midpoint is nearest the pointer. */
export function slotAt(mids: readonly number[], pointer: number): number {
  let best = 0;
  let bestGap = Number.POSITIVE_INFINITY;
  mids.forEach((mid, i) => {
    const gap = Math.abs(mid - pointer);
    if (gap < bestGap) {
      best = i;
      bestGap = gap;
    }
  });
  return best;
}

/** The ids with one moved to a slot; the others keep their order. */
export function moveId(ids: readonly string[], id: string, to: number): string[] {
  const from = ids.indexOf(id);
  if (from < 0) return [...ids];
  const rest = ids.filter((_, i) => i !== from);
  rest.splice(Math.max(0, Math.min(rest.length, to)), 0, id);
  return rest;
}

export type EdgeZone = "left" | "right" | "bottom";

/** The viewport edge a pointer is closest to for a dock being carried: outer quarters are the sides, the lower part of the middle is the bottom, the rest is no edge. */
export function edgeZone(
  point: { x: number; y: number },
  viewport: { width: number; height: number },
): EdgeZone | null {
  if (viewport.width <= 0 || viewport.height <= 0) return null;
  if (point.x < viewport.width * 0.25) return "left";
  if (point.x > viewport.width * 0.75) return "right";
  if (point.y > viewport.height * 0.6) return "bottom";
  return null;
}
