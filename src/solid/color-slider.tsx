import { ColorSlider as KColorSlider } from "@kobalte/core/color-slider";
import type { Color, ColorChannel } from "@kobalte/core/colors";
import type { Component } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "../lib/utils";

const THUMB_SIZE = 28;
const HALF_THUMB = THUMB_SIZE / 2;

interface ColorSliderProps {
	value?: Color;
	defaultValue?: Color;
	channel: ColorChannel;
	onChange?: (value: Color) => void;
	onChangeEnd?: (value: Color) => void;
	disabled?: boolean;
	class?: string;
	"aria-label"?: string;
}

const ColorSlider: Component<ColorSliderProps> = (props) => {
	const [local] = splitProps(props, [
		"value",
		"defaultValue",
		"channel",
		"onChange",
		"onChangeEnd",
		"disabled",
		"class",
		"aria-label",
	]);

	// Same geometry as slider.tsx: the root is padded by half a thumb on each
	// side so the thumb stays fully inside at min/max. Kobalte paints the
	// channel gradient on the (padded) track, which leaves naked strips at the
	// ends, so we rebuild the gradient on the full-width root instead.
	const gradient = () => {
		const color = local.value ?? local.defaultValue;
		if (!color) return undefined;
		const channel = local.channel;
		if (channel === "hue") {
			const stops = [0, 60, 120, 180, 240, 300, 360]
				.map((h) => color.withChannelValue("hue", h).toString("css"))
				.join(", ");
			return `linear-gradient(to right, ${stops})`;
		}
		const { minValue, maxValue } = color.getChannelRange(channel);
		const start = color.withChannelValue(channel, minValue).toString("css");
		const end = color.withChannelValue(channel, maxValue).toString("css");
		if (channel === "lightness") {
			const middle = color.withChannelValue(channel, (maxValue - minValue) / 2).toString("css");
			return `linear-gradient(to right, ${start}, ${middle}, ${end})`;
		}
		return `linear-gradient(to right, ${start}, ${end})`;
	};

	return (
		<KColorSlider
			value={local.value}
			defaultValue={local.defaultValue}
			channel={local.channel}
			onChange={local.onChange}
			onChangeEnd={local.onChangeEnd}
			disabled={local.disabled}
			class={cn(
				"relative flex w-full touch-none select-none items-center rounded-xl",
				local.disabled && "cursor-not-allowed opacity-50",
				local.class,
			)}
			style={{
				"padding-left": `${HALF_THUMB}px`,
				"padding-right": `${HALF_THUMB}px`,
				background: gradient(),
			}}
		>
			<KColorSlider.Track
				class="relative w-full"
				style={{
					height: `${THUMB_SIZE}px`,
					background: "none",
					cursor: local.disabled ? "not-allowed" : "pointer",
				}}
			>
				<KColorSlider.Thumb
					class={cn(
						"absolute top-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
						local.disabled && "cursor-not-allowed",
					)}
					aria-label={local["aria-label"] ?? local.channel}
					style={{
						width: `${THUMB_SIZE}px`,
						height: `${THUMB_SIZE}px`,
						"border-radius": "var(--radius-xl)",
						background: "var(--kb-color-current)",
						border: "2px solid var(--background)",
						"box-shadow": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
					}}
				>
					<KColorSlider.Input />
				</KColorSlider.Thumb>
			</KColorSlider.Track>
		</KColorSlider>
	);
};

export { ColorSlider };
