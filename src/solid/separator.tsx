import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils.js";

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
			// A luminous glass hairline: the border tone fades to transparent at both
			// ends (a lit line, not a hard rule) with a faint highlight offset one
			// pixel toward the light — the same lit-glass edge cards and chips carry.
			class={cn(
				"shrink-0 border-0 bg-transparent",
				orientation() === "horizontal"
					? "h-px w-full bg-gradient-to-r from-transparent via-border to-transparent shadow-[0_1px_0_oklch(1_0_0_/_0.04)]"
					: "h-full w-px bg-gradient-to-b from-transparent via-border to-transparent shadow-[1px_0_0_oklch(1_0_0_/_0.04)]",
				local.class,
			)}
			{...others}
		/>
	);
};

export { Separator };
