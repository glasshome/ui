import { Z_CLASS } from "./layers.js";

/* Flat frost. No corner sheen: on a panel this size the 120% radial is a
 * 13-step grey ramp that bands and washes half the surface, so the glass read
 * comes from the rim line, the blur and the grain instead. */
const OVERLAY_KNOBS =
  "glass glass-frost [--glass-rim:0.5] [--glass-lift:0.6] [--glass-light:0] [--glass-edge:color-mix(in_srgb,var(--border)_90%,transparent)]";

/* Split from the surface the way CARD_BLUR is, so a host can gate it off and
 * paint a precomputed frost instead. */
export const OVERLAY_BLUR =
  "backdrop-blur-[var(--glass-blur,var(--material-blur,24px))] backdrop-saturate-[calc(var(--_material-vibrancy,1)*1.2)] backdrop-brightness-[calc(1+(var(--_material-vibrancy,1)-1)*0.2)]";

export const OVERLAY_SURFACE_BASE = `${OVERLAY_KNOBS} [--glass-base:color-mix(in_srgb,var(--popover)_92%,transparent)]`;

/* Floating-panel glass: translucent popover fill over a blur, so a menu reads
 * as glass and not as a flat plate. */
export const OVERLAY_SURFACE = `${OVERLAY_SURFACE_BASE} ${OVERLAY_BLUR}`;

/* Opaque fill, no blur: the drag-animated surfaces (BottomSheet), where
 * backdrop-blur is too slow on mobile and a translucent fill with no blur
 * behind it would just be see-through. */
export const OVERLAY_SURFACE_OPAQUE = `${OVERLAY_KNOBS} [--glass-base:var(--popover)]`;

/* Touch screens only dim: a full-screen blur over moving widgets re-blurs every frame on a tablet GPU. */
export const SCRIM_CLASS = "bg-scrim backdrop-blur-md pointer-coarse:backdrop-blur-none";

/* overflow-hidden makes the scrim a scroll container, so overscroll-behavior applies to it. */
export const SCROLL_CONTAIN = "overscroll-contain";
export const SCRIM_CONTAIN = `${SCROLL_CONTAIN} overflow-hidden`;

export const PANEL_TAIL = `${Z_CLASS.overlay} rounded-md text-popover-foreground outline-hidden`;

/* The floating panel surface, minus positioning: a caller that is not
 * anchor-relative (Spotlight's fixed bubble) composes this instead of
 * FLOATING_PANEL. */
export const FLOATING_PANEL_SURFACE = `${OVERLAY_SURFACE} ${PANEL_TAIL}`;

/* The floating panel every anchored surface wears. Padding is the caller's:
 * menus add p-1, popovers p-4, pickers none. */
export const FLOATING_PANEL = `${OVERLAY_SURFACE} relative ${PANEL_TAIL}`;

/* The modal layer's own root. Its box, containment and stacking never change, so going dormant only adds skipping. */
export const LAYER_ROOT = `pointer-events-none fixed inset-0 ${Z_CLASS.overlay} [contain:layout_paint_style] *:pointer-events-auto data-[dormant]:[content-visibility:hidden] not-supports-[content-visibility:hidden]:data-[dormant]:hidden`;
