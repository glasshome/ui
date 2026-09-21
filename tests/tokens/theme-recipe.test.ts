import { describe, expect, it } from "vitest";
import { THEME_PRESETS } from "../../src/tokens/presets";
import { parseOklch } from "../../src/tokens/theme-colors";
import {
	isDerived,
	resolveRecipe,
	seedsFromColors,
	type ThemeRecipe,
} from "../../src/tokens/theme-recipe";

const base: ThemeRecipe = {
	v: 1,
	accent: "oklch(0.72 0.14 215)",
	surface: "oklch(0.98 0.005 215)",
	radius: 0.75,
	background: { type: "solid", id: "default", themed: true },
	darkLinked: true,
	set: { light: {}, dark: {} },
};

describe("resolveRecipe", () => {
	it("yields twelve parseable colors per mode", () => {
		const out = resolveRecipe(base);
		for (const mode of ["light", "dark"] as const) {
			const values = Object.values(out[mode]);
			expect(values).toHaveLength(12);
			for (const value of values) expect(parseOklch(value)).not.toBeNull();
		}
	});

	it("is pure", () => {
		expect(resolveRecipe(base)).toEqual(resolveRecipe(base));
	});

	it("a hand-set color wins, in its mode only", () => {
		const out = resolveRecipe({
			...base,
			set: { light: { border: "oklch(0.5 0.2 10)" }, dark: {} },
		});
		expect(out.light.border).toBe("oklch(0.5 0.2 10)");
		expect(out.dark.border).toBe(resolveRecipe(base).dark.border);
	});

	it("a new accent re-flows what is derived and leaves what is hand-set", () => {
		const pinned: ThemeRecipe = {
			...base,
			set: { light: { card: "oklch(0.9 0.02 80)" }, dark: {} },
		};
		const before = resolveRecipe(pinned);
		const after = resolveRecipe({ ...pinned, accent: "oklch(0.7 0.18 20)" });
		expect(after.light.primary).not.toBe(before.light.primary);
		expect(after.dark.primary).not.toBe(before.dark.primary);
		expect(after.light.card).toBe(before.light.card);
	});

	it("a new surface tints the ground in both modes", () => {
		const warm = resolveRecipe({ ...base, surface: "oklch(0.97 0.02 60)" });
		expect(parseOklch(warm.light.background)?.h).toBe(60);
		expect(parseOklch(warm.dark.background)?.h).toBe(60);
	});

	it("unlinked dark is a dark ground derived from the seeds", () => {
		const unlinked = resolveRecipe({ ...base, darkLinked: false }).dark;
		expect(parseOklch(unlinked.background)?.l).toBeLessThan(0.2);
		expect(parseOklch(unlinked.card)?.l).toBeGreaterThan(parseOklch(unlinked.background)?.l ?? 1);
	});

	it("isDerived tells hand-set from derived", () => {
		const recipe: ThemeRecipe = {
			...base,
			set: { light: { border: "oklch(0.5 0.2 10)" }, dark: {} },
		};
		expect(isDerived(recipe, "light", "border")).toBe(false);
		expect(isDerived(recipe, "dark", "border")).toBe(true);
	});
});

describe("seedsFromColors", () => {
	it("turns every preset into a recipe that resolves back to the same 24 colors", () => {
		for (const preset of THEME_PRESETS) {
			const recipe = seedsFromColors(preset.colors, preset.radius, preset.background);
			expect(resolveRecipe(recipe)).toEqual(preset.colors);
		}
	});

	it("keeps only the colors the derivation would not have produced", () => {
		const derived = resolveRecipe({ ...base, darkLinked: false });
		const recipe = seedsFromColors(derived, base.radius, base.background);
		expect(recipe.set).toEqual({ light: {}, dark: {} });
	});
});
