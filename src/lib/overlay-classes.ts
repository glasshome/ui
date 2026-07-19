/* Floating-panel glass: opaque popover fill so menus stay legible over anything. */
export const OVERLAY_SURFACE =
	"glass [--glass-base:var(--popover)] [--glass-rim:0.3] [--glass-lift:0.55]";

/* Modal scrim behind dialogs/sheets. BottomSheet keeps its own unblurred scrim
 * (backdrop-blur is too slow on mobile). */
export const SCRIM_CLASS = "bg-background/70 backdrop-blur-sm";
