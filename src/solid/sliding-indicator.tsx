import { type ComponentProps, createEffect, type JSX, onCleanup, onMount, Show, createSignal, splitProps } from "solid-js";
import { cn } from "../lib/utils";

/**
 * The sliding "moving background": a tinted pill that measures the active item
 * among its children and animates its position/size behind it. Reusable across
 * any component with a selected item among siblings (Dock, Tabs, ToggleGroup,
 * segmented controls…). Presentational + controlled — pass the active index.
 *
 * Wrap the items directly; by default it measures each direct child (excluding
 * its own pill). Give it `pillClass` for the look and `orientation` for the axis.
 */
interface SlidingIndicatorProps extends ComponentProps<"div"> {
	/** Index-based active item among the measured children, or null to hide.
	 *  Use this when you own the selection (e.g. Dock). */
	active?: number | null;
	/** Attribute-based active item: a selector for the currently-active child
	 *  (e.g. "[data-selected]"). Use this with libraries that mark the active item
	 *  in the DOM (Kobalte Tabs/ToggleGroup); a MutationObserver re-slides on change. */
	activeSelector?: string;
	orientation?: "horizontal" | "vertical";
	/** Class for the sliding pill (background + radius). */
	pillClass?: string;
	/** Selector for the measurable items. Default: direct children (minus the pill). */
	itemSelector?: string;
	children: JSX.Element;
}

type Pos = { offset: number; size: number };

export function SlidingIndicator(props: SlidingIndicatorProps) {
	const [local, rest] = splitProps(props, [
		"active",
		"activeSelector",
		"orientation",
		"pillClass",
		"itemSelector",
		"class",
		"children",
	]);
	const horizontal = () => (local.orientation ?? "horizontal") === "horizontal";
	let containerRef: HTMLDivElement | undefined;
	const [pos, setPos] = createSignal<Pos | null>(null);

	const measure = () => {
		if (!containerRef) return;
		let el: HTMLElement | null | undefined;
		if (local.activeSelector) {
			el = containerRef.querySelector<HTMLElement>(local.activeSelector);
		} else if (local.active != null && local.active >= 0) {
			const sel = local.itemSelector ?? ":scope > :not([data-sliding-pill])";
			el = containerRef.querySelectorAll<HTMLElement>(sel)[local.active];
		}
		if (!el) {
			setPos(null);
			return;
		}
		// Not laid out yet: a hidden/collapsing popover, a display:none tab panel, or
		// a portal measured before Kobalte positions it all report a zero-size rect.
		// Measuring then would fling the pill to a bogus offset (a stray tinted blob
		// that a screenshot catches mid-open), so hide until there is real geometry.
		const er = el.getBoundingClientRect();
		if (er.width === 0 && er.height === 0) {
			setPos(null);
			return;
		}
		if (containerRef.clientWidth === 0 && containerRef.clientHeight === 0) {
			setPos(null);
			return;
		}
		// Measure relative to the container via bounding rects (not offsetLeft),
		// so the active item can be a deep descendant (Kobalte menu/listbox items),
		// not just a direct child. Add the container's own scroll so the pill,
		// which scrolls with the content, lands at the content offset; subtract the
		// border so it aligns to the padding box (where the absolute pill anchors).
		const cr = containerRef.getBoundingClientRect();
		setPos(
			horizontal()
				? {
						offset: er.left - cr.left - containerRef.clientLeft + containerRef.scrollLeft,
						size: er.width,
					}
				: {
						offset: er.top - cr.top - containerRef.clientTop + containerRef.scrollTop,
						size: er.height,
					},
		);
	};

	// Re-measure whenever the (index) active changes; queueMicrotask lets DOM settle.
	createEffect(() => {
		void local.active;
		queueMicrotask(measure);
	});

	onMount(() => {
		if (!containerRef) return;
		// Resize (responsive, font load, reflow).
		const ro = new ResizeObserver(() => measure());
		ro.observe(containerRef);
		// Attribute-based selection (Kobalte): re-slide when the active child's
		// marker attribute moves. Cheap for the small item sets this is used with.
		// Attribute-based selection (e.g. Kobalte's [data-selected]/[data-highlighted]).
		let mo: MutationObserver | undefined;
		// Focus-based selection (e.g. Kobalte menus mark the highlighted item with
		// roving focus, which is not an attribute mutation).
		const onFocusIn = () => queueMicrotask(measure);
		if (local.activeSelector) {
			mo = new MutationObserver(() => queueMicrotask(measure));
			mo.observe(containerRef, { subtree: true, attributes: true, childList: true });
			containerRef.addEventListener("focusin", onFocusIn);
		}
		queueMicrotask(measure);
		onCleanup(() => {
			ro.disconnect();
			mo?.disconnect();
			containerRef?.removeEventListener("focusin", onFocusIn);
		});
	});

	return (
		<div ref={containerRef} class={cn("relative isolate", local.class)} {...rest}>
			<Show when={pos()}>
				{(p) => (
					<div
						data-sliding-pill
						aria-hidden="true"
						class={cn(
							"-z-10 pointer-events-none absolute transition-[transform,width,height] duration-300 ease-out",
							horizontal() ? "top-0 bottom-0 left-0 h-full" : "top-0 right-0 left-0 w-full",
							local.pillClass ?? "rounded-lg bg-primary/15",
						)}
						style={
							horizontal()
								? { transform: `translateX(${p().offset}px)`, width: `${p().size}px` }
								: { transform: `translateY(${p().offset}px)`, height: `${p().size}px` }
						}
					/>
				)}
			</Show>
			{local.children}
		</div>
	);
}
