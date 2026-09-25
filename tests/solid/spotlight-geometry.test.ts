import { describe, expect, it } from "vitest";
import { holePath, placeBubble } from "../../src/lib/spotlight-geometry.js";

const viewport = { width: 1000, height: 800 };
/* Mirrors spotlight-geometry.ts: --radius-md (20.4px at the default 16px root) plus 8. */
const TAIL_MARGIN = 20.4 + 8;

describe("holePath", () => {
	it("cuts a rounded hole, padded, out of the viewport rect", () => {
		const d = holePath(viewport, { x: 100, y: 200, width: 300, height: 50 }, 8, 12);
		expect(d.startsWith("M0 0H1000V800H0Z")).toBe(true);
		expect(d).toContain("M104 192");
		expect(d).toContain("H396");
	});

	it("keeps the same command count with no target, so the path interpolates", () => {
		const count = (d: string) => d.replace(/[^A-Za-z]/g, "").length;
		const withTarget = holePath(viewport, { x: 100, y: 200, width: 300, height: 50 }, 8, 12);
		const without = holePath(viewport, null, 8, 12);
		expect(count(without)).toBe(count(withTarget));
	});

	it("clamps the radius to half the padded box", () => {
		const d = holePath(viewport, { x: 10, y: 10, width: 4, height: 4 }, 0, 50);
		expect(d).toContain("A2 2");
	});
});

describe("placeBubble", () => {
	const bubble = { width: 288, height: 120 };

	it("sits above a target in the lower half", () => {
		const p = placeBubble(viewport, { x: 400, y: 700, width: 200, height: 60 }, bubble, 12, 12);
		expect(p.side).toBe("above");
		expect(p.y).toBe(700 - 12 - 120);
		expect(p.x).toBe(500 - 144);
	});

	it("sits below a target in the upper half", () => {
		const p = placeBubble(viewport, { x: 400, y: 40, width: 200, height: 60 }, bubble, 12, 12);
		expect(p.side).toBe("below");
		expect(p.y).toBe(40 + 60 + 12);
	});

	it("clamps to the viewport margin", () => {
		const p = placeBubble(viewport, { x: 0, y: 700, width: 40, height: 40 }, bubble, 12, 12);
		expect(p.x).toBe(12);
	});

	it("centres with no target", () => {
		const p = placeBubble(viewport, null, bubble, 12, 12);
		expect(p.side).toBe("center");
		expect(p.x).toBe(356);
		expect(p.y).toBe(340);
	});

	it("sits inside a target taller than half the viewport, near its top", () => {
		const p = placeBubble(viewport, { x: 100, y: 0, width: 200, height: 800 }, bubble, 12, 12);
		expect(p.side).toBe("inside");
		expect(p.y).toBe(0 + 12);
		expect(p.x).toBe(100 + 100 - 144);
	});

	it("points the tail at the anchor's centre, above", () => {
		const p = placeBubble(viewport, { x: 400, y: 700, width: 200, height: 60 }, bubble, 12, 12);
		expect(p.tail).toEqual({ x: 144 });
	});

	it("points the tail at the anchor's centre, below", () => {
		const p = placeBubble(viewport, { x: 400, y: 40, width: 200, height: 60 }, bubble, 12, 12);
		expect(p.tail).toEqual({ x: 144 });
	});

	it("clamps the tail to the bubble's low edge when the bubble is pinned to the left margin", () => {
		const p = placeBubble(viewport, { x: 0, y: 700, width: 40, height: 40 }, bubble, 12, 12);
		expect(p.x).toBe(12);
		expect(p.tail).toEqual({ x: TAIL_MARGIN });
	});

	it("clamps the tail to the bubble's high edge when the bubble is pinned to the right margin", () => {
		const p = placeBubble(viewport, { x: 960, y: 700, width: 40, height: 40 }, bubble, 12, 12);
		expect(p.tail).toEqual({ x: bubble.width - TAIL_MARGIN });
	});

	it("has no tail for a centred bubble", () => {
		const p = placeBubble(viewport, null, bubble, 12, 12);
		expect(p.tail).toBeNull();
	});

	it("has no tail for a bubble placed inside a tall target", () => {
		const p = placeBubble(viewport, { x: 100, y: 0, width: 200, height: 800 }, bubble, 12, 12);
		expect(p.tail).toBeNull();
	});
});
