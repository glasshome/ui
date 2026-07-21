import { describe, expect, it } from "vitest";
import { oklchToHex } from "../../src/tokens/hex.js";

describe("oklchToHex", () => {
	it("maps white and black exactly", () => {
		expect(oklchToHex("oklch(1 0 0)")).toBe("#ffffff");
		expect(oklchToHex("oklch(0 0 0)")).toBe("#000000");
	});

	it("maps a neutral gray to equal channels", () => {
		const hex = oklchToHex("oklch(0.5 0 0)");
		expect(hex).toMatch(/^#([0-9a-f]{2})\1\1$/);
	});

	it("gamut-maps out-of-gamut colors instead of clipping", () => {
		// Extremely chromatic green is outside sRGB; result must still be valid hex.
		const hex = oklchToHex("oklch(0.6 0.4 145)");
		expect(hex).toMatch(/^#[0-9a-f]{6}$/);
		// Chroma reduction keeps some of the other channels, unlike naive clipping
		// which would slam to pure #00ff00-style extremes.
		expect(hex).not.toBe("#00ff00");
	});

	it("throws on unparseable input", () => {
		expect(() => oklchToHex("not-a-color")).toThrow(/cannot parse/);
	});
});
