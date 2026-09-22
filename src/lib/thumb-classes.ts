/* The size-7 below in px (7 x --spacing, 0.27rem at a 16px root), rounded up:
 * the colour wheel takes its ring thickness as a number, and a ring thinner
 * than the thumb riding it lets the thumb overhang. */
export const THUMB_SIZE = 31;

/* The one draggable knob: switch, slider, colour slider, colour wheel. Colour
 * is the caller's (state, per-thumb tint, live channel value), everything else
 * is this recipe, so the four controls read as the same physical object. The
 * focus ring is not part of it: on a slider the thumb takes focus, on a switch
 * the track does. */
export const THUMB_CLASS =
	"block size-7 shrink-0 rounded-xl shadow-[0_2px_5px_oklch(0_0_0/0.35),inset_0_1px_0_oklch(1_0_0/0.35),inset_0_-2px_3px_oklch(0_0_0/0.2)]";

/* The lit knob wears the theme's hue at the depth theme.css sets per mode. The
 * knob re-declares --thumb-face-on on itself with this value: a var() resolves
 * where it is declared, so the :root one answers for the page only and a
 * container that re-scopes --primary (a theme preview) would keep the page's. */
export const THUMB_FACE_ON =
	"oklch(from var(--primary) var(--thumb-on-l) min(c, var(--thumb-on-c)) h)";

/* A rail pads by half a thumb so the knob stays inside the track at both ends;
 * the fill cancels the same inset to reach the rounded edges. */
/* A thumb painted the live channel colour sits on a track of that same colour,
 * so it needs its own edge to be found. */
export const THUMB_COLOR_RING = "border-2 border-white/90";

export const THUMB_RAIL_PAD = "px-3.5";
export const THUMB_RAIL_BLEED = "-mx-3.5";
