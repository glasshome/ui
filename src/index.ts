// Framework-agnostic utilities

// Alert tone system (tones table + surface recipe), pure — shared by the Solid
// <Alert>, the Astro <Alert>, and hub's docs Callout so all render identically.
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
// NOTE: badge tone tokens are internal (the Solid + Astro <Badge> import them
// from ./lib). Outside the package, use the <Badge> component. Not re-exported.
// Pure cva class recipes (no Solid) — Astro/SSR-safe, used to build class
// strings without hydrating a component. The Solid components and the
// `@glasshome/ui/astro` static components share these one-and-only recipes, so
// a package badge/button and a marketing-page badge/button render identically.
export { buttonVariants } from "./lib/button-variants";
// NOTE: the card surface/interactive/blur/padding class strings are deliberately
// NOT re-exported here. They are internal to the package (the Solid <Card>,
// <SectionCard>, and the Astro <Card> import them straight from ./lib). Outside
// the package there is exactly one door: the <Card> component, which applies
// these in the correct combination. Do not add card-classes to this barrel.
// The iconic glass tone surface (frosted tinted look, first shipped on <Badge>),
// shape-free and shared by every tinted component: <Badge>, <Alert>, chips, etc.
export {
	type GlassSurfaceOptions,
	glassSurface,
	glassToneText,
	toneTextMix,
} from "./lib/glass-tone";
// Input field recipe (pure), shared by the Solid <Input> and .astro consumers.
export { INPUT_CLASS } from "./lib/input-classes";
// The GlassHome lockup spec (mark + wordmark + sub-brand line), pure — shared
// by the Solid <Logo>, the Astro <Logo>, and any .astro consumer.
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
// Opaque floating-overlay glass (menus/popovers), worn by <Overlay> + primitives.
export { OVERLAY_SURFACE } from "./lib/overlay-classes";
// Section card surface tokens (pure) — shared by the Solid <SectionCard> kit and
// static consumers (hub .astro/.ts).
export {
	SECTION_INNER_RADIUS,
	SECTION_OUTER_RADIUS,
	SECTION_PADDING,
	SECTION_ROW_CLASS,
} from "./lib/section-tokens";
// NOTE: tier-chip tokens are internal (the Solid + Astro <TierBadge> import them
// from ./lib). Outside the package, use the <TierBadge> component. Not re-exported.
// Hooks
export { createIsMobile } from "./lib/use-is-mobile";
export { cn } from "./lib/utils";
