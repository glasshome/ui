import { ColorWheel as KColorWheel } from "@kobalte/core/color-wheel";
import type { Color } from "@kobalte/core/colors";
import type { Component } from "solid-js";
import { splitProps } from "solid-js";
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

	return (
		<KColorWheel
			value={local.value}
			defaultValue={local.defaultValue}
			onChange={local.onChange}
			onChangeEnd={local.onChangeEnd}
			thickness={local.thickness ?? 28}
			disabled={local.disabled}
			class={cn(
				"relative touch-none select-none",
				local.disabled && "cursor-not-allowed opacity-50",
				local.class,
			)}
			style={{ width: `${size()}px`, height: `${size()}px` }}
		>
			<KColorWheel.Track
				class="h-full w-full"
				style={{ cursor: local.disabled ? "not-allowed" : "pointer" }}
			>
				{/* Always a circle: the thumb rides a circular track, theme corner radius looks broken there. */}
				<KColorWheel.Thumb
					class="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					aria-label={local["aria-label"] ?? "Hue"}
					style={{
						width: "28px",
						height: "28px",
						background: "var(--kb-color-current)",
						border: "2px solid var(--background)",
						"box-shadow": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
					}}
				>
					<KColorWheel.Input />
				</KColorWheel.Thumb>
			</KColorWheel.Track>
		</KColorWheel>
	);
};

export { ColorWheel };
