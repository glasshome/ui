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
	/** Extra classes for the sliding indicator — radius and any per-surface `--glass-*`
	 *  knob overrides. The trusted `.glass` material is ALWAYS applied underneath, so
	 *  this can't flatten the indicator; it only tunes it. Default radius: `rounded-lg`. */
	indicatorClass?: string;
	/** Glass tone that drives the `.glass` material (`--glass-tone`). Defaults to
	 *  `var(--primary)` — the one trusted look. Pass another CSS color to re-tint. */
	indicatorTone?: string;
	/** Selector for the measurable items. Default: direct children (minus the indicator). */
	itemSelector?: string;
	children: JSX.Element;
}

type Pos = { offset: number; size: number; cross: number };

// One duration for both the slide (transform transition) and the scale dip, so
// they always overlap exactly. Shorter = snappier.
const SLIDE_MS = 220;

// Squash-and-stretch: at mid-flight the indicator stretches ALONG the travel axis
// and pinches perpendicular, which reads as momentum/speed. Both deforms are a
// fixed PIXEL budget on their own axis (not a percentage), so a 34px dropdown row
// and a 300px-wide one deform by the same visible pixels — a big element no longer
// animates more just because it's big. Each axis measures its own size (`size` =
// travel, `cross` = perpendicular) to turn the pixel budget into a scale factor.
// DEFORM_MAX caps the fraction so a very thin item can't collapse.
const STRETCH_PX = 6; // grow along travel
const SQUASH_PX = 6; // pinch perpendicular
const DEFORM_MAX = 0.14;

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

	// On a real move, play a symmetric squash-and-stretch (1 → peak → 1) over the
	// SAME duration as the slide, so the deform and the travel fully overlap: fastest
	// and most stretched at mid-flight, back to a square at both ends (accelerate in,
	// settle out). At the peak the indicator STRETCHES along the travel axis and
	// PINCHES perpendicular (the reciprocal, so volume is preserved) — the classic
	// speed cue. WAAPI on `scale` composes with the translate transition; it releases
	// back to the base (1) on its own, so nothing can get stuck deformed.
	let indicatorEl: HTMLDivElement | undefined;
	createEffect(
		on(
			pos,
			(p, prev) => {
				// pos is a fresh object on every re-measure (the Select's MutationObserver
				// fires often), so only animate on an actual travel.
				if (!p || !prev || Math.abs(p.offset - prev.offset) < 1 || !indicatorEl) return;
				const stretch = 1 + Math.min(DEFORM_MAX, STRETCH_PX / (p.size || 1));
				const squash = 1 - Math.min(DEFORM_MAX, SQUASH_PX / (p.cross || 1));
				const peak = horizontal() ? `${stretch} ${squash}` : `${squash} ${stretch}`;
				indicatorEl.animate([{ scale: "1 1" }, { scale: peak }, { scale: "1 1" }], {
					duration: SLIDE_MS,
					easing: "ease-in-out",
				});
			},
			{ defer: true },
		),
	);

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
						cross: er.height,
					}
				: {
						offset: er.top - cr.top - containerRef.clientTop + containerRef.scrollTop,
						size: er.height,
						cross: er.width,
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
						ref={indicatorEl}
						data-sliding-indicator
						aria-hidden="true"
						class={cn(
							"-z-10 pointer-events-none absolute ease-out",
							horizontal() ? "inset-y-0 left-0" : "inset-x-0 top-0",
							"glass glass-tint",
							local.indicatorClass ?? "rounded-lg",
						)}
						style={{
							transition: `transform ${SLIDE_MS}ms ease-in-out, width ${SLIDE_MS}ms ease-in-out, height ${SLIDE_MS}ms ease-in-out`,
							"--glass-tone": local.indicatorTone ?? "var(--primary)",
							...(horizontal()
								? { transform: `translateX(${p().offset}px)`, width: `${p().size}px` }
								: { transform: `translateY(${p().offset}px)`, height: `${p().size}px` }),
						}}
					/>
				)}
			</Show>
			{local.children}
		</div>
	);
}
