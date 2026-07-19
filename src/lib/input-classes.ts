/**
 * Input field class string. Pure (no Solid), so the Solid <Input> and any
 * server-run/`.astro` consumer share ONE recipe — the same split the button
 * recipe uses (buttonVariants ↔ the Astro pill tokens). Change the field look
 * here, not in a hand-rolled `rounded-md border border-input` copy.
 *
 * The surface is the ONE `.glass` formula run INVERTED: same knobs shape as
 * CARD_KNOBS (tint off, neutral border) but the rim is fed `--glass-rim-sink`,
 * lift/glow/top-highlight are killed, and the base is `--input`, so the field
 * reads as concave — dug out of the card rather than floating on it. `.glass`
 * owns border+background+box-shadow, so no `border-input`/`bg-input` here.
 * Fill is 100% (opaque): a translucent field lets whatever sits behind it bleed
 * through, which reads as muddy and, on overlapping surfaces like the Select
 * listbox, shows the value underneath.
 */
export const INPUT_SURFACE =
	"glass [--glass-edge:color-mix(in_srgb,var(--border)_55%,transparent)] [--glass-text:0%] [--glass-glow:0] [--glass-drop:0] [--glass-lift:0] [--glass-light:0.04] [--glass-wash-a:0%] [--glass-wash-b:0%] [--glass-base:var(--input)] [--glass-fill:100%] [--glass-rim-shine:var(--glass-rim-sink)]";

export const INPUT_CLASS =
	`flex h-9 w-full min-w-0 rounded-md ${INPUT_SURFACE} px-3 py-1 text-base outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40`;
