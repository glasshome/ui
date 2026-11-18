/* A row of segments that runs out of width wraps into a grid whose rows hold an even count
 * (four modes go two by two, five go three and two), never a full row and an orphan. */

/** Marks the element holding the items: a wrapping row, then the balanced grid once `data-wrapped` is set (globals.css). */
export const BALANCED_ROWS = "data-balanced-rows";

/** Marks the node inside each item that sizes to its content in either layout. */
export const BALANCE_CONTENT = "data-balance-content";

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

const inline = (sizes: readonly ResizeObserverSize[] | undefined, fallback: number) =>
  sizes?.[0]?.inlineSize ?? fallback;

/**
 * Lays `items` out in `BALANCED_ROWS`. `sizer` is the element that fills its line once wrapped
 * (it takes `data-wrapped` too); `item` selects the items among `items`' children, each holding
 * one `BALANCE_CONTENT` node. Sizes come from a ResizeObserver only, never a layout read: an
 * item's own width is its content node's width plus its padding and border, the same in either
 * layout, so only the column count waits a frame, and the wrapping row never overflows meanwhile.
 */
export function balanceRows(sizer: HTMLElement, items: HTMLElement, item: string): () => void {
  const content = `[${BALANCE_CONTENT}]`;
  const each = () => [...items.querySelectorAll<HTMLElement>(`:scope > ${item}`)];
  const own = new WeakMap<Element, number>();
  const chrome = new WeakMap<Element, number>();
  let room = 0;
  let columns = 0;
  let frame = 0;

  const widths = (): number[] | undefined => {
    const out: number[] = [];
    for (const el of each()) {
      const inner = el.querySelector(content);
      const width = inner ? own.get(inner) : undefined;
      const edge = chrome.get(el);
      if (width === undefined || edge === undefined) return undefined;
      out.push(width + edge);
    }
    return out;
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

  // A layout change inside any ResizeObserver callback resizes what other observers watch and loops, so it waits a frame.
  const decide = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const known = widths();
      if (!known) return;
      const next = room > 0 ? balancedColumns(room, known) : 0;
      if (next !== columns) layout(next);
    });
  };

  const resize = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const border = inline(entry.borderBoxSize, entry.contentRect.width);
      if (entry.target === items) room = entry.contentRect.width;
      else if (entry.target.hasAttribute(BALANCE_CONTENT)) own.set(entry.target, border);
      else chrome.set(entry.target, border - inline(entry.contentBoxSize, entry.contentRect.width));
    }
    decide();
  });

  const watch = () => {
    resize.disconnect();
    resize.observe(items);
    for (const el of each()) {
      resize.observe(el);
      const inner = el.querySelector(content);
      if (inner) resize.observe(inner);
    }
  };

  layout(0);
  watch();
  const children = new MutationObserver(watch);
  children.observe(items, { childList: true });
  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    children.disconnect();
  };
}
