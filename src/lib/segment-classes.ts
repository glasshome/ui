import { CONTROL_H, FOCUS_RING } from "./input-classes.js";

/* One segmented-item look shared by TabsTrigger and ToggleGroupItem (via
 * toggleVariants' base): both sit inside a TRACK_SURFACE track and pick one
 * of a few siblings, so they share height, type and focus ring. Callers still
 * layer their own variant/size classes on top through cn()'s tailwind-merge. */
/** The rounded-md of a segment (SEGMENT_ITEM, a toggle-group item), for a selection flyer that crosses segments. */
export const SEGMENT_RADIUS = "var(--radius-md)";

export const SEGMENT_ITEM = `inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md ${CONTROL_H.sm} px-3 font-medium text-sm outline-none transition-glass active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`;
