/**
 * Badge-specific tone tokens. The frosted glass surface itself lives in the
 * shared `./glass-tone` primitive (glassSurface + glassToneText) so the Badge,
 * the Alert, and any other tinted component render the identical glass. This
 * file only adds the badge's shape/default and composes the surface with a
 * tinted label. The badge is glass-only: pass any tone color (a semantic token
 * like var(--success) or an arbitrary categorical hue); there are no solid
 * variants.
 */
import { glassSurface, toneTextMix } from "./glass-tone";

// Re-exported so existing importers (index barrel, callers) keep resolving it.
export { toneTextMix };

/** Default tone when a <Badge> is used with no explicit tone. */
export const BADGE_DEFAULT_TONE = "var(--primary)";

export const BADGE_TONE_CLASS =
	"inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-medium text-xs";

/** Inline style for the glass pill body: the shared glass surface plus a tinted
 *  label. Keys are CSS property names (works as a Solid `style` object and,
 *  joined, as an Astro `style` string). */
export function badgeToneStyle(color: string): Record<string, string> {
	return glassSurface(color);
}
