import type { Color } from "@kobalte/core/colors";
import { parseColor } from "@kobalte/core/colors";
import { type Component, createSignal, type JSX } from "solid-js";
import { FOCUS_RING } from "../lib/input-classes.js";
import { THUMB_COLOR_RING } from "../lib/thumb-classes.js";
import { cn } from "../lib/utils.js";

const PIN = 34;
const WHITE = parseColor("hsb(0, 0%, 100%)");
const THUMB = 38;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* Hue 0 at three o'clock, turning clockwise, the direction the conic gradient paints. */
const discBackground =
	"radial-gradient(closest-side, #fff, rgb(255 255 255 / 0) 100%), conic-gradient(from 90deg, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))";

interface ColorDiscProps {
	/** The colour shown and moved: its hue is the direction from the centre, its saturation the distance. */
	value?: Color;
	onChange?: (value: Color) => void;
	onChangeEnd?: (value: Color) => void;
	/** Diameter in px. */
	size?: number;
	disabled?: boolean;
	class?: string;
	"aria-label"?: string;
}

/**
 * A colour disc: hue around it, saturation from the white centre to the rim, one thumb for both.
 */
const ColorDisc: Component<ColorDiscProps> = (props) => {
	const size = () => props.size ?? 260;
	const radius = () => size() / 2;
	const value = () => props.value ?? WHITE;
	const hsb = () => value().toFormat("hsb");
	const place = (hue: number, saturation: number) => {
		const a = (hue * Math.PI) / 180;
		const r = (clamp(saturation, 0, 100) / 100) * (radius() - PIN / 2);
		return { x: radius() + r * Math.cos(a), y: radius() + r * Math.sin(a) };
	};
	const thumb = () => place(hsb().getChannelValue("hue"), hsb().getChannelValue("saturation"));
	const [dragging, setDragging] = createSignal(false);
	const colourAt = (e: PointerEvent, el: HTMLElement): Color => {
		const box = el.getBoundingClientRect();
		const dx = e.clientX - (box.left + box.width / 2);
		const dy = e.clientY - (box.top + box.height / 2);
		const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
		const saturation = clamp((Math.hypot(dx, dy) / (box.width / 2 - PIN / 2)) * 100, 0, 100);
		return hsb()
			.withChannelValue("hue", Math.round(hue))
			.withChannelValue("saturation", Math.round(saturation));
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if (props.disabled) return;
		const step = e.shiftKey ? 10 : 2;
		const h = hsb().getChannelValue("hue");
		const s = hsb().getChannelValue("saturation");
		const next =
			e.key === "ArrowLeft"
				? hsb().withChannelValue("hue", (h - step + 360) % 360)
				: e.key === "ArrowRight"
					? hsb().withChannelValue("hue", (h + step) % 360)
					: e.key === "ArrowUp"
						? hsb().withChannelValue("saturation", clamp(s + step, 0, 100))
						: e.key === "ArrowDown"
							? hsb().withChannelValue("saturation", clamp(s - step, 0, 100))
							: undefined;
		if (!next) return;
		e.preventDefault();
		props.onChange?.(next);
		props.onChangeEnd?.(next);
	};

	return (
		<div
			data-slot="color-disc"
			class={cn(
				"relative touch-none select-none rounded-full",
				props.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
				props.class,
			)}
			style={{
				width: `${size()}px`,
				height: `${size()}px`,
				background: discBackground,
				"box-shadow": "inset 0 0 0 1px rgb(255 255 255 / 0.15)",
			}}
			onPointerDown={(e) => {
				if (props.disabled || e.button !== 0) return;
				const el = e.currentTarget;
				el.setPointerCapture?.(e.pointerId);
				setDragging(true);
				props.onChange?.(colourAt(e, el));
			}}
			onPointerMove={(e) => {
				if (dragging()) props.onChange?.(colourAt(e, e.currentTarget));
			}}
			onPointerUp={(e) => {
				if (!dragging()) return;
				setDragging(false);
				props.onChangeEnd?.(colourAt(e, e.currentTarget));
			}}
			onPointerCancel={() => setDragging(false)}
		>
			<div
				role="slider"
				tabIndex={props.disabled ? -1 : 0}
				aria-label={props["aria-label"] ?? "Colour"}
				aria-valuemin={0}
				aria-valuemax={360}
				aria-valuenow={Math.round(hsb().getChannelValue("hue"))}
				aria-valuetext={`Hue ${Math.round(hsb().getChannelValue("hue"))}, saturation ${Math.round(hsb().getChannelValue("saturation"))}%`}
				data-slot="color-disc-thumb"
				class={cn(
					"absolute rounded-full shadow-[0_2px_8px_rgb(0_0_0/0.45)]",
					THUMB_COLOR_RING,
					FOCUS_RING,
				)}
				style={{
					left: `${thumb().x}px`,
					top: `${thumb().y}px`,
					width: `${THUMB}px`,
					height: `${THUMB}px`,
					translate: "-50% -50%",
					background: value().toString("css"),
					"pointer-events": "none",
				}}
				onKeyDown={onKeyDown}
			/>
		</div>
	);
};

