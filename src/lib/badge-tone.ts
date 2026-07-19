/**
 * Badge-specific tone tokens (shape + default). The frosted glass surface is
 * applied by the <Badge> component via the shared `.glass` utility + a
 * `--glass-tone` var, so this file only holds the pill shape and default tone.
 * The badge is glass-only: pass any tone color (a semantic token like
 * var(--success) or an arbitrary categorical hue); there are no solid variants.
 */

/** Default tone when a <Badge> is used with no explicit tone. */
export const BADGE_DEFAULT_TONE = "var(--primary)";

export const BADGE_TONE_CLASS =
	"inline-flex w-fit shrink-0 cursor-default select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-medium text-xs";
