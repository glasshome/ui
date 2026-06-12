// Decides drag vs scroll. Walks event.target ancestors; if any scrollable
// ancestor can still scroll in the drag direction, yield to scroll.
// Markers: data-sheet-no-drag (abort), data-sheet-scroll (force scrollable).

type Direction = "down" | "up";

function isScrollableAxis(el: Element): boolean {
	if (el.hasAttribute("data-sheet-scroll")) return true;
	const overflowY = getComputedStyle(el).overflowY;
	if (overflowY !== "auto" && overflowY !== "scroll" && overflowY !== "overlay") return false;
	return el.scrollHeight > el.clientHeight;
}

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

export function shouldDrag(target: Element | null, root: Element, dy: number, dx: number): boolean {
	if (Math.abs(dx) > Math.abs(dy)) return false;
	if (hasNoDragAncestor(target, root)) return false;

	const dir: Direction = dy > 0 ? "down" : "up";
	let cur: Element | null = target;
	while (cur && cur !== root.parentElement) {
		if (isScrollableAxis(cur) && canScrollFurther(cur, dir)) return false;
		if (cur === root) break;
		cur = cur.parentElement;
	}
	return true;
}
