import { MOTION_EXIT_MS } from "../../lib/motion-classes.js";

export const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
export const TRANSITION_MS = MOTION_EXIT_MS.sheet;

export const DEAD_ZONE_PX = 6;
export const CLOSE_DISTANCE_RATIO = 0.4;
export const CLOSE_VELOCITY_PX_PER_MS = 0.5;
export const VELOCITY_WINDOW_MS = 100;
export const VELOCITY_PROJECTION_MS = 200;
