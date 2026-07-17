import { Checkbox as CheckboxPrimitive } from "@kobalte/core/checkbox";
import { CheckIcon } from "lucide-solid";
import { type Component, type ComponentProps, type JSX, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Checkbox: Component<ComponentProps<typeof CheckboxPrimitive>> = (props) => {
	const [local, others] = splitProps(props, ["class", "children"]);
	// Consumers pass label text as children; the component supplies its own render
	// function to CheckboxPrimitive, so treat the incoming children as plain nodes.
	const label = () => local.children as JSX.Element;
	return (
		<CheckboxPrimitive data-slot="checkbox" {...others}>
			{/* The whole row is a single <label>, so a click anywhere (box or text)
			    toggles exactly once. The box is a plain visual span driven by render
			    state, not a Kobalte Control, so it never adds a second competing
			    toggle that would cancel the label's. */}
			{(state) => (
				<CheckboxPrimitive.Label class="group inline-flex cursor-pointer items-center gap-2.5 select-none data-[disabled]:cursor-not-allowed">
					<CheckboxPrimitive.Input class="peer" />
					<span
						aria-hidden="true"
						class={cn(
							"box-border inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-input bg-input/30 shadow-xs transition-all duration-200 ease-out group-active:scale-90 peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50",
							state.checked() && "glass [--glass-tone:var(--primary)] border-transparent text-foreground",
							props.disabled && "cursor-not-allowed border-dashed opacity-40",
							local.class,
						)}
					>
						{/* Always mounted (never <Show>) so the box keeps a constant height;
						    the check scales/fades in by state instead of reflowing. */}
						<CheckIcon
							class={cn(
								"size-5 transition-all duration-200 ease-out",
								state.checked() ? "scale-100 opacity-100" : "scale-0 opacity-0",
							)}
							stroke-width={3}
						/>
					</span>
					{local.children && <span class="text-sm leading-none">{label()}</span>}
				</CheckboxPrimitive.Label>
			)}
		</CheckboxPrimitive>
	);
};

export { Checkbox };
