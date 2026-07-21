import { HoverCard as HoverCardPrimitive } from "@kobalte/core/hover-card";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { OVERLAY_SURFACE } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";

const HoverCard = HoverCardPrimitive;

const HoverCardTrigger: Component<ComponentProps<typeof HoverCardPrimitive.Trigger>> = (props) => {
	return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
};

const HoverCardContent: Component<ComponentProps<typeof HoverCardPrimitive.Content>> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<HoverCardPrimitive.Portal data-slot="hover-card-portal">
			<HoverCardPrimitive.Content
				data-slot="hover-card-content"
				class={cn(
					OVERLAY_SURFACE,
					"data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 rounded-md p-4 text-popover-foreground outline-hidden data-[closed]:animate-out data-[expanded]:animate-in",
					local.class,
				)}
				{...rest}
			/>
		</HoverCardPrimitive.Portal>
	);
};

export { HoverCard, HoverCardContent, HoverCardTrigger };
