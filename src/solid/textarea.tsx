import { type Component, type ComponentProps, splitProps } from "solid-js";
import { INPUT_SURFACE } from "../lib/input-classes";
import { cn } from "../lib/utils";

const Textarea: Component<ComponentProps<"textarea">> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<textarea
			data-slot="textarea"
			class={cn(
				`field-sizing-content flex min-h-16 w-full rounded-md ${INPUT_SURFACE} px-3 py-2 text-base outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:ring-destructive/40`,
				local.class,
			)}
			{...rest}
		/>
	);
};

export { Textarea };
