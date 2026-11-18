/* A row of segments that runs out of width wraps into a grid whose rows hold an even count
 * (four modes go two by two, five go three and two), never a full row and an orphan. */

/** Classes for the element holding the items: one row, then the balanced grid once `data-wrapped` is set. */
export const BALANCED_ROWS =
  "grid grid-flow-col auto-cols-[minmax(max-content,1fr)] data-[wrapped]:grid-flow-row data-[wrapped]:grid-cols-[repeat(var(--balance-columns),minmax(max-content,1fr))]";

const SLACK_PX = 0.5;

const total = (widths: number[]) => widths.reduce((sum, w) => sum + w, 0);

/** Columns of the balanced grid, from each item's own width; 0 when one row holds them all. */
function balancedColumns(room: number, widths: number[]): number {
  const count = widths.length;
  if (count < 2 || total(widths) <= room + SLACK_PX) return 0;
  let columns = count - 1;
  for (; columns > 1; columns--) {
    let span = 0;
    for (let column = 0; column < columns; column++) {
      let widest = 0;
      for (let i = column; i < count; i += columns) widest = Math.max(widest, widths[i] ?? 0);
      span += widest;
    }
    if (span <= room + SLACK_PX) break;
  }
  return Math.ceil(count / Math.ceil(count / Math.max(columns, 1)));
}

/**
 * Lays `items` out in `BALANCED_ROWS`. `sizer` is the element that fills its line once wrapped
 * (it takes `data-wrapped` too); `item` selects the items among `items`' children.
 * Sizes come from a ResizeObserver only, never a layout read: on one row an item that overflows
 * sits at its own width, which the grid then needs.
 */
export function balanceRows(sizer: HTMLElement, items: HTMLElement, item: string): () => void {
  const each = () => [...items.querySelectorAll<HTMLElement>(`:scope > ${item}`)];
  const seen = new Map<Element, number>();
  let settled = new Map<Element, number>();
  let own: number[] = [];
  let columns = 0;
  let phase: "measure" | "settle" | "settled" = "measure";
  let frame = 0;

  const resize = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width =
        entry.target === items
          ? entry.contentRect.width
          : (entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width);
      seen.set(entry.target, width);
    }
    if (phase === "settle") return settle();
    if (phase === "measure" || columns === 0) return decide();
    const room = seen.get(items) ?? 0;
    if (Math.abs(room - (settled.get(items) ?? 0)) > SLACK_PX) return apply(room, own);
    if (changed()) remeasure();
  });

  const watch = () => {
    resize.disconnect();
    resize.observe(items);
    for (const el of each()) resize.observe(el);
  };

  const changed = () =>
    [...seen].some(([el, width]) => Math.abs(width - (settled.get(el) ?? width)) > SLACK_PX);

  const settle = () => {
    settled = new Map(seen);
    phase = "settled";
  };

  const layout = (next: number) => {
    columns = next;
    for (const el of [sizer, items]) {
      if (next > 0) el.setAttribute("data-wrapped", "");
      else el.removeAttribute("data-wrapped");
    }
    if (next > 0) items.style.setProperty("--balance-columns", String(next));
    else items.style.removeProperty("--balance-columns");
  };

  // A change made inside the observer's callback would resize what it observes, so it looks again a frame on.
  const relayout = (next: number, then: "measure" | "settle") => {
    resize.disconnect();
    layout(next);
    phase = then;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(watch);
  };

  const apply = (room: number, widths: number[]) => {
    const next = room > 0 ? balancedColumns(room, widths) : 0;
    if (next === columns) return settle();
    relayout(next, "settle");
  };

  const decide = () => {
    const room = seen.get(items) ?? 0;
    own = each().map((el) => seen.get(el) ?? 0);
    apply(room, own);
  };

  const remeasure = () => relayout(0, "measure");

  layout(0);
  watch();
  const children = new MutationObserver(remeasure);
  children.observe(items, { childList: true });
  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    children.disconnect();
  };
}
