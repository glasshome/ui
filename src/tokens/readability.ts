import { clamp, parseOklch, type ThemeColors, toOklch } from "./theme-colors.js";
import { contrastRatio } from "./theme-css.js";

type Key = keyof ThemeColors;

export interface ReadablePair {
	/** The color read as text, an icon or an indicator. */
	text: Key;
	surface: Key;
	/** 4.5 for text, 3 for icons and indicators (WCAG AA). */
	min: 4.5 | 3;
}

/* Foregrounds on the ground, cards and fills are picked black-or-white by
 * contrast, which always clears 4.5, so they are absent here. These are the
 * colors a theme author sets that are read against a surface. */
export const READABLE_PAIRS: ReadablePair[] = [
	{ text: "mutedForeground", surface: "background", min: 4.5 },
	{ text: "mutedForeground", surface: "card", min: 4.5 },
	{ text: "mutedForeground", surface: "muted", min: 4.5 },
	{ text: "destructive", surface: "background", min: 4.5 },
	{ text: "destructive", surface: "card", min: 4.5 },
	{ text: "primary", surface: "background", min: 3 },
	{ text: "primary", surface: "card", min: 3 },
	{ text: "ring", surface: "background", min: 3 },
];

export interface ReadabilityIssue extends ReadablePair {
	ratio: number;
}

export function findUnreadable(colors: ThemeColors): ReadabilityIssue[] {
	return READABLE_PAIRS.flatMap((pair) => {
		const ratio = contrastRatio(colors[pair.text], colors[pair.surface]);
		return ratio >= pair.min ? [] : [{ ...pair, ratio }];
	});
}

const STEP = 0.01;

function surfacesOf(text: Key): ReadablePair[] {
	return READABLE_PAIRS.filter((pair) => pair.text === text);
}

function clears(candidate: string, colors: ThemeColors, pairs: ReadablePair[]): boolean {
	return pairs.every((pair) => contrastRatio(candidate, colors[pair.surface]) >= pair.min);
}

/**
 * The nearest lightness of the text color that clears every surface it is read
 * on, hue and chroma kept. Null when no lightness can: the surfaces disagree
 * (one dark, one light), and only a different surface fixes that.
 */
export function fixReadable(colors: ThemeColors, text: Key): string | null {
	const parsed = parseOklch(colors[text]);
	if (!parsed) return null;
	const pairs = surfacesOf(text);
	for (let distance = STEP; distance <= 1; distance += STEP) {
		for (const direction of [-1, 1]) {
			const l = parsed.l + direction * distance;
			if (l < 0 || l > 1) continue;
			const candidate = toOklch(clamp(Number(l.toFixed(4)), 0, 1), parsed.c, parsed.h);
			if (clears(candidate, colors, pairs)) return candidate;
		}
	}
	return null;
}
