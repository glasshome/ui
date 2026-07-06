/**
 * Theme color model + derivation. Framework-free: safe to import from servers,
 * build scripts, and non-Solid renderers.
 */

export interface ThemeColors {
	primary: string;
	accent: string;
	secondary: string;
	border: string;
	card: string;
	background: string;
	muted: string;
	mutedForeground: string;
	input: string;
	ring: string;
	destructive: string;
	popover: string;
}

export interface ThemeColorsConfig {
	light: ThemeColors;
	dark: ThemeColors;
}

export interface BackgroundConfig {
	type: "solid" | "static" | "custom";
	id: string;
	themed: boolean;
	url?: string;
	fit?: "cover" | "contain" | "tile";
	overlay?: number;
	blur?: number;
}

/** The 6 base colors used as input for resolving a full ThemeColors */
export type ThemeBaseColors = Pick<
	ThemeColors,
	"primary" | "accent" | "secondary" | "border" | "card" | "background"
>;

const OKLCH_REGEX =
	/^oklch\(\s*([+-]?(?:\d+\.?\d*|\.\d+))\s+([+-]?(?:\d+\.?\d*|\.\d+))\s+([+-]?(?:\d+\.?\d*|\.\d+))\s*\)$/i;

export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

function formatNumber(value: number) {
	if (Number.isInteger(value)) return String(value);
	return String(Number(value.toFixed(6)));
}

export function parseOklch(input: string): { l: number; c: number; h: number } | null {
	const match = OKLCH_REGEX.exec(input.trim());
	if (!match) return null;
	return {
		l: Number(match[1]),
		c: Number(match[2]),
		h: Number(match[3]),
	};
}

export function toOklch(l: number, c: number, h: number): string {
	return `oklch(${formatNumber(l)} ${formatNumber(c)} ${formatNumber(h)})`;
}

function adjustLightness(oklch: string, delta: number): string {
	const parsed = parseOklch(oklch);
	if (!parsed) return oklch;
	const l = clamp(parsed.l + delta, 0, 1);
	return toOklch(l, parsed.c, parsed.h);
}

function invertLightness(oklch: string, targetL: number): string {
	const parsed = parseOklch(oklch);
	if (!parsed) return oklch;
	return toOklch(clamp(targetL, 0, 1), clamp(parsed.c * 0.8, 0, 0.4), parsed.h);
}

/**
 * Resolve the 6 base colors into a full ThemeColors.
 * Used for presets and for backwards-compat with old DB data.
 */
export function resolveThemeColors(base: ThemeBaseColors, mode: "light" | "dark"): ThemeColors {
	return {
		...base,
		popover: base.card,
		muted:
			mode === "light"
				? adjustLightness(base.background, -0.015)
				: adjustLightness(base.background, 0.1),
		mutedForeground: mode === "light" ? "oklch(0.44 0 0)" : "oklch(0.71 0 0)",
		input:
			mode === "light" ? adjustLightness(base.border, 0.01) : adjustLightness(base.border, 0.04),
		ring: base.accent,
		destructive: mode === "light" ? "oklch(0.629 0.1902 23.0704)" : "oklch(0.7106 0.1661 22.2162)",
	};
}

export function deriveDarkFromLight(light: ThemeBaseColors): ThemeColors {
	const darkBase: ThemeBaseColors = {
		primary: adjustLightness(light.primary, 0.15),
		accent: adjustLightness(light.accent, 0.1),
		secondary: invertLightness(light.secondary, 0.14),
		border: invertLightness(light.border, 0.26),
		card: invertLightness(light.card, 0.17),
		background: invertLightness(light.background, 0.12),
	};
	return resolveThemeColors(darkBase, "dark");
}

const THEME_COLOR_KEYS: (keyof ThemeColors)[] = [
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

/**
 * Ensure a potentially partial colors object (from old DB data) has all fields.
 * Existing values are preserved; missing ones are resolved from the base colors.
 */
export function ensureFullThemeColors(
	partial: ThemeBaseColors & Partial<ThemeColors>,
	mode: "light" | "dark",
): ThemeColors {
	const resolved = resolveThemeColors(partial, mode);
	const result = { ...resolved };
	for (const key of THEME_COLOR_KEYS) {
		if (partial[key]) {
			result[key] = partial[key];
		}
	}
	return result;
}
