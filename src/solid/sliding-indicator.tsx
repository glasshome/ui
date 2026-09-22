import {
	type ComponentProps,
	createEffect,
	createSignal,
	type JSX,
	on,
	onCleanup,
	onMount,
	Show,
	splitProps,
} from "solid-js";
import { cn } from "../lib/utils.js";

function readTranslate(el: HTMLElement): [number, number] {
	const t = getComputedStyle(el).translate;
	if (!t || t === "none") return [0, 0];
	const [x = "0", y = "0"] = t.split(" ");
	return [Number.parseFloat(x) || 0, Number.parseFloat(y) || 0];
}

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
		"ref",
	]);
	const horizontal = () => (local.orientation ?? "horizontal") === "horizontal";
	let containerRef: HTMLDivElement | undefined;
	// A caller's ref goes through here, not through the spread: `spread()` would
	// hand its own ref to the element and leave containerRef unset, so nothing
	// would ever measure.
	const setContainerRef = (el: HTMLDivElement) => {
		containerRef = el;
		const forwarded = local.ref;
		if (typeof forwarded === "function") forwarded(el);
	};
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

	// A zero-size pass is not a resting state, and nothing is guaranteed to fire
	// when it ends: an ancestor dialog's own open animation neither resizes this
	// container nor bubbles its animationend down here.
	const RETRY_FRAMES = 90;
	let retries = 0;
	let retryFrame: number | undefined;
	const remeasureNextFrame = () => {
		if (disposed || retryFrame !== undefined || retries >= RETRY_FRAMES) return;
		retries += 1;
		retryFrame = requestAnimationFrame(() => {
			retryFrame = undefined;
			if (!disposed) measure();
		});
	};

	const measure = () => {
		if (!containerRef) return;
		syncObservedItems();
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
		// a portal measured before Kobalte positions it. Hide until real geometry.
		const er = el.getBoundingClientRect();
		const cr = containerRef.getBoundingClientRect();
		if (er.width === 0 || er.height === 0 || cr.width === 0 || cr.height === 0) {
			setPos(null);
			remeasureNextFrame();
			return;
		}
		retries = 0;
		// Measure relative to the container via bounding rects (not offsetLeft),
		// so the active item can be a deep descendant (Kobalte menu/listbox items),
		// not just a direct child. Add the container's own scroll so the indicator,
		// which scrolls with the content, lands at the content offset; subtract the
		// border so it aligns to the padding box (where the absolute indicator anchors).
		// A row arriving through gh-stagger is still translated: bounding rects
		// include that travel, its resting place does not.
		// An ancestor mid-zoom (a dialog opening) scales every rect and ends without
		// a resize, so rects convert back to layout pixels by the container's ratio.
		const sx = containerRef.offsetWidth > 0 ? cr.width / containerRef.offsetWidth : 1;
		const sy = containerRef.offsetHeight > 0 ? cr.height / containerRef.offsetHeight : 1;
		const [tx, ty] = readTranslate(el);
		setPos(
			horizontal()
				? {
						offset:
							(er.left - cr.left) / sx - tx - containerRef.clientLeft + containerRef.scrollLeft,
						size: er.width / sx,
						cross: er.height / sy,
					}
				: {
						offset: (er.top - cr.top) / sy - ty - containerRef.clientTop + containerRef.scrollTop,
						size: er.height / sy,
						cross: er.width / sx,
					},
		);
	};

	// Re-measure whenever the (index) active changes; queueMicrotask lets DOM settle.
	createEffect(() => {
		void local.active;
		queueMicrotask(measure);
	});

	// The items actually under the ResizeObserver, so entries can be diffed
	// against the freshly-resolved set on every measure() pass.
	let ro: ResizeObserver | undefined;
	const observedItems = new Set<Element>();
	let disposed = false;

	// Observing only the container missed the case that broke the admin tabs
	// pill: an <iconify-icon> or a webfont finishes loading AFTER first paint and
	// grows the trigger, but a w-full container never itself resizes, so the
	// indicator kept the stale width. Observing the resolved item(s) directly
	// catches that growth.
	function syncObservedItems() {
		if (!containerRef || !ro) return;
		const next = new Set<Element>();
		if (local.activeSelector) {
			const el = containerRef.querySelector(local.activeSelector);
			if (el) next.add(el);
		} else if (local.active != null && local.active >= 0) {
			const sel = local.itemSelector ?? ":scope > :not([data-sliding-indicator])";
			for (const el of containerRef.querySelectorAll(sel)) next.add(el);
		}
		for (const el of observedItems) {
			if (!next.has(el)) {
				ro.unobserve(el);
				observedItems.delete(el);
			}
		}
		for (const el of next) {
			if (!observedItems.has(el)) {
				ro.observe(el);
				observedItems.add(el);
			}
		}
	}

	onMount(() => {
		if (!containerRef) return;
		ro = new ResizeObserver(() => measure());
		containerRef?.addEventListener("animationend", measure);
		ro.observe(containerRef);
		// Attribute-based selection (e.g. Kobalte's [data-selected]/[data-highlighted]):
		// re-slide when the active child's marker attribute moves, or when items are
		// added/removed, so newly-mounted items land under the same observer.
		const mo = new MutationObserver(() => {
			syncObservedItems();
			queueMicrotask(measure);
		});
		mo.observe(containerRef, {
			childList: true,
			subtree: !!local.activeSelector,
			attributes: !!local.activeSelector,
		});
		// Focus-based selection (e.g. Kobalte menus mark the highlighted item with
		// roving focus, which is not an attribute mutation).
		const onFocusIn = () => queueMicrotask(measure);
		if (local.activeSelector) containerRef.addEventListener("focusin", onFocusIn);
		syncObservedItems();
		queueMicrotask(measure);
		// Web fonts can finish loading after the first measure and grow glyphs
		// (the same class of bug the item-level ResizeObserver above fixes for
		// icons); one extra pass once fonts settle catches that too.
		if (typeof document !== "undefined" && document.fonts) {
			document.fonts.ready.then(() => {
				if (!disposed) measure();
			});
		}
		onCleanup(() => {
			disposed = true;
			if (retryFrame !== undefined) cancelAnimationFrame(retryFrame);
			ro?.disconnect();
			mo.disconnect();
			containerRef?.removeEventListener("focusin", onFocusIn);
			containerRef?.removeEventListener("animationend", measure);
		});
	});

	return (
		<div ref={setContainerRef} class={cn("relative isolate", local.class)} {...rest}>
			<Show when={pos()}>
				{(p) => (
					<div
						ref={indicatorEl}
						data-sliding-indicator
						aria-hidden="true"
						class={cn(
							"pointer-events-none absolute -z-10",
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
