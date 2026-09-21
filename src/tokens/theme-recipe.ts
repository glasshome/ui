import {
	type BackgroundConfig,
	clamp,
	deriveDarkFromLight,
	parseOklch,
	resolveThemeColors,
	type ThemeBaseColors,
	type ThemeColors,
	type ThemeColorsConfig,
	toOklch,
} from "./theme-colors.js";

export const RECIPE_VERSION = 1;

type Mode = "light" | "dark";

/** What was chosen, never what was computed: a stored theme re-derives on read. */
export interface ThemeRecipe {
	/** Selects the derivation table, so a change to the math never moves a stored theme. */
	v: typeof RECIPE_VERSION;
	accent: string;
	/** Tint and depth of the ground the glass sits on, as chosen for light. */
	surface: string;
	radius: number;
	background: BackgroundConfig;
	/** Dark is derived from the light result instead of from the seeds. */
	darkLinked: boolean;
	/** Hand-set colors only; everything absent is derived. */
	set: { light: Partial<ThemeColors>; dark: Partial<ThemeColors> };
}

interface Step {
	l?: number;
	lTo?: number;
	c?: number;
	cMax?: number;
}

const LADDER_V1: Record<
	Mode,
	Record<"ground" | "card" | "border" | "secondary" | "primary" | "accent", Step>
> = {
	light: {
		ground: {},
		card: { l: 0.015, c: 0.6 },
		border: { l: -0.08, c: 1.2, cMax: 0.06 },
		secondary: { l: -0.035 },
		primary: {},
		accent: { l: 0.05, c: 0.85 },
	},
	dark: {
		ground: { lTo: 0.14, c: 1.5, cMax: 0.04 },
		card: { lTo: 0.18, c: 1.5, cMax: 0.04 },
		border: { lTo: 0.26, c: 1.5, cMax: 0.05 },
		secondary: { lTo: 0.21, c: 1.5, cMax: 0.04 },
		primary: { l: 0.08 },
		accent: { l: 0.12, c: 0.85 },
	},
};

function step(color: string, by: Step): string {
	const parsed = parseOklch(color);
	if (!parsed) return color;
	const l = clamp(by.lTo ?? parsed.l + (by.l ?? 0), 0, 1);
	const c = clamp(parsed.c * (by.c ?? 1), 0, by.cMax ?? 0.4);
	return toOklch(l, c, parsed.h);
}

function baseFromSeeds(recipe: ThemeRecipe, mode: Mode): ThemeBaseColors {
	const ladder = LADDER_V1[mode];
	return {
		background: step(recipe.surface, ladder.ground),
		card: step(recipe.surface, ladder.card),
		border: step(recipe.surface, ladder.border),
		secondary: step(recipe.surface, ladder.secondary),
		primary: step(recipe.accent, ladder.primary),
		accent: step(recipe.accent, ladder.accent),
	};
}

function derive(recipe: ThemeRecipe): ThemeColorsConfig {
	const lightBase = baseFromSeeds(recipe, "light");
	const light = resolveThemeColors(lightBase, "light");
	const dark = recipe.darkLinked
		? deriveDarkFromLight(lightBase)
		: resolveThemeColors(baseFromSeeds(recipe, "dark"), "dark");
	return { light, dark };
}

export function resolveRecipe(recipe: ThemeRecipe): ThemeColorsConfig {
	const derived = derive(recipe);
	return {
		light: { ...derived.light, ...recipe.set.light },
		dark: { ...derived.dark, ...recipe.set.dark },
	};
}

export function isDerived(recipe: ThemeRecipe, mode: Mode, key: keyof ThemeColors): boolean {
	return recipe.set[mode][key] === undefined;
}

function differing(from: ThemeColors, stored: ThemeColors): Partial<ThemeColors> {
	const out: Partial<ThemeColors> = {};
	for (const key of Object.keys(stored) as (keyof ThemeColors)[]) {
		if (stored[key] !== from[key]) out[key] = stored[key];
	}
	return out;
}

/** A flat theme (a preset, a legacy row) as a recipe that resolves back to the same 24 colors. */
export function seedsFromColors(
	colors: ThemeColorsConfig,
	radius: number,
	background: BackgroundConfig,
): ThemeRecipe {
	const seeds: ThemeRecipe = {
		v: RECIPE_VERSION,
		accent: colors.light.primary,
		surface: colors.light.background,
		radius,
		background,
		darkLinked: false,
		set: { light: {}, dark: {} },
	};
	const derived = derive(seeds);
	return {
		...seeds,
		set: {
			light: differing(derived.light, colors.light),
			dark: differing(derived.dark, colors.dark),
		},
	};
}
