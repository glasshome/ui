import { FIELD_CHROME } from "./input-classes.js";

/* One short bar per position among siblings (Carousel pagination,
 * StepIndicator): the slider's rail, lit with the slider's fill. Width is the
 * caller's (a stepper keeps every bar equal, a carousel stretches the current
 * one). */
export const POSITION_BAR = `${FIELD_CHROME} h-1.5 rounded-full transition-glass duration-(--duration-morph) ease-(--ease-morph)`;

export const POSITION_BAR_LIT =
  "glass glass-tint [--glass-tone:var(--surface-accent)] [--glass-wash:70%] [--glass-drop:0%]";
