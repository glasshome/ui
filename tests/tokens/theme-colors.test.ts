import { describe, expect, it } from "vitest";
import {
	clamp,
	deriveDarkFromLight,
	ensureFullThemeColors,
	parseOklch,
	resolveThemeColors,
	type ThemeBaseColors,
	type ThemeColors,
	toOklch,
} from "../../src/tokens/theme-colors.js";

const BASE: ThemeBaseColors = {
	primary: "oklch(0.55 0.14 240)",
	accent: "oklch(0.6 0.2 195)",
	secondary: "oklch(0.96 0.01 250)",
	border: "oklch(0.9 0.01 250)",
	card: "oklch(0.98 0.005 250)",
	background: "oklch(0.99 0.003 250)",
};

const ALL_KEYS: (keyof ThemeColors)[] = [
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

describe("parseOklch / toOklch", () => {
	it("round-trips", () => {
		const parsed = parseOklch("oklch(0.55 0.14 240)");
		expect(parsed).toEqual({ l: 0.55, c: 0.14, h: 240 });
		expect(toOklch(0.55, 0.14, 240)).toBe("oklch(0.55 0.14 240)");
	});

	it("rejects non-oklch strings", () => {
		expect(parseOklch("#ffffff")).toBeNull();
		expect(parseOklch("rgb(0,0,0)")).toBeNull();
		expect(parseOklch("oklch(0.5 0.1 240 / 0.5)")).toBeNull();
	});

	it("clamp bounds values", () => {
		expect(clamp(5, 0, 1)).toBe(1);
		expect(clamp(-5, 0, 1)).toBe(0);
		expect(clamp(0.5, 0, 1)).toBe(0.5);
	});
});

describe("resolveThemeColors", () => {
	it("fills every ThemeColors field", () => {
		const full = resolveThemeColors(BASE, "light");
		for (const key of ALL_KEYS) expect(full[key], key).toBeTruthy();
	});

	it("derives popover from card and ring from accent", () => {
		const full = resolveThemeColors(BASE, "light");
		expect(full.popover).toBe(BASE.card);
		expect(full.ring).toBe(BASE.accent);
	});

	it("keeps derived colors parseable", () => {
		for (const mode of ["light", "dark"] as const) {
			const full = resolveThemeColors(BASE, mode);
			expect(parseOklch(full.muted), `${mode} muted`).not.toBeNull();
			expect(parseOklch(full.input), `${mode} input`).not.toBeNull();
		}
	});
});

describe("deriveDarkFromLight", () => {
	it("produces a full, parseable dark palette", () => {
		const dark = deriveDarkFromLight(BASE);
		for (const key of ALL_KEYS) {
			expect(parseOklch(dark[key]), key).not.toBeNull();
		}
	});

	it("darkens the background below the light background", () => {
		const dark = deriveDarkFromLight(BASE);
		const lightL = parseOklch(BASE.background)?.l ?? 0;
		const darkL = parseOklch(dark.background)?.l ?? 1;
		expect(darkL).toBeLessThan(lightL);
	});
});

describe("ensureFullThemeColors", () => {
	it("preserves explicit values from old data", () => {
		const full = ensureFullThemeColors({ ...BASE, muted: "oklch(0.5 0 0)" }, "light");
		expect(full.muted).toBe("oklch(0.5 0 0)");
	});

	it("fills missing fields from the base colors", () => {
		const full = ensureFullThemeColors(BASE, "light");
		for (const key of ALL_KEYS) expect(full[key], key).toBeTruthy();
	});
});
