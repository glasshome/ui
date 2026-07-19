/* Per-tone label contrast: light tones (amber, lime) mix further toward
 * --foreground so they read as strongly as dark ones. */
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

/* oklab, not oklch: no hue channel, so a hued tone desaturates toward neutral
 * instead of swinging toward yellow. */
export function glassToneText(color: string): string {
	return `color-mix(in oklab, ${color} ${toneTextMix(color)}%, var(--foreground))`;
}
