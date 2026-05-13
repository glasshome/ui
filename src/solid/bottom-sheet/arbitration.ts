/**
 * Decides whether a pending drag should commit or yield to scroll.
 *
 * Walks the DOM from event.target up to the sheet content, inspecting each
 * scrollable ancestor. If any ancestor in the drag direction can still scroll,
 * the gesture is treated as scroll and drag is rejected. Otherwise drag is
 * committed.
 *
 * Opt-in markers:
 *   data-sheet-no-drag  — abort drag entirely (e.g. sliders)
 *   data-sheet-scroll   — explicitly scrollable (treated as scrollable even
 *                          if computed style doesn't match)
 */

type Direction = "down" | "up";

function isScrollableAxis(el: Element): boolean {
  if (el.hasAttribute("data-sheet-scroll")) return true;
  const style = getComputedStyle(el);
  const overflowY = style.overflowY;
  if (overflowY !== "auto" && overflowY !== "scroll" && overflowY !== "overlay") return false;
  return el.scrollHeight > el.clientHeight;
}

function canScrollFurther(el: Element, dir: Direction): boolean {
  if (dir === "down") {
    return el.scrollTop > 0;
  }
  // up: drag up means content scrolls down — check if can still scroll down
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

/**
 * Returns true when drag should commit; false when scroll should win.
 *
 * @param target  The pointerdown event target.
 * @param root    The sheet Content element.
 * @param dy      Total vertical delta since press start.
 * @param dx      Total horizontal delta since press start.
 */
export function shouldDrag(target: Element | null, root: Element, dy: number, dx: number): boolean {
  // Axis lock — horizontal-dominant gesture never drags vertically.
  if (Math.abs(dx) > Math.abs(dy)) return false;

  if (hasNoDragAncestor(target, root)) return false;

  const dir: Direction = dy > 0 ? "down" : "up";

  let cur: Element | null = target;
  while (cur && cur !== root.parentElement) {
    if (isScrollableAxis(cur) && canScrollFurther(cur, dir)) {
      // A scrollable ancestor can still consume the scroll in this direction.
      // Yield to scroll.
      return false;
    }
    if (cur === root) break;
    cur = cur.parentElement;
  }

  return true;
}
