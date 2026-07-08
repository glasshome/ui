import { Button as KobalteButton } from "@kobalte/core/button";
import { cva, type VariantProps } from "cva";
import { type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const buttonVariants = cva({
	base: "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
			// marketing primary: the brand gradient. This is the variant the hub's
			// PILL_PRIMARY_CLASS hand-rolled before the matrix existed.
			gradient:
				"bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-xs hover:opacity-90",
			destructive:
				"bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/80",
			outline:
				"border bg-background shadow-xs hover:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
			// low-emphasis branded action: soft accent glass (the "Notify me" look).
			// Not the old neutral-grey secondary, which was redundant with ghost/outline
			// and rendered white-on-white in light mode (audit BTN2/B6).
			secondary:
				"border border-accent/25 bg-accent/15 text-accent-tint-foreground backdrop-blur-sm hover:border-accent/40 hover:bg-accent/25",
			ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
			link: "text-primary underline-offset-4 hover:underline",
		},
		size: {
			default: "h-9 px-4 py-2 has-[>svg]:px-3",
			sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
			lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
			icon: "size-9 p-2",
		},
		// Shape is orthogonal to variant: app buttons are rounded-md, marketing CTAs
		// are pills. Declared after size so twMerge lets pill win over the size
		// recipes' own rounded-md.
		shape: {
			rounded: "rounded-md",
			pill: "rounded-full",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
		shape: "rounded",
	},
});

type ButtonProps = ComponentProps<typeof KobalteButton> & VariantProps<typeof buttonVariants>;

function Button(props: ButtonProps) {
	const [local, others] = splitProps(props, ["class", "variant", "size", "shape"] as const);
	return (
		<KobalteButton
			data-slot="button"
			class={cn(
				buttonVariants({ variant: local.variant, size: local.size, shape: local.shape }),
				local.class,
			)}
			{...others}
		/>
	);
}

export { Button, buttonVariants };
