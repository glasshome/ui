/**
 * Card class strings, pure (no Solid). The Solid <Card> family and the
 * `@glasshome/ui/astro` <Card> family share these so a package card and a
 * marketing-page card are byte-identical. Card has no cva variants, so this is a
 * flat set of named class constants plus the one inline inset-highlight shadow.
 */

/**
 * The one shared card surface: translucent card/60 + blur + border + shadow.
 * Radius-less and padding-less on purpose — those vary per surface (a marketing
 * panel sets its own `rounded-2xl p-6`, the settings shell has neither), so they
 * are NOT part of the shared truth. This is the string that actually makes a
 * dash card and a hub card look the same; everything below extends it. Pair with
 * CARD_INSET_SHADOW for the top highlight.
 */
export const CARD_SURFACE =
	"relative border border-border/50 bg-card/60 text-card-foreground shadow-sm backdrop-blur-sm transition-colors";

/** The top inset-highlight, applied as an inline `box-shadow` (not a utility). */
export const CARD_INSET_SHADOW = "inset 0 1px 0 oklch(1 0 0 / 0.06)";

// Self-padded content card (dash tiles / feature cards): the shared surface plus
// a default radius, column layout, vertical padding, and an interactive hover.
// (rounded-lg === --radius-lg === var(--radius).)
export const CARD_CLASS = `rounded-lg flex flex-col py-3 hover:border-border md:py-4 ${CARD_SURFACE}`;

export const CARD_HEADER_CLASS =
	"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-3 pb-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] md:px-4 md:pb-4";
export const CARD_TITLE_CLASS = "font-semibold leading-none";
export const CARD_DESCRIPTION_CLASS = "text-muted-foreground text-sm";
export const CARD_ACTION_CLASS = "col-start-2 row-span-2 row-start-1 self-start justify-self-end";
export const CARD_CONTENT_CLASS = "px-3 md:px-4";
export const CARD_FOOTER_CLASS = "flex items-center px-3 md:px-4 [.border-t]:pt-6";
