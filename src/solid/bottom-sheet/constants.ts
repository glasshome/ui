export const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
export const TRANSITION_MS = 500;
export const TRANSITION_CSS = `transform ${TRANSITION_MS}ms ${EASE}, opacity ${TRANSITION_MS}ms ${EASE}`;

export const DEAD_ZONE_PX = 6;
export const CLOSE_DISTANCE_RATIO = 0.4;
export const CLOSE_VELOCITY_PX_PER_MS = 0.5;
export const VELOCITY_WINDOW_MS = 100;
export const VELOCITY_PROJECTION_MS = 200;

// Lower than popover/dropdown defaults (z-50) so dropdowns opened from
// inside the sheet stack on top naturally.
export const Z_BASE = 40;
