import { Checkbox as CheckboxPrimitive } from "@kobalte/core/checkbox";
import { CheckIcon } from "lucide-solid";
import { type Component, type ComponentProps, type JSX, splitProps } from "solid-js";
import { INPUT_SURFACE } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";

const Checkbox: Component<ComponentProps<typeof CheckboxPrimitive>> = (props) => {
	const [local, others] = splitProps(props, ["class", "children"]);
	const label = () => local.children as JSX.Element;
	return (
		<CheckboxPrimitive data-slot="checkbox" {...others}>
			{/* One <label> row: the box is a plain span, not a Kobalte Control, so a
			    click anywhere toggles exactly once. */}
			{(state) => (
				<CheckboxPrimitive.Label class="group inline-flex cursor-pointer select-none items-center gap-2.5 data-[disabled]:cursor-not-allowed">
					<CheckboxPrimitive.Input class="peer" />
					<span
						aria-hidden="true"
						class={cn(
							"box-border inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[5px] shadow-xs transition-all duration-200 ease-out group-active:scale-90 peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50",
							state.checked()
								? "glass glass-tint text-foreground [--glass-tone:var(--primary)]"
								: INPUT_SURFACE,
							props.disabled && "cursor-not-allowed border-dashed opacity-40",
							local.class,
						)}
					>
						{/* Always mounted so the box keeps constant height. */}
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
