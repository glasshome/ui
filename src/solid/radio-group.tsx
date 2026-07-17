import { RadioGroup as RadioGroupPrimitive } from "@kobalte/core/radio-group";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const RadioGroup: Component<ComponentProps<typeof RadioGroupPrimitive>> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<RadioGroupPrimitive data-slot="radio-group" class={cn("grid gap-3", local.class)} {...rest} />
	);
};

const RadioGroupItem: Component<ComponentProps<typeof RadioGroupPrimitive.Item>> = (props) => {
	const [local, rest] = splitProps(props, ["class", "children"]);
	return (
		<RadioGroupPrimitive.Item data-slot="radio-group-item" class={cn("flex", local.class)} {...rest}>
			<RadioGroupPrimitive.ItemInput class="peer" />
			{/* Control + label are siblings and the whole row is the label, so a click
			    anywhere (dot or text) selects once. Both dot and text pass through the
			    label's single toggle; the dot never gets a second competing click. */}
			<RadioGroupPrimitive.ItemLabel class="flex flex-1 cursor-pointer items-center gap-2.5 select-none data-[disabled]:cursor-not-allowed">
				<RadioGroupPrimitive.ItemControl class="relative flex aspect-square size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-input bg-input/30 shadow-xs outline-none transition-all duration-200 ease-out active:scale-90 peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 data-[disabled]:border-dashed data-[disabled]:opacity-40 data-[invalid]:border-destructive data-[invalid]:ring-destructive/20 data-[checked]:border-transparent">
					{/* Mounts on select (from a dot OR text click), so animate-in always
					    plays. Gradient backgrounds can't transition, so the glass rides an
					    inner element that pops in instead of swapping instantly. */}
					<RadioGroupPrimitive.ItemIndicator class="absolute inset-0 rounded-full glass [--glass-tone:var(--primary)] duration-200 animate-in zoom-in-50 fade-in" />
				</RadioGroupPrimitive.ItemControl>
				{local.children && <span class="text-sm leading-none">{local.children}</span>}
			</RadioGroupPrimitive.ItemLabel>
		</RadioGroupPrimitive.Item>
	);
};

export { RadioGroup, RadioGroupItem };
