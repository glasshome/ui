import { Button as KobalteButton } from "@kobalte/core/button";
import type { VariantProps } from "cva";
import { type ComponentProps, type JSX, splitProps } from "solid-js";
import { buttonVariants } from "../lib/button-variants.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";

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

function ButtonWell(props: { icon?: string; children?: JSX.Element; class?: string }) {
	return (
		<span
			data-slot="button-well"
			class={cn(
				"grid size-12 shrink-0 place-items-center rounded-full bg-foreground/15",
				props.class,
			)}
		>
			{props.children ?? (props.icon ? <Icon icon={props.icon} /> : null)}
		</span>
	);
}

export { Button, ButtonWell, buttonVariants };
