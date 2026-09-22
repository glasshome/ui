import type { Material } from "./material.js";
import {
	type BackgroundConfig,
	deriveDarkFromLight,
	resolveThemeColors,
	type ThemeBaseColors,
	type ThemeColorsConfig,
} from "./theme-colors.js";

export interface ThemePreset {
	id: string;
	name: string;
	radius: number;
	colors: ThemeColorsConfig;
	background: BackgroundConfig;
	/** Curated two-stop gradient used for theme picker dots and marketing swatches. */
	swatch: [string, string];
	/** Absent: Frosted. */
	material?: Material;
}

export const DEFAULT_THEME_ID = "midnight-glass";

/** Font stacks as shipped in styles/theme.css. */
export const FONT_SANS = '"Geist Variable", ui-sans-serif, system-ui, sans-serif';
export const FONT_MONO = '"GeistMono Variable", "JetBrains Mono", "Fira Code", Consolas, monospace';

function bg(id: string, options?: { url?: string; themed?: boolean }): BackgroundConfig {
	const type = id === "default" ? "solid" : "static";
	return { type, id, themed: options?.themed ?? true, url: options?.url };
}

function preset(
	id: string,
	name: string,
	radius: number,
	swatch: [string, string],
	light: ThemeBaseColors,
	background: BackgroundConfig,
	dark?: ThemeBaseColors,
	material?: Material,
): ThemePreset {
	return {
		id,
		name,
		radius,
		swatch,
		material,
		colors: {
			light: resolveThemeColors(light, "light"),
			dark: dark ? resolveThemeColors(dark, "dark") : deriveDarkFromLight(light),
		},
		background,
	};
}

