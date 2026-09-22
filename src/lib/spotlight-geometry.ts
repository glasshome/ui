export interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Viewport {
	width: number;
	height: number;
}

/* Outer rect plus a rounded rect, filled even-odd. With no target the hole
 * collapses to a point at the centre, same commands, so clip-path interpolates. */
export function holePath(
	viewport: Viewport,
	target: Box | null,
	pad: number,
	radius: number,
): string {
	const box = target
		? {
				x: target.x - pad,
				y: target.y - pad,
				width: target.width + pad * 2,
				height: target.height + pad * 2,
			}
		: { x: viewport.width / 2, y: viewport.height / 2, width: 0, height: 0 };
	const r = Math.max(0, Math.min(radius, box.width / 2, box.height / 2));
	const left = box.x;
	const top = box.y;
	const right = box.x + box.width;
	const bottom = box.y + box.height;
	const outer = `M0 0H${viewport.width}V${viewport.height}H0Z`;
	const hole =
		`M${left + r} ${top}H${right - r}A${r} ${r} 0 0 1 ${right} ${top + r}` +
		`V${bottom - r}A${r} ${r} 0 0 1 ${right - r} ${bottom}` +
		`H${left + r}A${r} ${r} 0 0 1 ${left} ${bottom - r}` +
		`V${top + r}A${r} ${r} 0 0 1 ${left + r} ${top}Z`;
	return outer + hole;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/* --radius-md (the panel's rounding) at the default 16px root: --radius 22.4px minus 2px. */
const PANEL_RADIUS = 20.4;
/* Keeps the tail off the rounded corners it would otherwise sit under. */
const TAIL_MARGIN = PANEL_RADIUS + 8;

export function placeBubble(
	viewport: Viewport,
	target: Box | null,
	bubble: { width: number; height: number },
	gap: number,
	margin: number,
): {
	x: number;
	y: number;
	side: "above" | "below" | "center" | "inside";
	tail: { x: number } | null;
} {
	if (!target) {
		return {
			x: (viewport.width - bubble.width) / 2,
			y: (viewport.height - bubble.height) / 2,
			side: "center",
			tail: null,
		};
	}
	const rawX = target.x + target.width / 2 - bubble.width / 2;
	if (target.height > viewport.height / 2) {
		return {
			x: clamp(rawX, margin, viewport.width - bubble.width - margin),
			y: clamp(target.y + gap, margin, viewport.height - bubble.height - margin),
			side: "inside",
			tail: null,
		};
	}
	const centreY = target.y + target.height / 2;
	const side = centreY > viewport.height / 2 ? "above" : "below";
	const rawY = side === "above" ? target.y - gap - bubble.height : target.y + target.height + gap;
	const x = clamp(rawX, margin, viewport.width - bubble.width - margin);
	const anchorCentre = target.x + target.width / 2;
	return {
		x,
		y: clamp(rawY, margin, viewport.height - bubble.height - margin),
		side,
		tail: { x: clamp(anchorCentre - x, TAIL_MARGIN, bubble.width - TAIL_MARGIN) },
	};
}
