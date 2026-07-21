import { describe, expect, it } from "vitest";
import { oklchToHex } from "../../src/tokens/hex.js";
import { DEFAULT_THEME_ID, THEME_PRESETS } from "../../src/tokens/presets.js";
import { parseOklch, type ThemeColors } from "../../src/tokens/theme-colors.js";

const COLOR_KEYS: (keyof ThemeColors)[] = [
	"primary",
	"accent",
	"secondary",
	"border",
	"card",
	"background",
	"muted",
	"mutedForeground",
	"input",
	"ring",
	"destructive",
	"popover",
];

describe("THEME_PRESETS", () => {
	it("has unique ids", () => {
		const ids = THEME_PRESETS.map((p) => p.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("includes the default theme", () => {
		expect(THEME_PRESETS.some((p) => p.id === DEFAULT_THEME_ID)).toBe(true);
	});

	it("every preset has a full light and dark palette", () => {
		for (const p of THEME_PRESETS) {
			for (const mode of ["light", "dark"] as const) {
				for (const key of COLOR_KEYS) {
					expect(p.colors[mode][key], `${p.id} ${mode} ${key}`).toBeTruthy();
				}
			}
		}
	});

	it("every oklch color is parseable and hex-renderable", () => {
		for (const p of THEME_PRESETS) {
			for (const mode of ["light", "dark"] as const) {
				for (const key of COLOR_KEYS) {
					const value = p.colors[mode][key];
					if (!value.startsWith("oklch(")) continue;
					expect(parseOklch(value), `${p.id} ${mode} ${key}: ${value}`).not.toBeNull();
					expect(() => oklchToHex(value), `${p.id} ${mode} ${key}: ${value}`).not.toThrow();
				}
			}
		}
	});

	it("every preset ships a two-stop swatch", () => {
		for (const p of THEME_PRESETS) {
			expect(p.swatch, p.id).toHaveLength(2);
			for (const stop of p.swatch) expect(stop, p.id).toMatch(/^#[0-9a-fA-F]{6}$/);
		}
	});
});
