/* Metallic tier chip: 135deg brushed sweep, bright ends, dip in the middle. */

export const TIER_BADGE_CLASS =
	"inline-flex cursor-default select-none items-center rounded-full px-2 py-0.5 font-black text-[10px] uppercase tracking-wider";

/** Optional sweep shaping. Default is the symmetric brushed look (both ends
 *  `hi`, dipping to `lo` at the midpoint). The collectible/license golds are a
 *  lit bevel instead: they dip early and land on a darker `end`. */
export interface TierSweep {
	/** Far end of the sweep. Default: `hi` (symmetric). */
	end?: string;
	/** Where `lo` sits, in percent. Default: 50. */
	stop?: number;
}

/** Inline style for the metallic pill body. Keys are CSS property names (works
 *  as a Solid `style` object and, joined, as an Astro `style` string). */
export function tierBadgeStyle(
	hi: string,
	lo: string,
	text: string,
	sweep: TierSweep = {},
): Record<string, string> {
	const end = sweep.end ?? hi;
	const stop = sweep.stop ?? 50;
	return {
		background: `linear-gradient(135deg, ${hi}, ${lo} ${stop}%, ${end})`,
		color: text,
		"box-shadow": "inset 0 1px 0 oklch(1 0 0 / 0.45), 0 1px 2px oklch(0 0 0 / 0.25)",
	};
}
