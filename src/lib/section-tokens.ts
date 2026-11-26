/* Concentric radius: inner = outer - padding, clamped for tiny --radius themes.
 * The padding term is 3 spacing units, the same number SECTION_PADDING's p-3
 * resolves to, so the two cannot drift apart. */
export const SECTION_OUTER_RADIUS = "rounded-[var(--radius)]";
export const SECTION_INNER_RADIUS = "rounded-[max(0px,calc(var(--radius)-var(--spacing)*3))]";
export const SECTION_PADDING = "p-3";
