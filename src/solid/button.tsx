import { Button as KobalteButton } from "@kobalte/core/button";
import type { VariantProps } from "cva";
import { type ComponentProps, splitProps } from "solid-js";
import { buttonVariants } from "../lib/button-variants.js";
import { cn } from "../lib/utils.js";

type ButtonProps = ComponentProps<typeof KobalteButton> & VariantProps<typeof buttonVariants>;

function Button(props: ButtonProps) {
	const [local, others] = splitProps(props, ["class", "variant", "size"] as const);
	return (
		<KobalteButton
			data-slot="button"
			class={cn(buttonVariants({ variant: local.variant, size: local.size }), local.class)}
			{...others}
		/>
	);
}

export { Button, buttonVariants };
