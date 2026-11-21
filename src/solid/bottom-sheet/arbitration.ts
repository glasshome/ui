// Decides drag vs scroll. Walks event.target ancestors; if any can still scroll in the drag
// direction, yield to scroll. Marker: data-sheet-no-drag (abort).

type Direction = "down" | "up";

// Geometry alone: only a scroller holds a scrollTop, and a false "up" costs just the rubber band.
function canScrollFurther(el: Element, dir: Direction): boolean {
  if (dir === "down") return el.scrollTop > 0;
  return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
}

export function hasNoDragAncestor(target: Element | null, root: Element): boolean {
  let cur: Element | null = target;
  while (cur && cur !== root.parentElement) {
    if (cur.hasAttribute("data-sheet-no-drag")) return true;
    cur = cur.parentElement;
  }
  return false;
}

export function scrollerAhead(target: Element | null, root: Element, dy: number): Element | null {
  const dir: Direction = dy > 0 ? "down" : "up";
  let cur: Element | null = target;
  while (cur && cur !== root.parentElement) {
    if (canScrollFurther(cur, dir)) return cur;
    if (cur === root) break;
    cur = cur.parentElement;
  }
  return null;
}

export function shouldDrag(target: Element | null, root: Element, dy: number, dx: number): boolean {
  if (Math.abs(dx) > Math.abs(dy)) return false;
  if (hasNoDragAncestor(target, root)) return false;
  return scrollerAhead(target, root, dy) === null;
}
