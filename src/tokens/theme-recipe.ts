import type { Material } from "./material.js";
import { findUnreadable, fixReadable } from "./readability.js";
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

/** The studio's glass tint: `auto` follows the background picture; the rest are fixed surfaces. */
export type GlassTint = "auto" | "cool" | "neutral" | "warm";

export const TINT_SURFACES: Record<Exclude<GlassTint, "auto">, string> = {
	cool: "oklch(0.965 0.02 240)",
	neutral: "oklch(0.97 0 0)",
	warm: "oklch(0.965 0.025 75)",
};

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
	/** What the studio's tint choice was; `surface` stays the value the math reads. Absent is a hand-set surface. */
	tint?: GlassTint;
	/** The glass material; absent is Frosted, so no stored theme moved when this arrived. */
	material?: Material;
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
		ground: { lTo: 0.15, c: 2.6, cMax: 0.07 },
		card: { lTo: 0.19, c: 2.6, cMax: 0.07 },
		border: { lTo: 0.27, c: 2.6, cMax: 0.08 },
		secondary: { lTo: 0.22, c: 2.6, cMax: 0.07 },
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

// The accent seed stays as chosen; per mode it lands on the nearest lightness that reads on its ground.
const SETTLED: (keyof ThemeColors)[] = ["primary", "ring", "mutedForeground", "destructive"];

/** A derived theme reads well without anyone fixing it: these move to the nearest passing lightness. */
function settle(colors: ThemeColors): ThemeColors {
	const out = { ...colors };
	const failing = new Set(findUnreadable(out).map((issue) => issue.text));
	for (const key of SETTLED) {
		if (failing.has(key)) out[key] = fixReadable(out, key) ?? out[key];
	}
	return out;
}

function derive(recipe: ThemeRecipe): ThemeColorsConfig {
	const lightBase = baseFromSeeds(recipe, "light");
	const light = resolveThemeColors(lightBase, "light");
	const dark = recipe.darkLinked
		? deriveDarkFromLight(lightBase)
		: resolveThemeColors(baseFromSeeds(recipe, "dark"), "dark");
	return { light: settle(light), dark: settle(dark) };
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
