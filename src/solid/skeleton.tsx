import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils.js";

const Skeleton: Component<ComponentProps<"div">> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return (
		<div
			data-slot="skeleton"
			class={cn("animate-pulse rounded-md bg-muted", local.class)}
			{...others}
		/>
	);
};

export { Skeleton };
