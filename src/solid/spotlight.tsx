import {
	type Component,
	createEffect,
	createSignal,
	type JSX,
	onCleanup,
	onMount,
	Show,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Z_CLASS } from "../lib/layers.js";
import { SCRIM_MOTION, TRAVEL_MOTION } from "../lib/motion-classes.js";
import { OVERLAY_SURFACE_OPAQUE, PANEL_TAIL, SCRIM_CLASS } from "../lib/overlay-classes.js";
import { type Box, holePath, placeBubble } from "../lib/spotlight-geometry.js";
import { cn } from "../lib/utils.js";

const HOLE_PAD = 8;
const HOLE_RADIUS = 12;
const BUBBLE_GAP = 12;
const VIEWPORT_MARGIN = 12;
const TAIL_SIZE = 16;
const BUBBLE_DEFAULT_WIDTH = 384;
/* The gap grows by the tail's half-diagonal so the rotated square never touches the anchor. */
const BUBBLE_GAP_WITH_TAIL = BUBBLE_GAP + (TAIL_SIZE * Math.SQRT2) / 2;

interface SpotlightProps {
	target: Element | undefined;
	/** What the bubble is placed against and the tail points at. Defaults to `target`. */
	anchor?: Element;
	scrim: boolean;
	blocking?: boolean;
	pad?: number;
	onSkip?: () => void;
	class?: string;
	children: JSX.Element;
}

/* Field-by-field so an unchanged measure (same numbers, new object) writes nothing. */
function sameFields<T extends object>(a: T | null, b: T | null): boolean {
	if (a === b) return true;
	if (!a || !b) return false;
	return (Object.keys(a) as (keyof T)[]).every((key) => a[key] === b[key]);
}

const Spotlight: Component<SpotlightProps> = (props) => {
	const [box, setBox] = createSignal<Box | null>(null, { equals: sameFields });
	const [anchorBox, setAnchorBox] = createSignal<Box | null>(null, { equals: sameFields });
	const [viewport, setViewport] = createSignal(
		{ width: window.innerWidth, height: window.innerHeight },
		{ equals: sameFields },
	);
	const [bubbleSize, setBubbleSize] = createSignal(
		{ width: BUBBLE_DEFAULT_WIDTH, height: 96 },
		{ equals: sameFields },
	);
	let bubble: HTMLDivElement | undefined;

	const anchorEl = () => props.anchor ?? props.target;

	const rectToBox = (el: Element | undefined) => {
		const r = el?.getBoundingClientRect();
		return r ? { x: r.left, y: r.top, width: r.width, height: r.height } : null;
	};

	const measure = () => {
		setViewport({ width: window.innerWidth, height: window.innerHeight });
		const targetBox = rectToBox(props.target);
		setBox(targetBox);
		const anchor = anchorEl();
		/* Same element as target: reuse its box instead of measuring it twice a tick. */
		setAnchorBox(anchor === props.target ? targetBox : rectToBox(anchor));
		if (bubble)
			setBubbleSize({
				width: bubble.offsetWidth || BUBBLE_DEFAULT_WIDTH,
				height: bubble.offsetHeight || 96,
			});
	};

	createEffect(() => {
		const target = props.target;
		const anchor = anchorEl();
		let raf = 0;
		let start: number | undefined;

		/* A transform-animating target never fires ResizeObserver, and its motion may
		 * start a few frames late, so sample the whole window instead of stopping early. */
		const tick = (time: number) => {
			start ??= time;
			measure();
			if (time - start < 600) raf = requestAnimationFrame(tick);
		};

		measure();
		raf = requestAnimationFrame(tick);

		const observer = new ResizeObserver(measure);
		if (target) observer.observe(target);
		if (anchor && anchor !== target) observer.observe(anchor);
		if (bubble) observer.observe(bubble);
		onCleanup(() => {
			cancelAnimationFrame(raf);
			observer.disconnect();
		});
	});

	onMount(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") props.onSkip?.();
		};
		window.addEventListener("resize", measure);
		window.addEventListener("scroll", measure, { capture: true, passive: true });
		document.addEventListener("keydown", onKey);
		onCleanup(() => {
			window.removeEventListener("resize", measure);
			window.removeEventListener("scroll", measure, { capture: true });
			document.removeEventListener("keydown", onKey);
		});
	});

	const place = () =>
		placeBubble(viewport(), anchorBox(), bubbleSize(), BUBBLE_GAP_WITH_TAIL, VIEWPORT_MARGIN);

	return (
		<Portal>
			<Show when={props.scrim}>
				<div
					data-slot="spotlight-scrim"
					data-expanded=""
					aria-hidden="true"
					class={cn(
						"fixed inset-0",
						SCRIM_CLASS,
						Z_CLASS.overlay,
						SCRIM_MOTION,
						TRAVEL_MOTION,
						!box() && !props.blocking && "pointer-events-none",
					)}
					style={{
						"clip-path": `path(evenodd, "${holePath(viewport(), box(), props.pad ?? HOLE_PAD, HOLE_RADIUS)}")`,
					}}
				/>
			</Show>
			<div
				ref={bubble}
				data-slot="spotlight-bubble"
				data-side={place().side}
				class={cn(TRAVEL_MOTION, Z_CLASS.overlay, "fixed top-0 left-0 w-96", props.class)}
				style={{ translate: `${place().x}px ${place().y}px` }}
			>
				<Show when={place().tail}>
					{(tail) => (
						<div
							data-slot="spotlight-tail"
							data-side={place().side}
							aria-hidden="true"
							class={cn(OVERLAY_SURFACE_OPAQUE, "absolute rotate-45 rounded-[2px]")}
							style={{
								width: `${TAIL_SIZE}px`,
								height: `${TAIL_SIZE}px`,
								left: `${tail().x - TAIL_SIZE / 2}px`,
								...(place().side === "above"
									? { bottom: `${-TAIL_SIZE / 2}px` }
									: { top: `${-TAIL_SIZE / 2}px` }),
							}}
						/>
					)}
				</Show>
				<div
					data-slot="spotlight-panel"
					class={cn(OVERLAY_SURFACE_OPAQUE, PANEL_TAIL, "relative z-auto p-4")}
				>
					{props.children}
				</div>
			</div>
		</Portal>
	);
};

export { Spotlight };
