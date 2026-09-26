import { ColorWheel as KColorWheel } from "@kobalte/core/color-wheel";
import type { Color } from "@kobalte/core/colors";
import type { Component } from "solid-js";
import { splitProps } from "solid-js";
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
}

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
	]);
	const size = () => local.size ?? 200;
	// Kobalte reads `thickness` as a percentage of the radius, so a px thumb
	// only fits if the ring is sized from the same number the class resolves to.
	// Clamped at the top of that range: past it Kobalte's mask radius goes
	// negative and the ring renders as a filled disc.
	const thickness = () =>
		local.thickness ?? Math.min(100, Math.ceil((THUMB_SIZE / (size() / 2)) * 100));

	return (
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
				local.class,
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
	);
};

export { ColorWheel };
