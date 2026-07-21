import { describe, expect, it } from "vitest";
import { glassToneText, toneTextMix } from "../../src/lib/glass-tone.js";

describe("toneTextMix", () => {
	it("stays inside the readable 46-70% band for every known tone", () => {
		for (const tone of [
			"var(--primary)",
			"var(--accent)",
			"var(--success)",
			"var(--warning)",
			"var(--destructive)",
			"var(--muted-foreground)",
		]) {
			const mix = toneTextMix(tone);
			expect(mix, tone).toBeGreaterThanOrEqual(46);
			expect(mix, tone).toBeLessThanOrEqual(70);
		}
	});

	it("mixes light tones further toward foreground than dark ones", () => {
		expect(toneTextMix("var(--warning)")).toBeLessThan(toneTextMix("var(--primary)"));
	});

	it("reads lightness out of a raw oklch color", () => {
		expect(toneTextMix("oklch(0.9 0.1 90)")).toBeLessThan(toneTextMix("oklch(0.3 0.1 90)"));
	});

	it("falls back to a mid mix for unparseable colors", () => {
		const mix = toneTextMix("#ff0000");
		expect(mix).toBeGreaterThanOrEqual(46);
		expect(mix).toBeLessThanOrEqual(70);
	});
});

describe("glassToneText", () => {
	it("mixes in oklab toward the foreground", () => {
		const css = glassToneText("var(--success)");
		expect(css).toMatch(/^color-mix\(in oklab, var\(--success\) \d+%, var\(--foreground\)\)$/);
	});
});
