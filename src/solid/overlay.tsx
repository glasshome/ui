import { type Component, type ComponentProps, splitProps } from "solid-js";
import { OVERLAY_SURFACE } from "../lib/overlay-classes";
import { cn } from "../lib/utils";

/**
 * A generic floating glass panel — the same material the Popover/DropdownMenu/…
 * primitives wear, for a custom floating surface that isn't one of them. Wears
 * `OVERLAY_SURFACE` (the shared overlay glass). Supply your own radius/padding;
 * pair with your own positioning.
 */
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
