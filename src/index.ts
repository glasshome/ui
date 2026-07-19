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
} from "./lib/alert-tones";
export { buttonVariants } from "./lib/button-variants";
export {
	CARD_BLUR,
	CARD_SURFACE,
	CARD_SURFACE_BASE,
	CARD_SURFACE_OPAQUE,
	TRACK_SURFACE,
} from "./lib/card-classes";
export { glassToneText, toneTextMix } from "./lib/glass-tone";
export { FIELD_CHROME, INPUT_CLASS, INPUT_SURFACE } from "./lib/input-classes";
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
} from "./lib/logo-lockup";
export { OVERLAY_SURFACE, SCRIM_CLASS } from "./lib/overlay-classes";
export {
	SECTION_INNER_RADIUS,
	SECTION_OUTER_RADIUS,
	SECTION_PADDING,
	SECTION_ROW_CLASS,
} from "./lib/section-tokens";
export { createIsMobile } from "./lib/use-is-mobile";
export { cn } from "./lib/utils";
