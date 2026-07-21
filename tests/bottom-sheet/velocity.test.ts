import { describe, expect, it } from "vitest";
import { VelocityTracker } from "../../src/solid/bottom-sheet/velocity.js";

describe("VelocityTracker", () => {
	it("returns 0 with no samples", () => {
		const t = new VelocityTracker();
		expect(t.compute(100)).toBe(0);
	});

	it("returns 0 with a single sample", () => {
		const t = new VelocityTracker();
		t.add(10, 0);
		expect(t.compute(10)).toBe(0);
	});

	it("computes constant downward velocity in px/ms", () => {
		const t = new VelocityTracker();
		// 2 px per ms, straight down.
		for (let i = 0; i <= 5; i++) t.add(i * 20, i * 10);
		expect(t.compute(50)).toBeCloseTo(2, 5);
	});

	it("computes negative velocity for upward movement", () => {
		const t = new VelocityTracker();
		for (let i = 0; i <= 5; i++) t.add(100 - i * 10, i * 10);
		expect(t.compute(50)).toBeCloseTo(-1, 5);
	});

	it("ignores samples older than the velocity window", () => {
		const t = new VelocityTracker();
		// Ancient fast movement, then a slow recent tail.
		t.add(0, 0);
		t.add(500, 1);
		t.add(500, 1000);
		t.add(510, 1010);
		t.add(520, 1020);
		expect(t.compute(1020)).toBeCloseTo(1, 5);
	});

	it("reset clears history", () => {
		const t = new VelocityTracker();
		t.add(0, 0);
		t.add(100, 10);
		t.reset();
		expect(t.compute(10)).toBe(0);
	});

	it("returns 0 when a stationary press has zero displacement", () => {
		const t = new VelocityTracker();
		t.add(50, 0);
		t.add(50, 10);
		t.add(50, 20);
		expect(t.compute(20)).toBe(0);
	});
});
