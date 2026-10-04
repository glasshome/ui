/* Recessed (concave) glass field: text inputs, textareas, and the pickers that
 * wear a field (Select trigger + listbox, EntitySelector, AreaPicker). The fill
 * and edge come from the theme's --field/--field-edge pair rather than --input
 * directly, because the two themes need different material: on a dark ground a
 * dug-out fill reads as depth, on a light one the same drop reads as `disabled`,
 * so light fields sit at the card and carry a solid border instead. Both are
 * opaque — a translucent field shows whatever sits behind it (worst inside the
 * overlapping Select listbox). The recess itself is .glass-sink's rim, which is
 * theme independent. */
export const INPUT_SURFACE =
  "glass glass-sink [--glass-base:var(--field)] [--glass-edge:var(--field-edge)] [--glass-light:0.04]";

/* Toggle-family chrome and rails: checkbox box, radio ring, switch track, slider
 * rail, chart wells. Same concave glass, but keyed to --input in both themes:
 * these are not fields you type into, they are unfilled controls whose whole job
 * is to read as an empty well, so the fill must stay visibly below the card even
 * in the light theme. */
export const FIELD_CHROME = "glass glass-sink [--glass-base:var(--input)] [--glass-light:0.04]";

/* A control that is on: the material's accent, strong enough to carry the state
 * on its own, so the knob riding it can stay plain. */
export const CONTROL_ON =
  "glass glass-tint [--glass-tone:var(--material-accent)] [--glass-wash:100%] [--glass-text:0%]";

/* Focus on a glass element: border utilities are no-ops there, so the edge
 * moves through the knob and the ring paints outside. */
export const FOCUS_RING =
  "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:[--glass-edge:var(--ring)]";

export const INVALID_RING =
  "aria-invalid:[--glass-edge:var(--destructive)] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40";

/* The three control heights every field, trigger and button shares. */
export const CONTROL_H = {
  sm: "h-8",
  default: "h-9",
  lg: "h-10",
} as const;

/* Field type: 16px on touch so iOS does not zoom, 14px from md up. */
export const FIELD_TEXT = "text-base md:text-sm";

/* Trigger-shaped fields (Select, pickers) compose from these; the text input
 * adds file:* and selection styling on top. */
export const FIELD_CONTROL = `flex w-full min-w-0 rounded-md ${INPUT_SURFACE} px-3 ${FIELD_TEXT} transition-[color,box-shadow] placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING} ${INVALID_RING}`;

export const INPUT_CLASS = `${FIELD_CONTROL} ${CONTROL_H.default} py-1 selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm`;
