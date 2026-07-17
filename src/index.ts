// Framework-agnostic utilities

// Alert tone system (tones table + surface recipe), pure — shared by the Solid
// <Alert>, the Astro <Alert>, and hub's docs Callout so all render identically.
export {
	ALERT_CLASS,
	ALERT_CONTENT_CLASS,
	ALERT_DESCRIPTION_CLASS,
	ALERT_ICON_BG_CLASS,
	ALERT_ICON_CLASS,
	ALERT_TITLE_CLASS,
	ALERT_TONES,
	type AlertTone,
	type AlertToneStyle,
	alertBorder,
	alertFill,
	alertIconBgStyle,
	alertIconFill,
} from "./lib/alert-tones";
// Badge tone tokens (shape + default + tinted-label composition over glassSurface).
export { BADGE_DEFAULT_TONE, BADGE_TONE_CLASS, badgeToneStyle } from "./lib/badge-tone";
// Tier chip tokens (metallic PRO/EARLY BIRD/CREATOR sweep) — shared by the Solid
// <TierBadge> and the Astro <TierBadge.astro> face.
export { TIER_BADGE_CLASS, tierBadgeStyle } from "./lib/tier-badge";
// Pure cva class recipes (no Solid) — Astro/SSR-safe, used to build class
// strings without hydrating a component. The Solid components and the
// `@glasshome/ui/astro` static components share these one-and-only recipes, so
// a package badge/button and a marketing-page badge/button render identically.
export { buttonVariants } from "./lib/button-variants";
// Card surface + sub-part classes, pure — shared by the Solid <Card>, the Astro
// <Card>, and hub's `.astro` card surfaces.
export {
	CARD_ACTION_CLASS,
	CARD_CLASS,
	CARD_CONTENT_CLASS,
	CARD_DESCRIPTION_CLASS,
	CARD_FOOTER_CLASS,
	CARD_HEADER_CLASS,
	CARD_INSET_SHADOW,
	CARD_SURFACE,
	CARD_TITLE_CLASS,
} from "./lib/card-classes";
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
// Section card surface tokens (pure) — shared by the Solid <SectionCard> kit and
// static consumers (hub .astro/.ts).
export {
	SECTION_CARD_CHROME,
	SECTION_CARD_CLASS,
	SECTION_CARD_FILL,
	SECTION_CARD_INSET_STYLE,
	SECTION_INNER_RADIUS,
	SECTION_OUTER_RADIUS,
	SECTION_PADDING,
	SECTION_ROW_CLASS,
} from "./lib/section-tokens";
// Hooks
export { createIsMobile } from "./lib/use-is-mobile";
export { cn } from "./lib/utils";
