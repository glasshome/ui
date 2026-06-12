export type SheetState =
	| "closed"
	| "opening"
	| "open"
	| "pressing"
	| "dragging"
	| "snapping"
	| "closing";

type Transition = { from: SheetState; to: SheetState };

const VALID: Transition[] = [
	{ from: "closed", to: "opening" },
	{ from: "opening", to: "open" },
	{ from: "opening", to: "closing" },
	{ from: "open", to: "pressing" },
	{ from: "open", to: "closing" },
	{ from: "pressing", to: "dragging" },
	{ from: "pressing", to: "open" },
	{ from: "pressing", to: "closing" },
	{ from: "dragging", to: "snapping" },
	{ from: "dragging", to: "closing" },
	{ from: "snapping", to: "open" },
	{ from: "snapping", to: "closing" },
	{ from: "closing", to: "closed" },
	{ from: "closing", to: "opening" },
];

export function canTransition(from: SheetState, to: SheetState): boolean {
	return VALID.some((t) => t.from === from && t.to === to);
}

export function assertTransition(from: SheetState, to: SheetState): void {
	if (from === to) return;
	if (!canTransition(from, to)) {
		if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
			throw new Error(`[Sheet] invalid transition: ${from} → ${to}`);
		}
	}
}
