/**
 * The GlassHome lockup spec, pure — shared by the Solid <Logo>, the Astro
 * <Logo>, and any `.astro` consumer that needs the class strings without
 * hydrating a component.
 *
 * One ratio everywhere (audit L2): the sub-brand line is the dominant element,
 * the wordmark sits above it as a smaller eyebrow. Sub-line spec (audit L1):
 * text-primary, uppercase, bold, tracking-[0.18em] — never restyled per
 * surface, never recolored, and the mark is never stretched or used as an
 * avatar.
 */

export type LogoSize = "sm" | "md" | "lg";

export const LOGO_DEFAULT_SRC = "/assets/glasshome_logo.png";
export const LOGO_DEFAULT_SUB = "Dash";
export const LOGO_DEFAULT_SIZE: LogoSize = "md";

/** Rendered pixel size of the mark per size, for width/height attrs (CLS). */
export const LOGO_MARK_PX: Record<LogoSize, number> = {
	sm: 32,
	md: 48,
	lg: 64,
};

export const LOGO_SIZES: Record<
	LogoSize,
	{ mark: string; name: string; sub: string; gap: string }
> = {
	sm: { mark: "h-8 w-8", name: "text-xs", sub: "text-base", gap: "gap-1.5" },
	md: { mark: "h-12 w-12", name: "text-base", sub: "text-2xl", gap: "gap-2" },
	lg: { mark: "h-16 w-16", name: "text-lg", sub: "text-3xl", gap: "gap-2" },
};

/**
 * The stack sits on the mark's baseline (items-end), so the sub-brand line
 * bottoms out level with the mark rather than floating centred against it.
 */
export const LOGO_ROOT_CLASS = "inline-flex items-end";
/** The two lines are pinned by an explicit gap, never by line-height slack. */
export const LOGO_STACK_CLASS = "flex flex-col gap-0.5";
/**
 * Compose as cn(SIZE, BASE), not cn(BASE, SIZE): tailwind-merge treats a
 * font-size class as carrying a line-height, so a trailing `text-2xl` would
 * strip the `leading-none` these rely on.
 */
export const LOGO_MARK_CLASS = "shrink-0";
export const LOGO_NAME_CLASS = "whitespace-nowrap font-bold leading-none tracking-tight";
export const LOGO_SUB_CLASS = "font-bold text-primary uppercase leading-none tracking-[0.18em]";
