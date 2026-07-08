import { Tabs as TabsPrimitive } from "@kobalte/core/tabs";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Tabs = TabsPrimitive;

const TabsList: Component<ComponentProps<typeof TabsPrimitive.List>> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			class={cn(
				// admin pill spec: neutral card track (not primary-tinted), radius from
				// --radius, active state carries the fill (see TabsTrigger).
				"inline-flex h-9 w-full items-center justify-start gap-1 rounded-lg border border-border/50 bg-card/40 p-1 text-muted-foreground backdrop-blur-sm",
				local.class,
			)}
			{...others}
		/>
	);
};

const TabsTrigger: Component<ComponentProps<typeof TabsPrimitive.Trigger>> = (props) => {
	const [local, others] = splitProps(props, ["class"]);
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			class={cn(
				"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 font-medium text-sm outline-none transition-all hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-foreground/10 data-[selected]:text-foreground data-[selected]:shadow-sm",
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
