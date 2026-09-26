import type { JSX } from "solid-js";

const GAP = 12;
const EDGE = 16;
/* The least room kept below the panel's top, so a tile near the bottom still opens a usable panel. */
const MIN_HEIGHT = 240;

/** A panel beside the element that opened it: right when there is room, else left, else over it;
 *  top-aligned with it and kept on screen. */
export function besideAnchor(anchor: DOMRect, width: number): JSX.CSSProperties {
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const right = anchor.right + GAP;
	const left = anchor.left - GAP - width;
	const x =
		right + width <= vw - EDGE
			? right
			: left >= EDGE
				? left
				: Math.max(EDGE, Math.min(anchor.left, vw - EDGE - width));
	const y = Math.max(EDGE, Math.min(anchor.top, vh - EDGE - MIN_HEIGHT));
	return {
		left: `${x}px`,
		top: `${y}px`,
		translate: "none",
		width: `${Math.min(width, vw - 2 * EDGE)}px`,
		"max-width": "none",
		"max-height": `${vh - y - EDGE}px`,
	};
}
