import { cva } from "cva";

/* Buttons are glass pills on an OPAQUE --card base: a translucent fill goes
 * muddy over dark heroes/sections. Every class is literal for Tailwind's
 * scanner. `size: none` is sizeless for callers that own height/padding. */
export const buttonVariants = cva({
	base: "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	variants: {
		variant: {
			default:
				"glass glass-tint [--glass-tone:var(--primary)] [--glass-wash:30%] [--glass-text:70%] hover:[--glass-wash:40%] hover:[--glass-edge:color-mix(in_srgb,var(--primary)_60%,transparent)]",
			destructive:
				"glass glass-tint [--glass-tone:var(--destructive)] [--glass-wash:30%] [--glass-text:61%] hover:[--glass-wash:40%] hover:[--glass-edge:color-mix(in_srgb,var(--destructive)_60%,transparent)] focus-visible:ring-destructive/30",
			secondary:
				"glass glass-tint [--glass-tone:var(--accent)] [--glass-wash:30%] hover:[--glass-wash:40%] hover:[--glass-edge:color-mix(in_srgb,var(--accent)_60%,transparent)]",
			outline:
				"glass [--glass-edge:var(--border)] hover:[--glass-base:var(--muted)] dark:[--glass-base:var(--input)] dark:hover:[--glass-base:var(--muted)]",
			ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
			link: "text-primary underline-offset-4 hover:underline",
		},
		size: {
			default: "h-9 px-4 py-2 has-[>svg]:px-3",
			sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
			lg: "h-10 px-6 has-[>svg]:px-4",
			icon: "size-9 p-2",
			none: "",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
});
