import { Select as SelectPrimitive } from "@kobalte/core/select";
import { Check, ChevronDown } from "lucide-solid";
import { type Component, type ComponentProps, type ParentComponent, splitProps } from "solid-js";
import { cn } from "../lib/utils";
import { SlidingIndicator } from "./sliding-indicator";

// Open the listbox ON TOP of the trigger instead of below it. Anchoring to the
// trigger's TOP edge (a zero-height rect) with gutter 0 puts the content's top at
// the input's top, so it covers the input at the same width (sameWidth is
// Kobalte's default) and the options grow downward: the input appears to expand
// rather than a separate box dropping in. Consumers can override per instance.
const anchorToTriggerTop = (anchor?: HTMLElement) => {
	const r = anchor?.getBoundingClientRect();
	return r
		? { x: r.left, y: r.top, width: r.width, height: 0 }
		: { x: 0, y: 0, width: 0, height: 0 };
};
const Select = ((props: ComponentProps<typeof SelectPrimitive>) => (
	<SelectPrimitive gutter={0} getAnchorRect={anchorToTriggerTop} {...props} />
)) as typeof SelectPrimitive;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger: ParentComponent<
	ComponentProps<typeof SelectPrimitive.Trigger> & { size?: "sm" | "default" }
> = (props) => {
	const [local, rest] = splitProps(props, ["class", "children", "size"]);
	const size = () => local.size ?? "default";
	return (
		<SelectPrimitive.Trigger
			data-slot="select-trigger"
			data-size={size()}
			class={cn(
				"flex w-fit items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[size=default]:h-9 data-[size=sm]:h-8 data-[placeholder]:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:hover:bg-input/50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
				local.class,
			)}
			{...rest}
		>
			{local.children}
			<SelectPrimitive.Icon>
				<ChevronDown class="size-4 opacity-50" />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
};

const SelectContent: ParentComponent<
	ComponentProps<typeof SelectPrimitive.Content> & { listboxClass?: string }
> = (props) => {
	const [local, rest] = splitProps(props, ["class", "children", "listboxClass"]);
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				data-slot="select-content"
				class={cn(
					// Width comes from Kobalte sameWidth (= trigger width). It overlaps the
					// trigger, so it reads as the input itself, not a separate surface.
					"relative z-50 overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
					// clip-path reveal, top row covers the input, options grow downward.
					"data-[expanded]:animate-select-in data-[closed]:animate-select-out",
					local.class,
				)}
				{...rest}
			>
				<SlidingIndicator
					activeSelector="[data-highlighted]"
					orientation="vertical"
					class="w-full"
					pillClass="rounded-sm bg-muted duration-150"
				>
					<SelectPrimitive.Listbox class={cn("p-1", local.listboxClass)} />
				</SlidingIndicator>
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
};

const SelectLabel: Component<ComponentProps<typeof SelectPrimitive.Label>> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<SelectPrimitive.Label
			data-slot="select-label"
			class={cn("px-2 py-1.5 text-muted-foreground text-xs", local.class)}
			{...rest}
		/>
	);
};

const SelectItem: ParentComponent<ComponentProps<typeof SelectPrimitive.Item>> = (props) => {
	const [local, rest] = splitProps(props, ["class", "children"]);
	return (
		<SelectPrimitive.Item
			data-slot="select-item"
			class={cn(
				"relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden transition-colors focus:text-foreground data-[disabled]:pointer-events-none data-[highlighted]:text-foreground data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
				local.class,
			)}
			{...rest}
		>
			<span class="absolute right-2 flex size-3.5 items-center justify-center">
				<SelectPrimitive.ItemIndicator>
					<Check class="size-4 text-current" />
				</SelectPrimitive.ItemIndicator>
			</span>
			<SelectPrimitive.ItemLabel>{local.children}</SelectPrimitive.ItemLabel>
		</SelectPrimitive.Item>
	);
};

const SelectGroup: Component<ComponentProps<"div">> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return <div data-slot="select-group" class={cn("", local.class)} {...rest} />;
};

const SelectSeparator: Component<ComponentProps<"div">> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<div
			data-slot="select-separator"
			class={cn("pointer-events-none -mx-1 my-1 h-px bg-border", local.class)}
			{...rest}
		/>
	);
};

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
};
