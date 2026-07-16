/**
 * The iconic glass tone surface — the frosted, tinted look first shipped on
 * <Badge>, extracted here so any component (badge, alert, chip, panel) renders
 * the exact same glass. Pure and framework-agnostic: pass any CSS color (a
 * semantic token like var(--success) or an arbitrary categorical hue) and get
 * back inline style props. Keys are CSS property names, so the object works as a
 * Solid `style` object and, joined, as an Astro `style` string.
 *
 * Shape (radius, padding) is the caller's job — this is only the tint + frost.
 *
 * Transparent mixes use srgb, not oklch: mixing a tone toward `transparent`
 * (transparent-black) in oklch drags its lightness down and reads muddy on a
 * light surface. The tinted-text mix uses oklab (no hue channel) so a hued tone
 * desaturates toward neutral with its hue intact instead of swinging to yellow.
 */

// Per-tone label contrast: mix toward --foreground by an amount that scales with
// the tone's lightness. Light tones (amber, lime) pull further so they read as
// strongly as the dark ones; a flat mix leaves the light ones washed out.
const TONE_L: Record<string, number> = {
	"var(--primary)": 0.48,
	"var(--accent)": 0.6,
	"var(--success)": 0.68,
	"var(--warning)": 0.76,
	"var(--destructive)": 0.66,
	"var(--muted-foreground)": 0.55,
};

export function toneTextMix(color: string): number {
	const known = TONE_L[color];
	const raw = color.match(/oklch\(\s*([0-9.]+)/)?.[1];
	const l = known ?? (raw ? Number.parseFloat(raw) : 0.6);
	return Math.min(70, Math.max(46, Math.round(71 - (l - 0.5) * 60)));
}

/**
 * The frosted tinted surface: border, gradient fill, backdrop frost, inset glow.
 * No text color — the caller keeps its own text (e.g. var(--foreground) for a
 * readable body, or glassToneText(color) for a tinted label).
 */
export function glassSurface(color: string): Record<string, string> {
	return {
		"border-color": `color-mix(in srgb, ${color} 40%, transparent)`,
		background: `linear-gradient(155deg, color-mix(in srgb, ${color} 26%, transparent), color-mix(in srgb, ${color} 7%, transparent))`,
		"backdrop-filter": "blur(8px) saturate(180%)",
		"-webkit-backdrop-filter": "blur(8px) saturate(180%)",
		"box-shadow": `inset 0 1px 0 oklch(1 0 0 / 0.14), inset 2px 2px 4px -2px oklch(1 0 0 / 0.5), inset 0 -2px 4px color-mix(in srgb, ${color} 14%, transparent), 0 1px 3px color-mix(in srgb, ${color} 20%, transparent)`,
	};
}

/** Tinted label color for text sitting on a glassSurface of the same tone. */
export function glassToneText(color: string): string {
	return `color-mix(in oklab, ${color} ${toneTextMix(color)}%, var(--foreground))`;
}
