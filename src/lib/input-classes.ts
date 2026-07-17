/**
 * Input field class string. Pure (no Solid), so the Solid <Input> and any
 * server-run/`.astro` consumer share ONE recipe — the same split the button
 * recipe uses (buttonVariants ↔ the Astro pill tokens). Change the field look
 * here, not in a hand-rolled `rounded-md border border-input` copy.
 */
export const INPUT_CLASS =
	"flex h-9 w-full min-w-0 rounded-md border border-input bg-input/60 px-3 py-1 text-base outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40";
