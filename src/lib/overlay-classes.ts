/**
 * The floating-overlay surface: the `.glass` formula, opaque (`--popover` fill,
 * no frost) so menus stay legible. Set independently (NOT derived from
 * CARD_SURFACE) so each knob — `--glass-fill` especially — is set exactly once.
 */
export const OVERLAY_SURFACE =
	"glass [--glass-edge:color-mix(in_srgb,var(--border)_60%,transparent)] [--glass-text:0%] [--glass-glow:0] [--glass-drop:0] [--glass-light:0.05] [--glass-rim:0.3] [--glass-base:var(--popover)] [--glass-fill:100%] [--glass-lift:0.55]";
