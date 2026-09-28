import { createSignal } from "solid-js";

const DEFAULT_GAP_PX = 8;
const DRAG_THRESHOLD_PX = 6;

/**
 * Where a row dragged by dy lands: cross into a neighbor once the pointer
 * passes half that neighbor's height, using live measured heights so rows of
 * different sizes (e.g. one expanded) count at their real size.
 */
export function dragTargetIndex(heights: number[], from: number, dy: number): number {
  let to = from;
  let remaining = dy;
  if (dy < 0) {
    while (to > 0 && -remaining > (heights[to - 1] ?? 0) / 2) {
      remaining += heights[to - 1] ?? 0;
      to--;
    }
  } else {
    while (to < heights.length - 1 && remaining > (heights[to + 1] ?? 0) / 2) {
      remaining -= heights[to + 1] ?? 0;
      to++;
    }
  }
  return to;
}

export interface ListReorderOptions {
  /** Live row count; row elements beyond it are ignored. */
  count: () => number;
  /** Commit a completed drag (or keyboard move). Indices are pre-move. */
  onReorder: (from: number, to: number) => void;
  /** Fires when a drag actually activates (e.g. collapse the dragged row). */
  onDragStart?: (index: number) => void;
  /** Vertical gap between rows in px; neighbors shift by height + gap. */
  gapPx?: number;
}

export interface ListReorder {
  /** Attach as each row's ref so heights can be measured live. */
  setRowEl: (index: number, el: HTMLElement) => void;
  /**
   * Wire to pointerdown. immediate: a dedicated handle, drags at once, any
   * pointer type. Non-immediate: a whole clickable row, mouse/pen only
   * (touch must keep scrolling) and only past a movement threshold so plain
   * clicks keep their meaning.
   */
  startDrag: (index: number, e: PointerEvent, immediate: boolean) => void;
  /** Inline style for a row: the dragged row follows the pointer, rows
   * between origin and target shift one slot. Undefined when idle. */
  rowStyle: (index: number) => Record<string, string | number> | undefined;
  /** Index being dragged, undefined when idle. */
  draggingIndex: () => number | undefined;
  /** True from drag activation until the click that follows pointerup has
   * passed; row click/toggle handlers must ignore that click. */
  isToggleSuppressed: () => boolean;
}

/** Pointer-driven vertical list reorder. Rendering-agnostic: the consumer owns
 * the rows and applies rowStyle; this owns pointer tracking and drop math. */
export function createListReorder(opts: ListReorderOptions): ListReorder {
  const gap = opts.gapPx ?? DEFAULT_GAP_PX;
  const rowEls: Array<HTMLElement | undefined> = [];
  const [drag, setDrag] = createSignal<{ from: number; to: number; dy: number } | null>(null);
  // One-frame phase after a drop: transforms clear with transitions disabled,
  // otherwise every row animates from its dragged offset back to zero before
  // the reordered content appears (visible snap-back).
  const [settling, setSettling] = createSignal(false);
  let suppressToggle = false;

  const startDrag = (index: number, e: PointerEvent, immediate: boolean) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!immediate && e.pointerType === "touch") return;
    const el = e.currentTarget as HTMLElement;
    if (immediate) e.preventDefault();
    const startY = e.clientY;
    let active = false;
    const activate = (dy: number) => {
      active = true;
      suppressToggle = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // jsdom and detached elements: capture is best-effort
      }
      opts.onDragStart?.(index);
      setDrag({ from: index, to: index, dy });
    };
    const heights = () => rowEls.slice(0, opts.count()).map((row) => row?.offsetHeight ?? 0);
    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      if (!active) {
        if (Math.abs(dy) < DRAG_THRESHOLD_PX) return;
        activate(dy);
      }
      setDrag({ from: index, to: dragTargetIndex(heights(), index, dy), dy });
    };
    const onUp = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      const d = drag();
      if (active && d) {
        setSettling(true);
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(() => requestAnimationFrame(() => setSettling(false)));
        } else {
          setSettling(false);
        }
      }
      setDrag(null);
      if (active && d) opts.onReorder(d.from, d.to);
      setTimeout(() => {
        suppressToggle = false;
      }, 0);
    };
    if (immediate) activate(0);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  };

  const rowStyle = (index: number): Record<string, string | number> | undefined => {
    const d = drag();
    if (!d) return settling() ? { transition: "none" } : undefined;
    if (index === d.from) {
      return { transform: `translateY(${d.dy}px)`, transition: "none", "z-index": 10 };
    }
    const slot = (rowEls[d.from]?.offsetHeight ?? 0) + gap;
    if (d.to > d.from && index > d.from && index <= d.to) {
      return { transform: `translateY(-${slot}px)` };
    }
    if (d.to < d.from && index >= d.to && index < d.from) {
      return { transform: `translateY(${slot}px)` };
    }
    return undefined;
  };

  return {
    setRowEl: (index, el) => {
      rowEls[index] = el;
    },
    startDrag,
    rowStyle,
    draggingIndex: () => drag()?.from,
    isToggleSuppressed: () => suppressToggle,
  };
}
