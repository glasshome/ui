import { ToggleGroup as ToggleGroupPrimitive } from "@kobalte/core/toggle-group";
import type { VariantProps } from "cva";
import {
	type Component,
	type ComponentProps,
	createContext,
	createSignal,
	onCleanup,
	onMount,
	type ParentComponent,
	Show,
	splitProps,
	useContext,
} from "solid-js";
import { TRACK_SURFACE } from "../lib/card-classes.js";
import { cn } from "../lib/utils.js";
import { SlidingIndicator } from "./sliding-indicator.js";
import { toggleVariants } from "./toggle.js";

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
	ComponentProps<typeof ToggleGroupPrimitive> &
		VariantProps<typeof toggleVariants> & {
			/** CSS colour for the selected segment's glass. Default `var(--primary)`. */
			tone?: string;
		}
> = (props) => {
	const [local, rest] = splitProps(props, [
		"class",
		"variant",
		"size",
		"tone",
		"children",
	] as const);
	// Read `multiple` without splitting it out: Kobalte's root is a single/multiple
	// discriminated union, so pulling `multiple` into a separate prop collapses the
	// union and mistypes `value`. Leave it in `rest` and just peek at it here.
	const sliding = () => !(props as { multiple?: boolean }).multiple;
	// Items that overflow the width they are given wrap onto rows; measured, so labels of any length work.
	const [wrap, setWrap] = createSignal(false);
	let root: HTMLDivElement | undefined;
	const measure = () => {
		if (!root) return;
		const items = root.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]');
		let needed = 8 + 4 * Math.max(0, items.length - 1);
		for (const item of items) needed += item.scrollWidth;
		const room = root.parentElement?.clientWidth ?? root.clientWidth;
		setWrap(needed > room + 1);
	};
	onMount(() => {
		if (!root || typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver(measure);
		ro.observe(root);
		if (root.parentElement) ro.observe(root.parentElement);
		onCleanup(() => ro.disconnect());
	});
	return (
		<ToggleGroupPrimitive
			ref={(el: HTMLDivElement) => {
				root = el;
			}}
			data-slot="toggle-group"
			data-variant={local.variant}
			data-size={local.size}
			data-wrap={wrap() ? "" : undefined}
			class={cn(
				`group/toggle-group flex w-fit max-w-full items-center rounded-lg ${TRACK_SURFACE} p-1 data-[variant=outline]:shadow-xs`,
				wrap() && "flex-wrap gap-1",
				local.class,
			)}
			{...rest}
		>
			<ToggleGroupContext.Provider
				value={{ variant: local.variant, size: local.size, sliding: sliding() }}
			>
				<Show when={sliding()} fallback={local.children}>
					{/* w-full, not w-fit: a shrink-to-fit root still sizes to content, and a
					    `class="w-full"` root can finally let its flex-1 items share the width. */}
					<SlidingIndicator
						activeSelector="[data-pressed]"
						indicatorClass="rounded-md"
						indicatorTone={local.tone}
						wrapped={wrap()}
						class={cn("flex w-full items-center", wrap() && "flex-wrap gap-1")}
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
				"min-w-0 flex-1 shrink-0 rounded-md px-4 shadow-none focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first-of-type:border-l group-data-[wrap]/toggle-group:flex-none",
				// Single-select: the sliding indicator paints the active segment, so the
				// item needs no pressed fill of its own and hover only tints the text.
				// Multi-select has no single indicator, so each pressed segment carries
				// its own neutral fill; hover still tints text only, since a fill there
				// would read as a second, squarer selection.
				context.sliding
					? "hover:text-primary"
					: "not-data-[pressed]:hover:text-primary data-[pressed]:bg-muted data-[pressed]:text-foreground",
				local.class,
			)}
			{...rest}
		/>
	);
};

export { ToggleGroup, ToggleGroupItem };
