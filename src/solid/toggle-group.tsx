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
import { TRACK_SURFACE } from "../lib/card-classes";
import { cn } from "../lib/utils";
import { SlidingIndicator } from "./sliding-indicator";
import { toggleVariants } from "./toggle";

// The group also tells its items whether a single sliding indicator is in play: in
// single-select mode the indicator paints the selected segment, so items go
// transparent when pressed (else they double-paint). Multi-select has no single
// active item, so items keep their own pressed background and no indicator renders.
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
				`group/toggle-group flex w-fit items-center rounded-lg ${TRACK_SURFACE} p-1 data-[variant=outline]:shadow-xs`,
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
				// `*-of-type` (not `first:`/`last:`): the sliding indicator is a <div> sibling,
				// so `:first-child`/`:last-child` would land on the indicator and drop the end
				// segments' rounded corners. Items are <button>, so `-of-type` skips the indicator.
				"min-w-0 flex-1 shrink-0 rounded-none px-4 shadow-none first-of-type:rounded-l-md last-of-type:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first-of-type:border-l",
				// Single-select: the sliding indicator paints the active segment, so the
				// item needs no pressed fill of its own, and hover only tints the text
				// (a square bg-muted hover would clash with the rounded glass indicator).
				// Multi-select has no single indicator, so each pressed segment carries
				// its own neutral fill.
				context.sliding
					? "hover:!bg-transparent hover:!text-primary"
					: "data-[pressed]:bg-muted data-[pressed]:text-foreground",
				local.class,
			)}
			{...rest}
		/>
	);
};

export { ToggleGroup, ToggleGroupItem };
