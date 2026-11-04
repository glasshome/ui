/* A row of segments that runs out of width wraps into a grid whose rows hold an even count
 * (four modes go two by two, five go three and two), never a full row and an orphan. */

/** Classes for the element holding the items: one row, then the balanced grid once `data-wrapped` is set. */
export const BALANCED_ROWS =
  "grid grid-flow-col auto-cols-[minmax(max-content,1fr)] data-[wrapped]:grid-flow-row data-[wrapped]:grid-cols-[repeat(var(--balance-columns),minmax(max-content,1fr))]";

const fits = (items: HTMLElement) => items.scrollWidth <= items.clientWidth;

function fit(sizer: HTMLElement, items: HTMLElement, count: number): void {
  const setColumns = (columns: number) =>
    items.style.setProperty("--balance-columns", String(columns));
  sizer.removeAttribute("data-wrapped");
  items.removeAttribute("data-wrapped");
  items.style.removeProperty("--balance-columns");
  if (count < 2 || fits(items)) return;
  sizer.setAttribute("data-wrapped", "");
  items.setAttribute("data-wrapped", "");
  let columns = count - 1;
  for (; columns > 1; columns--) {
    setColumns(columns);
    if (fits(items)) break;
  }
  setColumns(Math.ceil(count / Math.ceil(count / Math.max(columns, 1))));
}

/**
 * Lays `items` out in `BALANCED_ROWS`. `sizer` is the element that fills its line once wrapped
 * (it takes `data-wrapped` too); `item` selects the items among `items`' children.
 */
export function balanceRows(sizer: HTMLElement, items: HTMLElement, item: string): () => void {
  const each = () => items.querySelectorAll<HTMLElement>(`:scope > ${item}`);
  const run = () => {
    if (sizer.clientWidth === 0) return;
    fit(sizer, items, each().length);
  };
  run();
  // A frame late: a fit inside the observer's callback resizes what it observes.
  let frame = 0;
  const later = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(run);
  };
  // Items too: an icon or font that loads late widens a label without resizing the group.
  const resize = new ResizeObserver(later);
  const observe = () => {
    resize.disconnect();
    resize.observe(sizer);
    for (const el of each()) resize.observe(el);
  };
  observe();
  const children = new MutationObserver(() => {
    observe();
    later();
  });
  children.observe(items, { childList: true });
  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    children.disconnect();
  };
}
