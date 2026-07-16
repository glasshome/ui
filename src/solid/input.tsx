import { type Component, type ComponentProps, splitProps } from "solid-js";
import { INPUT_CLASS } from "../lib/input-classes";
import { cn } from "../lib/utils";

const Input: Component<ComponentProps<"input">> = (props) => {
	const [local, others] = splitProps(props, ["class", "type"]);
	return (
		<input
			type={local.type}
			data-slot="input"
			class={cn(INPUT_CLASS, local.class)}
			{...others}
		/>
	);
};

export { Input };
