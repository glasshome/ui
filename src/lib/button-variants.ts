import { cva } from "cva";

/* One outline material, worn by the pill and by Toggle: `glass` owns the
 * element's background and border, so a real border-input box is a no-op. */
export const OUTLINE_SURFACE =
	"glass [--glass-edge:var(--border)] hover:[--glass-base:var(--muted)] dark:[--glass-base:var(--input)] dark:hover:[--glass-base:var(--muted)]";

/* Buttons are glass pills on an OPAQUE --card base: a translucent fill goes
 * muddy over dark heroes/sections. Every class is literal for Tailwind's
 * scanner. `size: none` is sizeless for callers that own height/padding. */
/* Controls take the theme's corner (rounded-lg is --radius): a capsule at the
 * roundness every preset but the sharp one ships, square at zero. */
export const buttonVariants = cva({
	// structural-ok: the [&_svg]: utilities stay in Tailwind's utility layer so a
	// caller's own [&_svg]:size-* override can still win; unlayered real CSS in
	// globals.css would beat every consumer utility regardless of specificity.
	base: "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium text-sm outline-none transition-glass focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	variants: {
		variant: {
			default:
				"glass glass-tint [--glass-text:0%] [--glass-tone:var(--primary)] [--glass-wash:55%] hover:[--glass-edge:color-mix(in_srgb,var(--primary)_60%,transparent)] hover:[--glass-wash:65%] dark:[--glass-tone:oklch(from_var(--primary)_calc(l_+_clamp(0,(l_-_0.74)*10,0.1))_c_h)] dark:[--glass-wash:62%] dark:[color:oklch(from_var(--glass-tone)_calc((0.74_-_l)*100)_0_0)] dark:hover:[--glass-wash:62%]",
			destructive:
				"glass glass-tint [--glass-text:0%] [--glass-tone:var(--destructive)] [--glass-wash:55%] focus-visible:ring-destructive/30 hover:[--glass-edge:color-mix(in_srgb,var(--destructive)_60%,transparent)] hover:[--glass-wash:65%] dark:[--glass-tone:oklch(from_var(--destructive)_calc(l_+_clamp(0,(l_-_0.74)*10,0.1))_c_h)] dark:[--glass-wash:62%] dark:[color:oklch(from_var(--glass-tone)_calc((0.74_-_l)*100)_0_0)] dark:hover:[--glass-wash:62%]",
			secondary:
				"glass glass-tint [--glass-text:0%] [--glass-tone:var(--accent)] [--glass-wash:55%] hover:[--glass-edge:color-mix(in_srgb,var(--accent)_60%,transparent)] hover:[--glass-wash:65%] dark:[--glass-tone:oklch(from_var(--accent)_calc(l_+_clamp(0,(l_-_0.74)*10,0.1))_c_h)] dark:[--glass-wash:62%] dark:[color:oklch(from_var(--glass-tone)_calc((0.74_-_l)*100)_0_0)] dark:hover:[--glass-wash:62%]",
			outline: OUTLINE_SURFACE,
			ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
			link: "text-primary-tint-foreground underline-offset-4 hover:underline",
		},
		size: {
			default: "h-9 px-4 py-2 has-[>svg]:px-3",
			sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
			lg: "h-10 px-6 has-[>svg]:px-4",
			icon: "size-9 p-2",
			xl: "h-[72px] gap-3.5 rounded-full pr-7 pl-3 text-left font-semibold text-[17px] [&_svg:not([class*='size-'])]:size-5",
			none: "",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
});

// Evaluated once for static/SSR call sites (marketing CTAs, .astro frontmatter)
// that want a class string without hydrating <Button>. Sizeless: callers add
// their own height and padding.
export const BUTTON_DEFAULT_CLASS = buttonVariants({ variant: "default", size: "none" });
export const BUTTON_OUTLINE_CLASS = buttonVariants({ variant: "outline", size: "none" });

/* Ghost icon button (copy buttons, small icon actions). Size and text color
 * stay at the call site. */
export const ICON_BUTTON_CLASS =
	"inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg transition-glass duration-150 hover:bg-primary/10 active:scale-[0.97]";
