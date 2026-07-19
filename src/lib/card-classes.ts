const CARD_KNOBS =
	"glass [--glass-wash:20%] [--glass-rim:0.3] [--glass-lift:0.45] [--glass-shade:0.05] dark:[--glass-shade:0]";

export const CARD_SURFACE_BASE = `${CARD_KNOBS} [--glass-base:color-mix(in_srgb,var(--card)_60%,transparent)]`;

/* Split from the surface so dash's performant-blur engine can gate it off and
 * paint a precomputed frost instead. */
export const CARD_BLUR = "backdrop-blur-[var(--glass-blur,24px)] backdrop-saturate-[1.8]";

export const CARD_SURFACE = `${CARD_SURFACE_BASE} ${CARD_BLUR}`;

/* Opaque fill, no blur: for busy/dark backgrounds and transform-animated
 * contexts where backdrop-blur can't run. */
export const CARD_SURFACE_OPAQUE = CARD_KNOBS;

/* Recessed track frame (tabs, segmented controls). */
export const TRACK_SURFACE = "border border-border/50 bg-card/40 backdrop-blur-sm";

export const CARD_PADDING = {
	slots: "flex flex-col gap-3 py-3 md:gap-4 md:py-4",
	md: "p-4",
	sm: "p-3",
	none: "",
} as const;

export type CardPadding = keyof typeof CARD_PADDING;

export const CARD_INTERACTIVE =
	"cursor-pointer transition-colors duration-200 hover:border-border hover:bg-foreground/[0.03] focus-within:border-border";

export const CARD_HEADER_CLASS =
	"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] md:px-4";
export const CARD_TITLE_CLASS = "font-semibold leading-none";
export const CARD_DESCRIPTION_CLASS = "text-muted-foreground text-sm";
export const CARD_ACTION_CLASS = "col-start-2 row-span-2 row-start-1 self-start justify-self-end";
export const CARD_CONTENT_CLASS = "px-3 md:px-4";
export const CARD_FOOTER_CLASS = "flex items-center px-3 md:px-4 [.border-t]:pt-6";
