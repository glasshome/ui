/* Recessed (concave) glass field. Opaque --input fill: a translucent field
 * shows whatever sits behind it (worst inside the overlapping Select listbox). */
export const INPUT_SURFACE = "glass glass-sink [--glass-base:var(--input)] [--glass-light:0.04]";

/* Flat field chrome for toggle-family controls (checkbox, radio, segmented
 * triggers). The switch track is NOT one of these: it wears INPUT_SURFACE so it
 * reads as the same recessed field as Input and the slider rail. */
export const FIELD_CHROME = "border border-input bg-input/30";

export const INPUT_CLASS = `flex h-9 w-full min-w-0 rounded-md ${INPUT_SURFACE} px-3 py-1 text-base outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40`;
