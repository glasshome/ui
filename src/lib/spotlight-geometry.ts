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

export function placeBubble(
	viewport: Viewport,
	target: Box | null,
	bubble: { width: number; height: number },
	gap: number,
	margin: number,
): { x: number; y: number; side: "above" | "below" | "center" } {
	if (!target) {
		return {
			x: (viewport.width - bubble.width) / 2,
			y: (viewport.height - bubble.height) / 2,
			side: "center",
		};
	}
	const centreY = target.y + target.height / 2;
	const side = centreY > viewport.height / 2 ? "above" : "below";
	const rawY = side === "above" ? target.y - gap - bubble.height : target.y + target.height + gap;
	const rawX = target.x + target.width / 2 - bubble.width / 2;
	return {
		x: clamp(rawX, margin, viewport.width - bubble.width - margin),
		y: clamp(rawY, margin, viewport.height - bubble.height - margin),
		side,
	};
}
