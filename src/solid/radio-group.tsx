import { RadioGroup as RadioGroupPrimitive } from "@kobalte/core/radio-group";
import { type Component, type ComponentProps, Show, splitProps } from "solid-js";
import { FIELD_CHROME } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";

const RadioGroup: Component<ComponentProps<typeof RadioGroupPrimitive>> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<RadioGroupPrimitive
			data-slot="radio-group"
			class={cn("flex flex-col gap-3", local.class)}
			{...rest}
		/>
	);
};

const RadioGroupItem: Component<
	ComponentProps<typeof RadioGroupPrimitive.Item> & { showControl?: boolean }
> = (props) => {
	const [local, rest] = splitProps(props, ["class", "children", "showControl"]);
	return (
		<RadioGroupPrimitive.Item
			data-slot="radio-group-item"
			class={cn("flex", local.class)}
			{...rest}
		>
			<RadioGroupPrimitive.ItemInput class="peer" />
			<RadioGroupPrimitive.ItemLabel
				data-slot="radio-group-item-label"
				class="flex flex-1 cursor-pointer select-none items-center gap-2.5 data-[disabled]:cursor-not-allowed"
			>
				<Show when={local.showControl ?? true}>
					<RadioGroupPrimitive.ItemControl
						data-slot="radio-group-item-control"
						class={cn(
							"relative flex aspect-square size-7 shrink-0 items-center justify-center overflow-hidden rounded-full transition-glass duration-200 ease-out active:scale-90",
							FIELD_CHROME,
							"peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-focus-visible:[--glass-edge:var(--ring)]",
							"data-[disabled]:opacity-40 data-[invalid]:ring-destructive/20 data-[invalid]:[--glass-edge:var(--destructive)]",
						)}
					>
						{/* Gradient backgrounds can't transition; the glass rides an inner element
						    that animates in. */}
						<RadioGroupPrimitive.ItemIndicator
							data-slot="radio-group-item-indicator"
							class="glass glass-tint zoom-in-50 fade-in absolute inset-0 grid animate-in place-items-center rounded-full duration-200 [--glass-tone:var(--primary)] [--glass-wash:90%]"
						>
							<span data-slot="radio-group-item-dot" class="size-[36%] rounded-full bg-white" />
						</RadioGroupPrimitive.ItemIndicator>
					</RadioGroupPrimitive.ItemControl>
				</Show>
				{local.children && (
					<div data-slot="radio-group-item-content" class="min-w-0 flex-1 text-sm">
						{local.children}
					</div>
				)}
			</RadioGroupPrimitive.ItemLabel>
		</RadioGroupPrimitive.Item>
	);
};

export { RadioGroup, RadioGroupItem };
