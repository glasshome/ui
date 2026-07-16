/**
 * Alert tone system, pure (no Solid, no icon components). The Solid <Alert> and
 * the `@glasshome/ui/astro` <Alert> both build from this one table so a package
 * alert and a marketing/docs callout render identically. Icons are named here,
 * not imported: each framework maps the name to its own icon (Solid → a
 * lucide-solid component, Astro → an inlined lucide SVG) so this file stays
 * framework-agnostic and SSR-safe.
 *
 * All color comes from theme vars via color-mix. Text mixes in oklab (not oklch)
 * so a hued tone desaturates toward neutral with its hue intact instead of
 * swinging toward yellow.
 */
export type AlertTone = "info" | "warning" | "success" | "destructive";

export type AlertToneStyle = {
	/** CSS var holding the tone's base color; border, icon, and fill derive from it. */
	color: string;
	/** Default iconify (lucide) name. Iconify consumers (hub docs Callout) use it
	 *  directly; the Solid <Alert> and Astro <Alert> map the tone to their own
	 *  icon form (a lucide-solid component / an inlined SVG) — same glyph. */
	icon: string;
	/** Readable title/body text color for this tone (contrast >= 4.5:1 on the tint). */
	text: string;
};

// Canonical values (2026-07: reconciled from hub's tuned alert-tokens.ts, which
// had silently drifted from dash's copy). info uses the dedicated readable tint
// var; warning/success/destructive mix toward --foreground in oklab (no hue
// channel, so a hued tone desaturates to neutral with its hue intact instead of
// swinging toward yellow). Surface fns mix in oklch.
export const ALERT_TONES: Record<AlertTone, AlertToneStyle> = {
	info: {
		color: "var(--primary)",
		icon: "lucide:info",
		text: "var(--primary-tint-foreground)",
	},
	warning: {
		color: "var(--warning)",
		icon: "lucide:alert-triangle",
		text: "color-mix(in oklab, var(--warning) 55%, var(--foreground))",
	},
	success: {
		color: "var(--success)",
		icon: "lucide:check-circle-2",
		text: "color-mix(in oklab, var(--success) 60%, var(--foreground))",
	},
	destructive: {
		color: "var(--destructive)",
		icon: "lucide:alert-octagon",
		text: "color-mix(in oklab, var(--destructive) 65%, var(--foreground))",
	},
};

// Mix in srgb, not oklch: mixing a tone toward `transparent` (transparent-black)
// in oklch drags the tone's lightness toward 0, so the tint composites muddy and
// dark on a light surface (invisible on dash's dark bg, ugly on a light page).
// srgb keeps the tint a clean, pale wash of the tone in both themes.
export const alertBorder = (c: string) => `color-mix(in srgb, ${c} 28%, transparent)`;
export const alertFill = (c: string) => `color-mix(in srgb, ${c} 9%, transparent)`;
export const alertIconFill = (c: string) => `color-mix(in srgb, ${c} 16%, transparent)`;

export const ALERT_CLASS = "flex items-start gap-3 rounded-lg border p-3 backdrop-blur-sm";
export const ALERT_ICON_CLASS =
	"flex size-8 shrink-0 items-center justify-center rounded-md [&>svg]:size-[18px]";
export const ALERT_TITLE_CLASS = "font-semibold text-sm leading-snug";
export const ALERT_DESCRIPTION_CLASS = "text-sm leading-snug [&:not(:first-child)]:mt-0.5";