interface TemperatureBarProps {
	/** The white shown, in Kelvin. */
	value: number;
	min?: number;
	max?: number;
	onChange?: (kelvin: number) => void;
	onChangeEnd?: (kelvin: number) => void;
	disabled?: boolean;
	class?: string;
	"aria-label"?: string;
}

/** Kelvin to a display colour, for the bar's paint only. */
export function kelvinToCss(kelvin: number): string {
	const t = clamp((kelvin - 2000) / 4500, 0, 1);
	const warm = parseColor("#ff9f3f").toFormat("rgb");
	const mid = parseColor("#fff4e6").toFormat("rgb");
	const cool = parseColor("#d6e6ff").toFormat("rgb");
	const [a, b, u] = t < 0.5 ? [warm, mid, t * 2] : [mid, cool, (t - 0.5) * 2];
	const mix = (ch: "red" | "green" | "blue") =>
		Math.round(a.getChannelValue(ch) + (b.getChannelValue(ch) - a.getChannelValue(ch)) * u);
	return `rgb(${mix("red")} ${mix("green")} ${mix("blue")})`;
}

/** Warm to cool white on one bar, in Kelvin, over the span the lamps can reach. */
const TemperatureBar: Component<TemperatureBarProps> = (props) => {
	const min = () => props.min ?? 2000;
	const max = () => props.max ?? 6500;
	const pos = (k: number) => ((clamp(k, min(), max()) - min()) / (max() - min())) * 100;
	const [dragging, setDragging] = createSignal(false);
	const kelvinAt = (e: PointerEvent, el: HTMLElement) => {
		const box = el.getBoundingClientRect();
		const t = clamp((e.clientX - box.left) / box.width, 0, 1);
		return Math.round((min() + t * (max() - min())) / 50) * 50;
	};
	const gradient = (): JSX.CSSProperties => ({
		background: `linear-gradient(90deg, ${kelvinToCss(min())}, ${kelvinToCss((min() + max()) / 2)}, ${kelvinToCss(max())})`,
	});
	return (
		<div
			data-slot="temperature-bar"
			class={cn(
				"relative h-14 w-full touch-none select-none rounded-full",
				props.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
				props.class,
			)}
			style={gradient()}
			onPointerDown={(e) => {
				if (props.disabled || e.button !== 0) return;
				e.currentTarget.setPointerCapture?.(e.pointerId);
				setDragging(true);
				props.onChange?.(kelvinAt(e, e.currentTarget));
			}}
			onPointerMove={(e) => {
				if (dragging()) props.onChange?.(kelvinAt(e, e.currentTarget));
			}}
			onPointerUp={(e) => {
				if (!dragging()) return;
				setDragging(false);
				props.onChangeEnd?.(kelvinAt(e, e.currentTarget));
			}}
			onPointerCancel={() => setDragging(false)}
		>
			<div
				role="slider"
				tabIndex={props.disabled ? -1 : 0}
				aria-label={props["aria-label"] ?? "White"}
				aria-valuemin={min()}
				aria-valuemax={max()}
				aria-valuenow={props.value}
				aria-valuetext={`${props.value} Kelvin`}
				data-slot="temperature-bar-thumb"
				class={cn(
					"pointer-events-none absolute top-1/2 rounded-full",
					THUMB_COLOR_RING,
					FOCUS_RING,
				)}
				style={{
					left: `calc(28px + (100% - 56px) * ${pos(props.value) / 100})`,
					width: `${THUMB}px`,
					height: `${THUMB}px`,
					translate: "-50% -50%",
					background: kelvinToCss(props.value),
				}}
				onKeyDown={(e) => {
					const step = e.shiftKey ? 500 : 100;
					const d = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
					if (!d || props.disabled) return;
					e.preventDefault();
					const k = clamp(props.value + d, min(), max());
					props.onChange?.(k);
					props.onChangeEnd?.(k);
				}}
			/>
		</div>
	);
};

export { ColorDisc, TemperatureBar };
