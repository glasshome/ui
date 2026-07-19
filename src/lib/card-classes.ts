/**
 * Card layout + surface + sub-part classes, pure (no Solid). Shared by the Solid
 * and Astro <Card>.
 */

/** The card knobs WITHOUT fill or blur: the one `.glass` formula with the tint
 *  off (border, rim, lift, washes). The fill is set by each surface below so
 *  there is never a duplicate `--glass-fill` declaration for the browser to pick
 *  between. Set `--glass-tone` on the element for an accent card. The top-left
 *  white sheen is dialled well below the tinted `.glass` default (0.16 → 0.05):
 *  a big neutral card wants a calm, near-flat surface, not the glossy pop a small
 *  badge/button wears. It stays invisible on the near-white light card, so light
 *  leans on the soft bottom-right `--glass-shade` for its bit of depth. */
const CARD_KNOBS =
	"glass [--glass-edge:color-mix(in_srgb,var(--border)_60%,transparent)] [--glass-text:0%] [--glass-glow:0] [--glass-drop:0] [--glass-wash-a:20%] [--glass-wash-b:6%] [--glass-light:0.05] [--glass-rim:0.3] [--glass-lift:0.45] [--glass-shade:0.05] dark:[--glass-shade:0]";

/** The translucent card surface WITHOUT the backdrop blur (fill 60%). Split from
 *  the blur so a surface that paints its own frost (SectionCard under dash's
 *  performant-blur engine) can wear the same look and gate CARD_BLUR off. */
export const CARD_SURFACE_BASE = `${CARD_KNOBS} [--glass-fill:60%]`;

/** The card's backdrop frost. Kept separate so consumers can gate it off when a
 *  precomputed blurred slice paints the frost instead (performant-blur mode). */
export const CARD_BLUR = "backdrop-blur-[var(--glass-blur,24px)] backdrop-saturate-[1.8]";

/** The neutral card surface: translucent base (fill 60%) + backdrop frost. The
 *  one `.glass` formula with the tint off. Set `--glass-tone` for an accent. */
export const CARD_SURFACE = `${CARD_SURFACE_BASE} ${CARD_BLUR}`;

/** Opaque card: the same card look (border, rim, lift) on a SOLID fill (100%),
 *  no backdrop blur. Use over busy/dark backgrounds or in animated contexts
 *  where `backdrop-blur` can't run (auto-scroll marquees, transformed grids) — a
 *  translucent glass card there just shows the dark background through and reads
 *  muddy/too dark. Same material as CARD_SURFACE, fill dialed to 100%. */
export const CARD_SURFACE_OPAQUE = `${CARD_KNOBS} [--glass-fill:100%]`;

/** Padding presets for `<Card padding>`. `slots` = the vertical rhythm for
 *  CardHeader/Content/Footer (which supply their own horizontal padding);
 *  `md`/`sm` = uniform box padding for bare tiles; `none` = caller owns it. */
export const CARD_PADDING = {
	slots: "flex flex-col gap-3 py-3 md:gap-4 md:py-4",
	md: "p-4",
	sm: "p-3",
	none: "",
} as const;

export type CardPadding = keyof typeof CARD_PADDING;

/** Hover/focus affordance for a clickable card (`<Card interactive>`). Lives here
 *  so the Solid and Astro <Card> share one string — never inline this in a twin. */
export const CARD_INTERACTIVE =
	"cursor-pointer transition-colors duration-200 hover:border-border hover:bg-foreground/[0.03] focus-within:border-border";

export const CARD_HEADER_CLASS =
	"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] md:px-4";
export const CARD_TITLE_CLASS = "font-semibold leading-none";
export const CARD_DESCRIPTION_CLASS = "text-muted-foreground text-sm";
export const CARD_ACTION_CLASS = "col-start-2 row-span-2 row-start-1 self-start justify-self-end";
export const CARD_CONTENT_CLASS = "px-3 md:px-4";
export const CARD_FOOTER_CLASS = "flex items-center px-3 md:px-4 [.border-t]:pt-6";
