/* Framework-agnostic root. Components are the primary doors; surface recipes
 * are exported here only for consumers that cannot run Solid (server .astro
 * frontmatter) or that gate the blur themselves (performant-blur wrappers). */
export {
	ALERT_CLASS,
	ALERT_CONTENT_CLASS,
	ALERT_DESCRIPTION_CLASS,
	ALERT_ICON_BG_CLASS,
	ALERT_ICON_CLASS,
	ALERT_ICON_PATHS,
	ALERT_TITLE_CLASS,
	ALERT_TONES,
	type AlertTone,
	type AlertToneStyle,
	alertBorder,
	alertFill,
	alertIconBgStyle,
	alertIconFill,
} from "./lib/alert-tones.js";
export {
	BUTTON_DEFAULT_CLASS,
	BUTTON_OUTLINE_CLASS,
	buttonVariants,
	ICON_BUTTON_CLASS,
	OUTLINE_SURFACE,
} from "./lib/button-variants.js";
export {
	CARD_BLUR,
	CARD_SURFACE,
	CARD_SURFACE_BASE,
	CARD_SURFACE_OPAQUE,
	SECTION_ROW_SURFACE,
	TRACK_SURFACE,
} from "./lib/card-classes.js";
export {
	CAROUSEL_DOTS,
	CAROUSEL_VIEWPORT,
	type CarouselTransition,
	carouselDot,
	carouselItem,
	carouselTrack,
} from "./lib/carousel-classes.js";
export { glassToneText, toneTextMix } from "./lib/glass-tone.js";
export {
	CONTROL_H,
	FIELD_CHROME,
	FIELD_CONTROL,
	FIELD_TEXT,
	FOCUS_RING,
	INPUT_CLASS,
	INPUT_SURFACE,
	INVALID_RING,
} from "./lib/input-classes.js";
export { Z, Z_CLASS } from "./lib/layers.js";
export {
	LOGO_DEFAULT_SIZE,
	LOGO_DEFAULT_SRC,
	LOGO_DEFAULT_SUB,
	LOGO_MARK_CLASS,
	LOGO_MARK_PX,
	LOGO_NAME_CLASS,
	LOGO_ROOT_CLASS,
	LOGO_SIZES,
	LOGO_STACK_CLASS,
	LOGO_SUB_CLASS,
	type LogoSize,
} from "./lib/logo-lockup.js";
export {
	MENU_ITEM,
	MENU_ITEM_BASE,
	MENU_ITEM_X,
	MENU_LABEL,
	MENU_SEPARATOR,
} from "./lib/menu-classes.js";
export {
	FIELD_MOTION,
	MODAL_MOTION,
	MORPH_MOTION,
	OVERLAY_MOTION,
	PRESS_DIP,
	SCRIM_MOTION,
	SETTLE_MOTION,
	STAGGER,
} from "./lib/motion-classes.js";
export { MOTION_WINDOW_MS, startMotionWindow } from "./lib/motion-window.js";
export {
	anchorToTriggerTop,
	FLOATING_PANEL,
	OVERLAY_BLUR,
	OVERLAY_SURFACE,
	OVERLAY_SURFACE_BASE,
	OVERLAY_SURFACE_OPAQUE,
	SCRIM_CLASS,
} from "./lib/overlay-classes.js";
export { CONTROL_H_TOUCH, PICKER_LIST, PICKER_TRIGGER } from "./lib/picker-classes.js";
export { CHIP, ICON_PILL, ICON_PILL_TINT } from "./lib/pill-classes.js";
export { POSITION_BAR, POSITION_BAR_LIT } from "./lib/position-bar-classes.js";
export {
	SECTION_INNER_RADIUS,
	SECTION_OUTER_RADIUS,
	SECTION_PADDING,
	SECTION_ROW_CLASS,
} from "./lib/section-tokens.js";
export { SEGMENT_ITEM } from "./lib/segment-classes.js";
export {
	THUMB_CLASS,
	THUMB_RAIL_BLEED,
	THUMB_RAIL_PAD,
	THUMB_SIZE,
} from "./lib/thumb-classes.js";
export { createIsMobile, MOBILE_BREAKPOINT } from "./lib/use-is-mobile.js";
export { cn } from "./lib/utils.js";
