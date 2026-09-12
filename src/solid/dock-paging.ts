/** A page is one strip-width of items. The last one is whatever is left. */
export function pageCount(scrollWidth: number, viewport: number): number {
	if (viewport <= 0) return 1;
	return Math.max(1, Math.ceil(scrollWidth / viewport));
}

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

/** The strip shows whole items: a half-drawn icon at the edge reads as damage, not as a hint. */
export function stripWidth(available: number, itemWidth: number, gap: number): number {
	if (available <= 0 || itemWidth <= 0) return available;
	const count = Math.max(1, Math.floor((available + gap) / (itemWidth + gap)));
	return Math.min(available, count * itemWidth + (count - 1) * gap);
}
