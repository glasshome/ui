import { Tabs as TabsPrimitive } from "@kobalte/core/tabs";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { TRACK_SURFACE } from "../lib/card-classes";
import { cn } from "../lib/utils";
import { SlidingIndicator } from "./sliding-indicator";

const Tabs = TabsPrimitive;

const TabsList: Component<ComponentProps<typeof TabsPrimitive.List>> = (props) => {
	const [local, others] = splitProps(props, ["class", "children"]);
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			class={cn(
				`inline-flex h-9 w-full items-center rounded-lg ${TRACK_SURFACE} p-1 text-muted-foreground`,
				local.class,
			)}
			{...others}
		>
			<SlidingIndicator
				activeSelector="[data-selected]"
				class="flex h-full w-full items-center gap-1"
			>
				{local.children}
			</SlidingIndicator>
		</TabsPrimitive.List>
	);
};

const TabsTrigger: Component<ComponentProps<typeof TabsPrimitive.Trigger>> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			class={cn(
				"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 font-medium text-sm outline-none transition-colors hover:text-primary/80 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[selected]:text-primary",
				local.class,
			)}
			{...others}
		/>
	);
};

const TabsContent: Component<ComponentProps<typeof TabsPrimitive.Content>> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			class={cn(
				"mt-2 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
				local.class,
			)}
			{...others}
		/>
	);
};

export { Tabs, TabsContent, TabsList, TabsTrigger };
