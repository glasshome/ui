import type { Color } from "@kobalte/core/colors";
import { parseColor } from "@kobalte/core/colors";
import { type Component, createSignal, For, type JSX } from "solid-js";
import { FOCUS_RING } from "../lib/input-classes.js";
import { THUMB_COLOR_RING } from "../lib/thumb-classes.js";
import { cn } from "../lib/utils.js";

/** A one-tap choice on a colour picker. */
export interface ColorPin {
	id: string;
	/** What the pin shows, any CSS colour. */
	color: string;
	label: string;
}

/** A pin on the disc, placed at its own hue and saturation. */
export interface ColorDiscPin extends ColorPin {
	hue: number;
	saturation: number;
}

const PIN = 34;
const THUMB = 38;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* Hue 0 at three o'clock, turning clockwise, the direction the conic gradient paints. */
const discBackground =
	"radial-gradient(closest-side, #fff, rgb(255 255 255 / 0) 100%), conic-gradient(from 90deg, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))";

function Pin(props: {
	pin: ColorPin;
	x: number | string;
	y: number | string;
	active: boolean;
	onPick: (id: string) => void;
}) {
	return (
		<button
			type="button"
			data-slot="color-pin"
			data-active={props.active ? "" : undefined}
			aria-label={props.pin.label}
			aria-pressed={props.active}
			class={cn(
				"absolute cursor-pointer rounded-full border-2 border-black/40 shadow-[0_0_0_2px_rgb(255_255_255/0.9),0_2px_6px_rgb(0_0_0/0.4)] transition-transform duration-150 active:scale-90 data-[active]:scale-110",
				FOCUS_RING,
			)}
			style={{
				left: typeof props.x === "number" ? `${props.x}px` : props.x,
				top: typeof props.y === "number" ? `${props.y}px` : props.y,
				width: `${PIN}px`,
				height: `${PIN}px`,
				translate: "-50% -50%",
				background: props.pin.color,
			}}
			onPointerDown={(e) => e.stopPropagation()}
			onClick={() => props.onPick(props.pin.id)}
		/>
	);
}

interface ColorDiscProps {
	/** The colour shown and moved: its hue is the direction from the centre, its saturation the distance. */
	value: Color;
	onChange?: (value: Color) => void;
	onChangeEnd?: (value: Color) => void;
	/** One-tap choices, pinned on the disc at their own colour. */
	pins?: ColorDiscPin[];
	/** The pin the current colour came from, drawn raised. */
	activePin?: string;
	onPin?: (id: string) => void;
	/** Diameter in px. */
	size?: number;
	disabled?: boolean;
	class?: string;
	"aria-label"?: string;
}

/**
 * A colour disc: hue around it, saturation from the white centre to the rim, one thumb for both, and
 * the choices people make most often pinned on it for one tap.
 */
const ColorDisc: Component<ColorDiscProps> = (props) => {
	const size = () => props.size ?? 260;
	const radius = () => size() / 2;
	const hsb = () => props.value.toFormat("hsb");
	const place = (hue: number, saturation: number) => {
		const a = (hue * Math.PI) / 180;
		const r = (clamp(saturation, 0, 100) / 100) * (radius() - PIN / 2);
		return { x: radius() + r * Math.cos(a), y: radius() + r * Math.sin(a) };
	};
	const thumb = () => place(hsb().getChannelValue("hue"), hsb().getChannelValue("saturation"));
	const [dragging, setDragging] = createSignal(false);
	/** The pin the current colour sits on: it shows as chosen and the thumb steps aside, until a drag. */
	const onPin = () => {
		if (dragging()) return undefined;
		const t = thumb();
		return (props.pins ?? []).find((p) => {
			const at = place(p.hue, p.saturation);
			return Math.hypot(at.x - t.x, at.y - t.y) < PIN * 0.6;
		})?.id;
	};

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
			<For each={props.pins ?? []}>
				{(pin) => {
					const at = () => place(pin.hue, pin.saturation);
					return (
						<Pin
							pin={pin}
							x={at().x}
							y={at().y}
							active={(props.activePin ?? onPin()) === pin.id}
							onPick={(id) => props.onPin?.(id)}
						/>
					);
				}}
			</For>
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
					background: props.value.toString("css"),
					"pointer-events": "none",
					opacity: onPin() ? 0 : 1,
				}}
				onKeyDown={onKeyDown}
			/>
		</div>
	);
};

/** A pin on the temperature bar, placed at its own Kelvin. */
export interface TemperaturePin extends ColorPin {
	kelvin: number;
}

interface TemperatureBarProps {
	/** The white shown, in Kelvin. */
	value: number;
	min?: number;
	max?: number;
	onChange?: (kelvin: number) => void;
	onChangeEnd?: (kelvin: number) => void;
	pins?: TemperaturePin[];
	activePin?: string;
	onPin?: (id: string) => void;
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

/** Warm to cool white on one bar, for lamps that only change their white, with the same pins as the disc. */
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
			<div class="pointer-events-none absolute inset-x-[28px] inset-y-0">
				<For each={props.pins ?? []}>
					{(pin) => (
						<span class="pointer-events-auto">
							<Pin
								pin={pin}
								x={`${pos(pin.kelvin)}%`}
								y="50%"
								active={props.activePin === pin.id}
								onPick={(id) => props.onPin?.(id)}
							/>
						</span>
					)}
				</For>
			</div>
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
