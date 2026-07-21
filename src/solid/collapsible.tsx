import { Collapsible as CollapsiblePrimitive } from "@kobalte/core/collapsible";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils.js";

const Collapsible: Component<ComponentProps<typeof CollapsiblePrimitive>> = (props) => {
	return <CollapsiblePrimitive data-slot="collapsible" {...props} />;
};

const CollapsibleTrigger: Component<ComponentProps<typeof CollapsiblePrimitive.Trigger>> = (
	props,
) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<CollapsiblePrimitive.Trigger
			data-slot="collapsible-trigger"
			class={cn("cursor-pointer py-3", local.class)}
			{...rest}
		/>
	);
};

const CollapsibleContent: Component<ComponentProps<typeof CollapsiblePrimitive.Content>> = (
	props,
) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<CollapsiblePrimitive.Content
			data-slot="collapsible-content"
			class={cn(
				"overflow-hidden data-closed:animate-collapsible-up data-expanded:animate-collapsible-down",
				local.class,
			)}
			{...rest}
		/>
	);
};

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
