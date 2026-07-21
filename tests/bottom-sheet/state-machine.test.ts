import { describe, expect, it } from "vitest";
import {
	assertTransition,
	canTransition,
	type SheetState,
} from "../../src/solid/bottom-sheet/state-machine.js";

const STATES: SheetState[] = [
	"closed",
	"opening",
	"open",
	"pressing",
	"dragging",
	"snapping",
	"closing",
];

describe("canTransition", () => {
	it("allows the documented open/close lifecycle", () => {
		expect(canTransition("closed", "opening")).toBe(true);
		expect(canTransition("opening", "open")).toBe(true);
		expect(canTransition("open", "closing")).toBe(true);
		expect(canTransition("closing", "closed")).toBe(true);
	});

	it("allows the full drag cycle", () => {
		expect(canTransition("open", "pressing")).toBe(true);
		expect(canTransition("pressing", "dragging")).toBe(true);
		expect(canTransition("dragging", "snapping")).toBe(true);
		expect(canTransition("snapping", "open")).toBe(true);
	});

	it("allows canceling a press without a drag", () => {
		expect(canTransition("pressing", "open")).toBe(true);
	});

	it("allows reopening while closing (interrupted close)", () => {
		expect(canTransition("closing", "opening")).toBe(true);
	});

	it("rejects skipping states", () => {
		expect(canTransition("closed", "open")).toBe(false);
		expect(canTransition("open", "dragging")).toBe(false);
		expect(canTransition("dragging", "open")).toBe(false);
		expect(canTransition("closed", "closing")).toBe(false);
	});

	it("never allows a transition into closed except from closing", () => {
		for (const from of STATES) {
			if (from === "closing" || from === "closed") continue;
			expect(canTransition(from, "closed"), `${from} -> closed`).toBe(false);
		}
	});
});

describe("assertTransition", () => {
	it("is a no-op for same-state transitions", () => {
		for (const s of STATES) {
			expect(() => assertTransition(s, s)).not.toThrow();
		}
	});

	it("throws on invalid transitions outside production", () => {
		expect(() => assertTransition("closed", "open")).toThrow(/invalid transition/);
	});

	it("passes valid transitions through", () => {
		expect(() => assertTransition("closed", "opening")).not.toThrow();
	});
});
