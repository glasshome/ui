/**
 * Section card surface tokens, pure (no Solid). Shared by the Solid <SectionCard>
 * kit and by any static consumer (hub .astro/.ts). The concentric radius math is
 * reactive to the theme `--radius` token (user-tunable via the theme editor):
 *   outer = var(--radius), padding = 0.75rem, inner = outer - padding.
 * `max(0px,...)` clamps when the user picks a very small --radius.
 */
export const SECTION_OUTER_RADIUS = "rounded-[var(--radius)]";
export const SECTION_INNER_RADIUS = "rounded-[max(0px,calc(var(--radius)-0.75rem))]";
export const SECTION_PADDING = "p-3";

/**
 * Card chrome WITHOUT the fill/blur: border, radius, shadow, clip, transition.
 * The fill is split out (SECTION_CARD_FILL) so <SectionCard> can gate it off when
 * a performant-blur glass surface paints the frost itself. No hover on the base;
 * the component adds its own.
 */
export const SECTION_CARD_CHROME =
	"relative overflow-hidden rounded-[var(--radius)] border border-border/50 text-card-foreground shadow-sm transition-colors [contain:layout_style_paint]";

/** The translucent fill + frost. Gated off by <SectionCard> under performant blur. */
export const SECTION_CARD_FILL = "bg-card/60 backdrop-blur-xl";

/** The official static card surface (chrome + fill). Use on any element that
 *  needs the card look but can't be a <SectionCard>. Pair with
 *  SECTION_CARD_INSET_STYLE for the top highlight. */
export const SECTION_CARD_CLASS = `${SECTION_CARD_CHROME} ${SECTION_CARD_FILL}`;

export const SECTION_CARD_INSET_STYLE = { "box-shadow": "inset 0 1px 0 oklch(1 0 0 / 0.06)" };

/** Inner surface (rows inside a card). No blur/shadow/inset, concentric radius. */
export const SECTION_ROW_CLASS = `${SECTION_INNER_RADIUS} border border-border/60 bg-card/60 p-3`;
