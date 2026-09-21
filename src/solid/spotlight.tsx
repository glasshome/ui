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
import { FLOATING_PANEL_SURFACE } from "../lib/overlay-classes.js";
import { type Box, holePath, placeBubble } from "../lib/spotlight-geometry.js";
import { cn } from "../lib/utils.js";

const HOLE_PAD = 8;
const HOLE_RADIUS = 12;
const BUBBLE_GAP = 12;
const VIEWPORT_MARGIN = 12;

interface SpotlightProps {
	target: Element | undefined;
	scrim: boolean;
	onSkip?: () => void;
	class?: string;
	children: JSX.Element;
}

const Spotlight: Component<SpotlightProps> = (props) => {
	const [box, setBox] = createSignal<Box | null>(null);
	const [viewport, setViewport] = createSignal({
		width: window.innerWidth,
		height: window.innerHeight,
	});
	const [bubbleSize, setBubbleSize] = createSignal({ width: 288, height: 96 });
	let bubble: HTMLDivElement | undefined;

	const measure = () => {
		setViewport({ width: window.innerWidth, height: window.innerHeight });
		const r = props.target?.getBoundingClientRect();
		setBox(r ? { x: r.left, y: r.top, width: r.width, height: r.height } : null);
		if (bubble)
			setBubbleSize({ width: bubble.offsetWidth || 288, height: bubble.offsetHeight || 96 });
	};

	createEffect(() => {
		const target = props.target;
		measure();
		if (!target) return;
		const observer = new ResizeObserver(measure);
		observer.observe(target);
		onCleanup(() => observer.disconnect());
	});

	onMount(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") props.onSkip?.();
		};
		window.addEventListener("resize", measure);
		window.addEventListener("scroll", measure, { capture: true, passive: true });
		document.addEventListener("keydown", onKey);
		bubble?.focus({ preventScroll: true });
		onCleanup(() => {
			window.removeEventListener("resize", measure);
			window.removeEventListener("scroll", measure, { capture: true });
			document.removeEventListener("keydown", onKey);
		});
	});

	const place = () => placeBubble(viewport(), box(), bubbleSize(), BUBBLE_GAP, VIEWPORT_MARGIN);

	return (
		<Portal>
			<Show when={props.scrim}>
				<div
					data-slot="spotlight-scrim"
					data-expanded=""
					aria-hidden="true"
					class={cn("fixed inset-0 bg-scrim", Z_CLASS.overlay, SCRIM_MOTION, TRAVEL_MOTION)}
					style={{
						"clip-path": `path(evenodd, "${holePath(viewport(), box(), HOLE_PAD, HOLE_RADIUS)}")`,
					}}
				/>
			</Show>
			<div
				ref={bubble}
				data-slot="spotlight-bubble"
				data-side={place().side}
				role="status"
				aria-live="polite"
				tabindex="-1"
				class={cn(
					FLOATING_PANEL_SURFACE,
					TRAVEL_MOTION,
					"fixed top-0 left-0 w-72 p-4",
					props.class,
				)}
				style={{ translate: `${place().x}px ${place().y}px` }}
			>
				{props.children}
			</div>
		</Portal>
	);
};

export { Spotlight };
