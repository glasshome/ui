/* Concentric radius: inner = outer - padding, clamped for tiny --radius themes.
 * The padding term is 3 spacing units, the same number SECTION_PADDING's p-3
 * resolves to, so the two cannot drift apart. */
export const SECTION_OUTER_RADIUS = "rounded-[var(--radius)]";
export const SECTION_INNER_RADIUS = "rounded-[max(0px,calc(var(--radius)-var(--spacing)*3))]";
export const SECTION_PADDING = "p-3";

/* Not card-classes' SECTION_ROW_SURFACE: this is the flat pre-glass fill, kept
 * only for the deprecated class below. */
const LEGACY_SECTION_ROW_SURFACE = `${SECTION_INNER_RADIUS} border border-border/60 bg-card/60`;

/** @deprecated `SectionRow`, or `SECTION_ROW_SURFACE` from card-classes; removed in 2.0.0. */
export const SECTION_ROW_CLASS = `${LEGACY_SECTION_ROW_SURFACE} ${SECTION_PADDING}`;
