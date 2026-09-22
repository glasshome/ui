import { PRESS_DIP } from "./motion-classes.js";

const CARD_KNOBS =
	"glass [--glass-wash:20%] [--glass-rim:0.3] [--glass-lift:0.45] [--glass-shade:0.05] dark:[--glass-shade:0]";

export const CARD_SURFACE_BASE = `${CARD_KNOBS} [--glass-base:color-mix(in_srgb,var(--card)_var(--material-clarity),transparent)]`;

/* Split from the surface so dash's performant-blur engine can gate it off and
 * paint a precomputed frost instead. */
export const CARD_BLUR = "backdrop-blur-[var(--glass-blur,24px)] backdrop-saturate-[1.8]";

export const CARD_SURFACE = `${CARD_SURFACE_BASE} ${CARD_BLUR}`;

/* Opaque fill, no blur: for busy/dark backgrounds and transform-animated
 * contexts where backdrop-blur can't run. */
export const CARD_SURFACE_OPAQUE = CARD_KNOBS;

/* Rows inside a section: the card material again, one step in, so a row never
 * reads as a flat plate on a glass panel. */
export const SECTION_ROW_SURFACE =
	"glass [--glass-rim:0.3] [--glass-base:color-mix(in_srgb,var(--card)_var(--material-clarity),transparent)]";

/* Recessed track frame (tabs, segmented controls). */
export const TRACK_SURFACE = "border border-border/50 bg-card/40 backdrop-blur-sm";

export const CARD_PADDING = {
	slots: "flex flex-col gap-3 p-3 md:gap-4 md:p-4",
	md: "flex flex-col gap-3 p-4",
	sm: "flex flex-col gap-2 p-3",
	none: "",
} as const;

export type CardPadding = keyof typeof CARD_PADDING;

export const CARD_INTERACTIVE =
	"cursor-pointer transition-glass hover:[--glass-light:0.09] focus-within:[--glass-edge:var(--border)]";

/* A row that activates as a whole. Two focus selectors, one look: the row may
 * be focusable itself, or hold an absolutely-positioned overlay button. */
export const SECTION_ROW_INTERACTIVE = `${CARD_INTERACTIVE} ${PRESS_DIP} outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50`;

export const CARD_HEADER_CLASS =
	"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto]";
export const CARD_TITLE_CLASS = "font-semibold leading-none";
export const CARD_DESCRIPTION_CLASS = "text-muted-foreground text-sm";
export const CARD_ACTION_CLASS = "col-start-2 row-span-2 row-start-1 self-start justify-self-end";
export const CARD_CONTENT_CLASS = "min-w-0";
export const CARD_FOOTER_CLASS = "flex items-center";
