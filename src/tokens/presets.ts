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

function bg(
	id: string,
	options?: {
		url?: string;
		themed?: boolean;
		night?: string;
		overlay?: number;
		blur?: number;
		vignette?: number;
	},
): BackgroundConfig {
	const type = id === "default" ? "solid" : "static";
	const dark = options?.night ? { type: "static" as const, id: options.night } : undefined;
	const { url, overlay, blur, vignette } = options ?? {};
	return { type, id, themed: options?.themed ?? true, url, dark, overlay, blur, vignette };
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
		background: bg("glass-house", {
			url: "/backgrounds/glass-house.webp",
			themed: false,
			night: "glass-house-night",
			vignette: 0.65,
		}),
	},
	preset(
		"sunrise-studio",
		"Sunrise Studio",
		1.1,
		["#e8590c", "#f7e3c6"],
		{
			primary: "oklch(0.56 0.13 48)",
			accent: "oklch(0.54 0.11 35)",
			secondary: "oklch(0.93 0.02 70)",
			border: "oklch(0.84 0.025 65)",
			card: "oklch(0.99 0.008 75)",
			background: "oklch(0.945 0.02 72)",
		},
		bg("studio-geometric", {
			url: "/backgrounds/studio-geometric.svg",
			night: "studio-night",
		}),
		{
			primary: "oklch(0.78 0.11 62)",
			accent: "oklch(0.72 0.1 42)",
			secondary: "oklch(0.3 0.025 55)",
			border: "oklch(0.4 0.03 55)",
			card: "oklch(0.27 0.025 55)",
			background: "oklch(0.17 0.022 55)",
		},
		{ v: 1, preset: "paper" },
	),
	preset(
		"forest-zen",
		"Forest Zen",
		1.6,
		["#2b8a3e", "#a9c7b0"],
		{
			primary: "oklch(0.5 0.12 150)",
			accent: "oklch(0.5 0.09 170)",
			secondary: "oklch(0.92 0.025 150)",
			border: "oklch(0.83 0.02 155)",
			card: "oklch(0.99 0.008 150)",
			background: "oklch(0.945 0.015 160)",
		},
		bg("forest-mist", {
			url: "/backgrounds/forest-mist.webp",
			themed: false,
			night: "forest-mist-night",
			vignette: 0.65,
		}),
		{
			primary: "oklch(0.74 0.12 150)",
			accent: "oklch(0.72 0.08 175)",
			secondary: "oklch(0.24 0.025 160)",
			border: "oklch(0.33 0.025 160)",
			card: "oklch(0.25 0.02 160)",
			background: "oklch(0.15 0.02 165)",
		},
		{ v: 1, preset: "frosted", dials: { clarity: 82 } },
	),
	preset(
		"lavender-dreams",
		"Lavender Dreams",
		1.8,
		["#845ef7", "#fff4e6"],
		{
			primary: "oklch(0.5 0.14 305)",
			accent: "oklch(0.52 0.12 325)",
			secondary: "oklch(0.93 0.025 300)",
			border: "oklch(0.85 0.025 300)",
			card: "oklch(0.975 0.012 90)",
			background: "oklch(0.97 0.015 85)",
		},
		bg("lavender-ink"),
		{
			primary: "oklch(0.76 0.12 305)",
			accent: "oklch(0.76 0.1 325)",
			secondary: "oklch(0.26 0.04 310)",
			border: "oklch(0.36 0.045 310)",
			card: "oklch(0.23 0.045 312)",
			background: "oklch(0.18 0.045 315)",
		},
		{ v: 1, preset: "paper", dials: { ink: 1 } },
	),
	preset(
		"coral-reef",
		"Liquid Glass",
		0.9,
		["#0e1426", "#5fd4e8"],
		{
			primary: "oklch(0.5 0.11 225)",
			accent: "oklch(0.52 0.16 345)",
			secondary: "oklch(0.93 0.008 260)",
			border: "oklch(0.85 0.012 260)",
			card: "oklch(0.99 0.004 260)",
			background: "oklch(0.94 0.008 260)",
		},
		bg("liquid-glass-day", {
			url: "/backgrounds/liquid-glass-day.webp",
			themed: false,
			night: "liquid-glass",
		}),
		{
			primary: "oklch(0.78 0.11 210)",
			accent: "oklch(0.72 0.16 340)",
			secondary: "oklch(0.25 0.03 265)",
			border: "oklch(0.36 0.035 265)",
			card: "oklch(0.24 0.03 265)",
			background: "oklch(0.13 0.03 268)",
		},
		{ v: 1, preset: "frosted" },
	),
	preset(
		"monochrome-pro",
		"Monochrome Pro",
		0,
		["#e9ecef", "#343a40"],
		{
			primary: "oklch(0.32 0.01 260)",
			accent: "oklch(0.4 0.01 260)",
			secondary: "oklch(0.93 0.004 260)",
			border: "oklch(0.8 0.004 260)",
			card: "oklch(0.99 0.002 260)",
			background: "oklch(0.955 0.003 260)",
		},
		bg("monochrome-blocks", {
			url: "/backgrounds/monochrome-blocks.svg",
			night: "monochrome-night",
		}),
		{
			primary: "oklch(0.9 0.005 260)",
			accent: "oklch(0.82 0.005 260)",
			secondary: "oklch(0.24 0.004 260)",
			border: "oklch(0.36 0.004 260)",
			card: "oklch(0.2 0.003 260)",
			background: "oklch(0.14 0.003 260)",
		},
		{ v: 1, preset: "paper" },
	),
	preset(
		"ocean-breeze",
		"Tide",
		1.5,
		["#2b4a8b", "#efe6d2"],
		{
			primary: "oklch(0.42 0.12 262)",
			accent: "oklch(0.48 0.09 225)",
			secondary: "oklch(0.93 0.015 85)",
			border: "oklch(0.84 0.02 80)",
			card: "oklch(0.975 0.012 85)",
			background: "oklch(0.955 0.018 85)",
		},
		bg("tide-waves"),
		{
			primary: "oklch(0.78 0.09 235)",
			accent: "oklch(0.76 0.08 205)",
			secondary: "oklch(0.26 0.04 262)",
			border: "oklch(0.36 0.045 262)",
			card: "oklch(0.23 0.045 262)",
			background: "oklch(0.18 0.05 262)",
		},
		{ v: 1, preset: "paper" },
	),
	preset(
		"chalkboard",
		"Chalkboard",
		1.2,
		["#2f4a40", "#f2e6a0"],
		{
			primary: "oklch(0.48 0.13 255)",
			accent: "oklch(0.5 0.1 165)",
			secondary: "oklch(0.9 0.012 165)",
			border: "oklch(0.8 0.015 165)",
			card: "oklch(0.965 0.006 165)",
			background: "oklch(0.93 0.012 165)",
		},
		bg("chalkboard"),
		{
			primary: "oklch(0.88 0.12 95)",
			accent: "oklch(0.8 0.09 220)",
			secondary: "oklch(0.29 0.025 165)",
			border: "oklch(0.43 0.02 165)",
			card: "oklch(0.28 0.028 165)",
			background: "oklch(0.22 0.03 165)",
		},
		{ v: 1, preset: "chalk" },
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
		{ v: 1, preset: "neon", dials: { glow: 14 } },
	),
];

export function getAllPresets(): ThemePreset[] {
	return THEME_PRESETS;
}

export function getPreset(id: string): ThemePreset | undefined {
	return THEME_PRESETS.find((p) => p.id === id);
}
