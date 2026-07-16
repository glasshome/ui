import { ToggleGroup as ToggleGroupPrimitive } from "@kobalte/core/toggle-group";
import type { VariantProps } from "cva";
import {
	type Component,
	type ComponentProps,
	createContext,
	type ParentComponent,
	Show,
	splitProps,
	useContext,
} from "solid-js";
import { cn } from "../lib/utils";
import { SlidingIndicator } from "./sliding-indicator";
import { toggleVariants } from "./toggle";

// The group also tells its items whether a single sliding pill is in play: in
// single-select mode the pill paints the selected segment, so items go
// transparent when pressed (else they double-paint). Multi-select has no single
// active item, so items keep their own pressed background and no pill renders.
type ToggleGroupContextValue = VariantProps<typeof toggleVariants> & { sliding: boolean };

const ToggleGroupContext = createContext<ToggleGroupContextValue>({
	size: "default",
	variant: "default",
	sliding: true,
});

const ToggleGroup: ParentComponent<
	ComponentProps<typeof ToggleGroupPrimitive> & VariantProps<typeof toggleVariants>
> = (props) => {
	const [local, rest] = splitProps(props, ["class", "variant", "size", "children"] as const);
	// Read `multiple` without splitting it out: Kobalte's root is a single/multiple
	// discriminated union, so pulling `multiple` into a separate prop collapses the
	// union and mistypes `value`. Leave it in `rest` and just peek at it here.
	const sliding = () => !(props as { multiple?: boolean }).multiple;
	return (
		<ToggleGroupPrimitive
			data-slot="toggle-group"
			data-variant={local.variant}
			data-size={local.size}
			class={cn(
				"group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
				local.class,
			)}
			{...rest}
		>
			<ToggleGroupContext.Provider
				value={{ variant: local.variant, size: local.size, sliding: sliding() }}
			>
				<Show when={sliding()} fallback={local.children}>
					<SlidingIndicator
						activeSelector="[data-pressed]"
						class="flex w-fit items-center"
						pillClass="rounded-md bg-primary/15"
					>
						{local.children}
					</SlidingIndicator>
				</Show>
			</ToggleGroupContext.Provider>
		</ToggleGroupPrimitive>
	);
};

const ToggleGroupItem: Component<
	ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>
> = (props) => {
	const [local, rest] = splitProps(props, ["class", "variant", "size"] as const);
	const context = useContext(ToggleGroupContext);

	return (
		<ToggleGroupPrimitive.Item
			data-slot="toggle-group-item"
			data-variant={context.variant || local.variant}
			data-size={context.size || local.size}
			class={cn(
				toggleVariants({
					variant: context.variant || local.variant,
					size: context.size || local.size,
				}),
				// `*-of-type` (not `first:`/`last:`): the sliding pill is a <div> sibling,
				// so `:first-child`/`:last-child` would land on the pill and drop the end
				// segments' rounded corners. Items are <button>, so `-of-type` skips the pill.
				"min-w-0 flex-1 shrink-0 rounded-none shadow-none first-of-type:rounded-l-md last-of-type:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first-of-type:border-l",
				// In single-select the pill paints the active segment; the item stays
				// transparent so the two don't stack into a darker tint.
				context.sliding && "data-[pressed]:bg-transparent",
				local.class,
			)}
			{...rest}
		/>
	);
};

export { ToggleGroup, ToggleGroupItem };
