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

export interface BackgroundLayer {
	type: "solid" | "static" | "custom";
	id: string;
	fit?: "cover" | "contain" | "tile";
	/** 0 to 1: how far the wallpaper fades toward `--background`. */
	overlay?: number;
	/** 0 to 20, in px. */
	blur?: number;
	/** 0 to 1: how dark the corners fall. */
	vignette?: number;
}

/** The picture alone; visibility and softness belong to the theme, the same in both modes. */
export type BackgroundImage = Pick<BackgroundLayer, "type" | "id" | "fit">;

export interface BackgroundConfig extends BackgroundLayer {
	themed: boolean;
	url?: string;
	/** Shown in dark mode instead of the top-level picture. */
	dark?: BackgroundImage;
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
		/* Fixed per mode, not derived: destructive is read as text and as a filled
		 * surface with white on it, so both ends are contrast-tuned against the
		 * theme's ground rather than against whatever accent the preset picked. */
		destructive: mode === "light" ? "oklch(0.54 0.19 23.0704)" : "oklch(0.7106 0.1661 22.2162)",
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
