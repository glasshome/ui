import { type ComponentProps, createEffect, createSignal, type JSX, on, onCleanup, onMount, Show, splitProps } from "solid-js";
import { cn } from "../lib/utils";

/**
 * The sliding "moving background": a tinted indicator that measures the active item
 * among its children and animates its position/size behind it. Reusable across
 * any component with a selected item among siblings (Dock, Tabs, ToggleGroup,
 * segmented controls…). Presentational + controlled — pass the active index.
 *
 * Wrap the items directly; by default it measures each direct child (excluding
 * its own indicator). Give it `indicatorClass` for the look and `orientation` for the axis.
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
	/** Class for the sliding indicator (background + radius). */
	indicatorClass?: string;
	/** Glass tone for the indicator: set `--glass-tone` so a `.glass` indicatorClass tints
	 *  to this color (e.g. var(--primary)). Omit for a plain (non-glass) indicator. */
	indicatorTone?: string;
	/** Selector for the measurable items. Default: direct children (minus the indicator). */
	itemSelector?: string;
	children: JSX.Element;
}

type Pos = { offset: number; size: number };

export function SlidingIndicator(props: SlidingIndicatorProps) {
	const [local, rest] = splitProps(props, [
		"active",
		"activeSelector",
		"orientation",
		"indicatorClass",
		"indicatorTone",
		"itemSelector",
		"class",
		"children",
	]);
	const horizontal = () => (local.orientation ?? "horizontal") === "horizontal";
	let containerRef: HTMLDivElement | undefined;
	const [pos, setPos] = createSignal<Pos | null>(null);

	// Squash while sliding: the indicator dips slightly smaller in flight and springs
	// back on arrival, for a sense of speed/force. Skips the initial appearance.
	const [moving, setMoving] = createSignal(false);
	let squashTimer: ReturnType<typeof setTimeout> | undefined;
	createEffect(
		on(
			pos,
			(p, prev) => {
				// pos is a fresh object on every re-measure (ResizeObserver / the
				// Select's attribute MutationObserver fire often), so only squash when
				// the indicator actually travels — else `moving` sticks true and the indicator
				// stays scaled down, reading as a phantom left/right margin.
				if (!p || !prev || Math.abs(p.offset - prev.offset) < 1) return;
				setMoving(true);
				clearTimeout(squashTimer);
				squashTimer = setTimeout(() => setMoving(false), 260);
			},
			{ defer: true },
		),
	);
	onCleanup(() => clearTimeout(squashTimer));

	const measure = () => {
		if (!containerRef) return;
		let el: HTMLElement | null | undefined;
		if (local.activeSelector) {
			el = containerRef.querySelector<HTMLElement>(local.activeSelector);
		} else if (local.active != null && local.active >= 0) {
			const sel = local.itemSelector ?? ":scope > :not([data-sliding-indicator])";
			el = containerRef.querySelectorAll<HTMLElement>(sel)[local.active];
		}
		if (!el) {
			setPos(null);
			return;
		}
		// Not laid out yet: a hidden/collapsing popover, a display:none tab panel, or
		// a portal measured before Kobalte positions it all report a zero-size rect.
		// Measuring then would fling the indicator to a bogus offset (a stray tinted blob
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
		// not just a direct child. Add the container's own scroll so the indicator,
		// which scrolls with the content, lands at the content offset; subtract the
		// border so it aligns to the padding box (where the absolute indicator anchors).
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
						data-sliding-indicator
						aria-hidden="true"
						class={cn(
							"-z-10 pointer-events-none absolute transition-[transform,width,height] duration-300 ease-out",
							horizontal() ? "inset-y-0 left-0" : "inset-x-0 top-0",
							local.indicatorClass ?? "rounded-lg bg-primary/15",
						)}
						style={{
							...(local.indicatorTone ? { "--glass-tone": local.indicatorTone } : {}),
							...(horizontal()
								? {
										transform: `translateX(${p().offset}px) scale(${moving() ? 0.92 : 1})`,
										width: `${p().size}px`,
									}
								: {
										transform: `translateY(${p().offset}px) scale(${moving() ? 0.92 : 1})`,
										height: `${p().size}px`,
									}),
						}}
					/>
				)}
			</Show>
			{local.children}
		</div>
	);
}
