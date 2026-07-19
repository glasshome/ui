/**
 * Section STRUCTURE tokens, pure (no Solid). Shared by the Solid <SectionCard>
 * kit and by any static consumer (hub .astro/.ts). These carry radius/padding
 * only — the section surface is now the shared `.glass` card look (CARD_SURFACE /
 * CARD_SURFACE_BASE in card-classes), not a parallel definition. The concentric
 * radius math is reactive to the theme `--radius` token (user-tunable via the
 * theme editor):
 *   outer = var(--radius), padding = 0.75rem, inner = outer - padding.
 * `max(0px,...)` clamps when the user picks a very small --radius.
 */
export const SECTION_OUTER_RADIUS = "rounded-[var(--radius)]";
export const SECTION_INNER_RADIUS = "rounded-[max(0px,calc(var(--radius)-0.75rem))]";
export const SECTION_PADDING = "p-3";

/** Pad-less inner-row surface (concentric radius, quieter border, no blur/shadow). */
export const SECTION_ROW_SURFACE = `${SECTION_INNER_RADIUS} border border-border/60 bg-card/60`;

/** Inner surface (rows inside a card). Pad-less base + the standard row padding. */
export const SECTION_ROW_CLASS = `${SECTION_ROW_SURFACE} ${SECTION_PADDING}`;
