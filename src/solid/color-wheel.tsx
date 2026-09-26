import { ColorWheel as KColorWheel } from "@kobalte/core/color-wheel";
import type { Color } from "@kobalte/core/colors";
import type { Component } from "solid-js";
import { createSignal, Show, splitProps } from "solid-js";
import { FOCUS_RING } from "../lib/input-classes.js";
import { THUMB_CLASS, THUMB_COLOR_RING, THUMB_SIZE } from "../lib/thumb-classes.js";
import { cn } from "../lib/utils.js";

interface ColorWheelProps {
	value?: Color;
	defaultValue?: Color;
	onChange?: (value: Color) => void;
	onChangeEnd?: (value: Color) => void;
	/** Wheel diameter in px */
	size?: number;
	/** Ring thickness, 0-100 relative to the radius */
	thickness?: number;
	disabled?: boolean;
	class?: string;
	"aria-label"?: string;
	/** An inner ring that sets the saturation of the same colour, so hue and saturation are one control. */
	saturationRing?: boolean;
}

/* The saturation ring is an open arc, so its two ends never meet: it starts
 * bottom-left and sweeps clockwise 270 degrees to bottom-right. */
const ARC_START = 225;
const ARC_SWEEP = 270;
const RING_GAP = 10;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const ColorWheel: Component<ColorWheelProps> = (props) => {
	const [local] = splitProps(props, [
		"value",
		"defaultValue",
		"onChange",
		"onChangeEnd",
		"size",
		"thickness",
		"disabled",
		"class",
		"aria-label",
		"saturationRing",
	]);
	const size = () => local.size ?? 200;
	// Kobalte reads `thickness` as a percentage of the radius, so a px thumb
	// only fits if the ring is sized from the same number the class resolves to.
	// Clamped at the top of that range: past it Kobalte's mask radius goes
	// negative and the ring renders as a filled disc.
	const thickness = () =>
		local.thickness ?? Math.min(100, Math.ceil((THUMB_SIZE / (size() / 2)) * 100));

	const ringPx = () => (thickness() / 100) * (size() / 2);
	const innerSize = () => Math.max(0, size() - 2 * (ringPx() + RING_GAP));

	return (
		<div
			class={cn("relative", local.class)}
			style={{ width: `${size()}px`, height: `${size()}px` }}
		>
			<KColorWheel
				value={local.value}
				defaultValue={local.defaultValue}
				onChange={local.onChange}
				onChangeEnd={local.onChangeEnd}
				thickness={thickness()}
				disabled={local.disabled}
				data-slot="color-wheel"
				class={cn(
					"relative touch-none select-none",
					local.disabled && "cursor-not-allowed opacity-50",
				)}
				style={{ width: `${size()}px`, height: `${size()}px` }}
			>
				<KColorWheel.Track
					data-slot="color-wheel-track"
					class={cn("h-full w-full", local.disabled ? "cursor-not-allowed" : "cursor-pointer")}
				>
					{/* Always a circle: the thumb rides a circular track, theme corner radius looks broken there. */}
					<KColorWheel.Thumb
						data-slot="color-wheel-thumb"
						class={cn(THUMB_CLASS, FOCUS_RING, THUMB_COLOR_RING, "rounded-full")}
						aria-label={local["aria-label"] ?? "Hue"}
						style={{ background: "var(--kb-color-current)" }}
					>
						<KColorWheel.Input />
					</KColorWheel.Thumb>
				</KColorWheel.Track>
			</KColorWheel>
			<Show when={local.saturationRing && local.value && innerSize() > THUMB_SIZE * 2}>
				<SaturationRing
					value={local.value as Color}
					size={innerSize()}
					disabled={local.disabled}
					onChange={(c) => local.onChange?.(c)}
					onChangeEnd={(c) => local.onChangeEnd?.(c)}
				/>
			</Show>
		</div>
	);
};

