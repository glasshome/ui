import { type Component, type ComponentProps, splitProps } from "solid-js";
import { OVERLAY_SURFACE } from "../lib/overlay-classes";
import { cn } from "../lib/utils";

/* The floating glass panel material, for custom floating surfaces that are not
 * a Popover/Menu primitive. Caller owns radius, padding, positioning. */
const Overlay: Component<ComponentProps<"div">> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return (
		<div
			data-slot="overlay"
			class={cn(OVERLAY_SURFACE, "rounded-md p-1 text-popover-foreground", local.class)}
			{...others}
		/>
	);
};

export { Overlay };
