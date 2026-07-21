import { type Component, type ComponentProps, splitProps } from "solid-js";
import { INPUT_CLASS } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";

const Input: Component<ComponentProps<"input">> = (props) => {
	const [local, others] = splitProps(props, ["class", "type"]);
	return (
		<input type={local.type} data-slot="input" class={cn(INPUT_CLASS, local.class)} {...others} />
	);
};

export { Input };