export const THEME_PRESETS: ThemePreset[] = [
	// Midnight Glass — hand-tuned, canonical palette from styles/theme.css.
	{
		id: "midnight-glass",
		name: "Midnight Glass",
		radius: 1.4,
		swatch: ["#1a6baa", "#22b8cf"],
		colors: {
			light: {
				primary: "oklch(0.48 0.2 215.221)",
				accent: "oklch(0.6 0.2 195)",
				secondary: "oklch(0.96 0.01 250)",
				border: "oklch(0.855 0.014 250)",
				card: "oklch(0.96 0.005 250)",
				background: "oklch(0.995 0.003 250)",
				popover: "oklch(0.937 0.006 250)",
				muted: "oklch(0.9702 0.008 250)",
				mutedForeground: "oklch(0.34 0 0)",
				input: "oklch(0.85 0.016 250)",
				// The focus ring follows primary here, not the derived accent: the two
				// are different hues, so an accent ring landed teal on blue controls.
				// See the light block of styles/theme.css.
				ring: "oklch(0.48 0.2 215.221)",
				destructive: "oklch(0.54 0.19 23.0704)",
			},
			dark: {
				primary: "oklch(0.48 0.2 215.221)",
				accent: "oklch(0.6 0.2 195)",
				secondary: "oklch(0.14 0.01 250)",
				border: "oklch(0.26 0.012 250)",
				card: "oklch(0.17 0.01 250)",
				background: "oklch(0.12 0.01 250)",
				popover: "oklch(0.11 0.005 250)",
				muted: "oklch(0.22 0.02 250)",
				mutedForeground: "oklch(0.81 0 0)",
				input: "oklch(0.19 0.01 250)",
				ring: "oklch(0.6 0.2 195)",
				destructive: "oklch(0.7106 0.1661 22.2162)",
			},
		},
		background: bg("geometric-houses", { url: "/backgrounds/geometric-houses.svg" }),
	},
	preset(
		"sunrise-studio",
		"Sunrise Studio",
		1.1,
		["#e8590c", "#fab005"],
		{
			primary: "oklch(0.68 0.16 50)",
			accent: "oklch(0.74 0.14 28)",
			secondary: "oklch(0.92 0.04 82)",
			border: "oklch(0.84 0.03 78)",
			card: "oklch(0.96 0.02 85)",
			background: "oklch(0.985 0.01 90)",
		},
		bg("diagonal-stripes"),
	),
	preset(
		"forest-zen",
		"Forest Zen",
		1.6,
		["#2f9e44", "#12b886"],
		{
			primary: "oklch(0.58 0.13 145)",
			accent: "oklch(0.66 0.1 165)",
			secondary: "oklch(0.9 0.03 150)",
			border: "oklch(0.82 0.02 155)",
			card: "oklch(0.95 0.01 150)",
			background: "oklch(0.98 0.01 160)",
		},
		bg("trees"),
	),
	preset(
		"lavender-dreams",
		"Lavender Dreams",
		1.8,
		["#9c36b5", "#e64980"],
		{
			primary: "oklch(0.62 0.14 300)",
			accent: "oklch(0.7 0.12 320)",
			secondary: "oklch(0.93 0.03 290)",
			border: "oklch(0.85 0.03 295)",
			card: "oklch(0.97 0.02 300)",
			background: "oklch(0.99 0.01 305)",
		},
		bg("streets", { url: "/backgrounds/streets.svg" }),
	),
	preset(
		"coral-reef",
		"Coral Reef",
		1.25,
		["#e03131", "#fd7e14"],
		{
			primary: "oklch(0.66 0.19 20)",
			accent: "oklch(0.7 0.16 45)",
			secondary: "oklch(0.91 0.04 35)",
			border: "oklch(0.83 0.03 28)",
			card: "oklch(0.96 0.02 25)",
			background: "oklch(0.985 0.01 30)",
		},
		bg("beauty-over-cliff", { url: "/backgrounds/beauty-over-cliff.jpg", themed: false }),
	),
	preset(
		"monochrome-pro",
		"Monochrome Pro",
		0,
		["#868e96", "#495057"],
		{
			primary: "oklch(0.4 0.01 260)",
			accent: "oklch(0.55 0.01 260)",
			secondary: "oklch(0.94 0.005 260)",
			border: "oklch(0.86 0.005 260)",
			card: "oklch(0.98 0.003 260)",
			background: "oklch(0.995 0.002 260)",
		},
		bg("grid"),
	),
	preset(
		"ocean-breeze",
		"Ocean Breeze",
		1.5,
		["#1098ad", "#3b5bdb"],
		{
			primary: "oklch(0.6 0.16 235)",
			accent: "oklch(0.68 0.11 205)",
			secondary: "oklch(0.92 0.03 225)",
			border: "oklch(0.84 0.02 230)",
			card: "oklch(0.97 0.01 230)",
			background: "oklch(0.99 0.01 235)",
		},
		bg("abstract-pattern", { url: "/backgrounds/ride-the-wave.svg" }),
	),
	preset(
		"retrowave",
		"Retrowave",
		1.2,
		["#ff2bd6", "#35e0ff"],
		{
			primary: "oklch(0.58 0.24 345)",
			accent: "oklch(0.6 0.14 215)",
			secondary: "oklch(0.93 0.03 320)",
			border: "oklch(0.84 0.04 320)",
			card: "oklch(0.96 0.02 320)",
			background: "oklch(0.98 0.015 320)",
		},
		bg("sunset-grid", { url: "/backgrounds/sunset-grid.svg" }),
		{
			primary: "oklch(0.68 0.27 345)",
			accent: "oklch(0.8 0.14 205)",
			secondary: "oklch(0.2 0.06 290)",
			border: "oklch(0.34 0.1 300)",
			card: "oklch(0.19 0.07 290)",
			background: "oklch(0.13 0.06 285)",
		},
		{ v: 1, preset: "neon", dials: { glow: 24 } },
	),
];

export function getAllPresets(): ThemePreset[] {
	return THEME_PRESETS;
}

export function getPreset(id: string): ThemePreset | undefined {
	return THEME_PRESETS.find((p) => p.id === id);
}
