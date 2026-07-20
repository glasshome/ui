import { RadioGroup as RadioGroupPrimitive } from "@kobalte/core/radio-group";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { INPUT_SURFACE } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";

const RadioGroup: Component<ComponentProps<typeof RadioGroupPrimitive>> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<RadioGroupPrimitive data-slot="radio-group" class={cn("grid gap-3", local.class)} {...rest} />
	);
};

const RadioGroupItem: Component<ComponentProps<typeof RadioGroupPrimitive.Item>> = (props) => {
	const [local, rest] = splitProps(props, ["class", "children"]);
	return (
		<RadioGroupPrimitive.Item
			data-slot="radio-group-item"
			class={cn("flex", local.class)}
			{...rest}
		>
			<RadioGroupPrimitive.ItemInput class="peer" />
			<RadioGroupPrimitive.ItemLabel class="flex flex-1 cursor-pointer select-none items-center gap-2.5 data-[disabled]:cursor-not-allowed">
				<RadioGroupPrimitive.ItemControl
					class={`relative flex aspect-square size-7 shrink-0 items-center justify-center overflow-hidden rounded-full ${INPUT_SURFACE} shadow-xs outline-none transition-all duration-200 ease-out active:scale-90 peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 data-[checked]:border-transparent data-[invalid]:border-destructive data-[disabled]:border-dashed data-[disabled]:opacity-40 data-[invalid]:ring-destructive/20`}
				>
					{/* Gradient backgrounds can't transition; the glass rides an inner element
					    that animates in. */}
					<RadioGroupPrimitive.ItemIndicator class="glass glass-tint zoom-in-50 fade-in absolute inset-0 animate-in rounded-full duration-200 [--glass-tone:var(--primary)]" />
				</RadioGroupPrimitive.ItemControl>
				{local.children && <span class="text-sm leading-none">{local.children}</span>}
			</RadioGroupPrimitive.ItemLabel>
		</RadioGroupPrimitive.Item>
	);
};

export { RadioGroup, RadioGroupItem };
