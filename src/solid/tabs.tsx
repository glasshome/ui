import { Tabs as TabsPrimitive } from "@kobalte/core/tabs";
import { type Component, type ComponentProps, onCleanup, onMount, splitProps } from "solid-js";
import { TRACK_SURFACE } from "../lib/card-classes.js";
import { PRESS_DIP, SETTLE_MOTION } from "../lib/motion-classes.js";
import { SEGMENT_ITEM } from "../lib/segment-classes.js";
import { cn } from "../lib/utils.js";
import { SlidingIndicator } from "./sliding-indicator.js";

/** `split`: the root is `display: contents`, so a host (a modal panel) lays the
 *  list and the content out in its own regions while the tab state still spans
 *  them. */
type TabsLayout = "stack" | "split";

const TABS_LAYOUT: Record<TabsLayout, string> = {
	stack: "flex flex-col gap-2",
	split: "contents",
};

type TabsProps = ComponentProps<typeof TabsPrimitive> & { layout?: TabsLayout };

const Tabs: Component<TabsProps> = (props) => {
	const [local, others] = splitProps(props, ["class", "layout"]);
	return (
		<TabsPrimitive
			data-slot="tabs"
			data-layout={local.layout ?? "stack"}
			class={cn(TABS_LAYOUT[local.layout ?? "stack"], local.class)}
			{...others}
		/>
	);
};

/** Keeps the selected trigger centred in the scrolled track, so a deep link to
 *  a tab past the fold does not land on a track scrolled to the first one.
 *  Drives scrollLeft rather than scrollIntoView, which would scroll the page
 *  with it. */
function followSelection(list: HTMLElement): () => void {
	const reveal = () => {
		if (list.scrollWidth <= list.clientWidth) return;
		const selected = list.querySelector("[data-selected]");
		if (!selected) return;
		const track = list.getBoundingClientRect();
		const item = selected.getBoundingClientRect();
		const left = list.scrollLeft + (item.left - track.left) - (track.width - item.width) / 2;
		const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
		list.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
	};
	// The track has no width during mount, so the first pass has to wait for
	// layout or it measures a track that cannot scroll yet.
	const first = requestAnimationFrame(reveal);
	const observer = new MutationObserver(reveal);
	observer.observe(list, { attributes: true, attributeFilter: ["data-selected"], subtree: true });
	return () => {
		cancelAnimationFrame(first);
		observer.disconnect();
	};
}

const TabsList: Component<ComponentProps<typeof TabsPrimitive.List>> = (props) => {
	const [local, others] = splitProps(props, ["class", "children"]);
	let listRef: HTMLDivElement | undefined;
	onMount(() => {
		if (listRef) onCleanup(followSelection(listRef));
	});
	return (
		<TabsPrimitive.List
			ref={listRef}
			data-slot="tabs-list"
			class={cn(
				`scrollbar-hide inline-flex h-9 w-full items-center overflow-x-auto rounded-lg ${TRACK_SURFACE} p-1 text-muted-foreground`,
				local.class,
			)}
			{...others}
		>
			{/* w-max so triggers keep their natural width and the track scrolls;
			    w-full alone squeezed them past the rounded edge, unreachable. */}
			<SlidingIndicator
				activeSelector="[data-selected]"
				indicatorClass="rounded-md"
				class="flex h-full w-max min-w-full items-center gap-1"
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
				SEGMENT_ITEM,
				PRESS_DIP,
				"hover:text-primary/80 data-[selected]:text-primary",
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
				SETTLE_MOTION,
				"outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
				local.class,
			)}
			{...others}
		/>
	);
};

export { Tabs, TabsContent, TabsList, TabsTrigger };
