import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

type SeparatorProps = ComponentProps<"div"> & {
	orientation?: "horizontal" | "vertical";
};

const Separator: Component<SeparatorProps> = (props) => {
	const [local, others] = splitProps(props, ["class", "orientation"]);
	const orientation = () => local.orientation ?? "horizontal";
	return (
		// Non-focusable role=separator is valid static ARIA; hr cannot express the vertical variant.
		// biome-ignore lint/a11y/useFocusableInteractive: see above
		// biome-ignore lint/a11y/useSemanticElements: see above
		<div
			data-slot="separator"
			// biome-ignore lint/a11y/useAriaPropsForRole: non-focusable separators need no aria-valuenow
			role="separator"
			aria-orientation={orientation()}
			class={cn(
				"shrink-0 bg-border",
				orientation() === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
				local.class,
			)}
			{...others}
		/>
	);
};

export { Separator };