function SaturationRing(props: {
	value: Color;
	size: number;
	disabled?: boolean;
	onChange: (value: Color) => void;
	onChangeEnd: (value: Color) => void;
}) {
	const [dragging, setDragging] = createSignal(false);
	const hsb = () => props.value.toFormat("hsb");
	const hue = () => hsb().getChannelValue("hue");
	const saturation = () => hsb().getChannelValue("saturation");
	const withSaturation = (s: number) =>
		hsb().withChannelValue("saturation", Math.round(clamp(s, 0, 100)));
	const thumbPx = () => THUMB_SIZE;
	const radius = () => props.size / 2 - thumbPx() / 2;
	const angle = () => ARC_START + (saturation() / 100) * ARC_SWEEP;
	const thumb = () => {
		const rad = (angle() * Math.PI) / 180;
		return {
			x: props.size / 2 + radius() * Math.sin(rad),
			y: props.size / 2 - radius() * Math.cos(rad),
		};
	};

	const saturationAt = (e: PointerEvent, el: HTMLElement) => {
		const box = el.getBoundingClientRect();
		const dx = e.clientX - (box.left + box.width / 2);
		const dy = e.clientY - (box.top + box.height / 2);
		const fromTop = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
		const along = (fromTop - ARC_START + 360) % 360;
		// Inside the gap at the bottom, snap to the nearer end.
		if (along > ARC_SWEEP) return along > ARC_SWEEP + (360 - ARC_SWEEP) / 2 ? 0 : 100;
		return (along / ARC_SWEEP) * 100;
	};

	const onPointerDown = (e: PointerEvent) => {
		if (props.disabled || e.button !== 0) return;
		const el = e.currentTarget as HTMLElement;
		el.setPointerCapture?.(e.pointerId);
		setDragging(true);
		props.onChange(withSaturation(saturationAt(e, el)));
	};
	const onPointerMove = (e: PointerEvent) => {
		if (!dragging()) return;
		props.onChange(withSaturation(saturationAt(e, e.currentTarget as HTMLElement)));
	};
	const onPointerUp = (e: PointerEvent) => {
		if (!dragging()) return;
		setDragging(false);
		props.onChangeEnd(withSaturation(saturationAt(e, e.currentTarget as HTMLElement)));
	};
	const onKeyDown = (e: KeyboardEvent) => {
		const step = e.shiftKey ? 10 : 1;
		const delta =
			e.key === "ArrowRight" || e.key === "ArrowUp"
				? step
				: e.key === "ArrowLeft" || e.key === "ArrowDown"
					? -step
					: 0;
		if (!delta || props.disabled) return;
		e.preventDefault();
		const next = withSaturation(saturation() + delta);
		props.onChange(next);
		props.onChangeEnd(next);
	};

	const track = () =>
		`conic-gradient(from ${ARC_START}deg, hsl(${hue()} 0% 60%), hsl(${hue()} 100% 50%) ${ARC_SWEEP}deg, transparent ${ARC_SWEEP}deg)`;
	const ring = () =>
		`radial-gradient(closest-side, transparent calc(100% - ${thumbPx()}px), #000 calc(100% - ${thumbPx()}px + 1px))`;

	return (
		<div
			data-slot="color-wheel-saturation"
			class={cn(
				"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 touch-none select-none",
				props.disabled ? "cursor-not-allowed" : "cursor-pointer",
			)}
			style={{ width: `${props.size}px`, height: `${props.size}px` }}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={() => setDragging(false)}
		>
			<div
				class="absolute inset-0 rounded-full"
				style={{ background: track(), mask: ring(), "-webkit-mask": ring() }}
			/>
			<div
				data-slot="color-wheel-preview"
				class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/15"
				style={{
					width: `${Math.max(0, props.size - 2 * thumbPx() - 20)}px`,
					height: `${Math.max(0, props.size - 2 * thumbPx() - 20)}px`,
					background: props.value.toString("css"),
				}}
			/>
			<div
				role="slider"
				tabIndex={props.disabled ? -1 : 0}
				aria-label="Saturation"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(saturation())}
				aria-disabled={props.disabled}
				data-slot="color-wheel-saturation-thumb"
				class={cn(THUMB_CLASS, FOCUS_RING, THUMB_COLOR_RING, "absolute rounded-full")}
				style={{
					left: `${thumb().x}px`,
					top: `${thumb().y}px`,
					translate: "-50% -50%",
					background: props.value.toString("css"),
				}}
				onKeyDown={onKeyDown}
			/>
		</div>
	);
}

export { ColorWheel };
