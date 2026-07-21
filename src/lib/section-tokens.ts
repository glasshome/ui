/* Concentric radius: inner = outer - padding, clamped for tiny --radius themes. */
export const SECTION_OUTER_RADIUS = "rounded-[var(--radius)]";
export const SECTION_INNER_RADIUS = "rounded-[max(0px,calc(var(--radius)-0.75rem))]";
export const SECTION_PADDING = "p-3";

const SECTION_ROW_SURFACE = `${SECTION_INNER_RADIUS} border border-border/60 bg-card/60`;

export const SECTION_ROW_CLASS = `${SECTION_ROW_SURFACE} ${SECTION_PADDING}`;
