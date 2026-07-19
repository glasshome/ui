import { Slider as KSlider } from "@kobalte/core/slider";
import type { Component } from "solid-js";
import { Index, splitProps } from "solid-js";
import { INPUT_SURFACE } from "../lib/input-classes";
import { cn } from "../lib/utils";

const THUMB_SIZE = 28;
const HALF_THUMB = THUMB_SIZE / 2;

interface SliderProps {
	value?: number[];
	defaultValue?: number[];
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	onChange?: (values: number[]) => void;
	onChangeEnd?: (values: number[]) => void;
	class?: string;
	trackClass?: string;
	thumbClass?: string;
	"aria-label"?: string;
	"aria-labelledby"?: string;
}

const Slider: Component<SliderProps> = (props) => {
	const [local] = splitProps(props, [
		"value",
		"defaultValue",
		"min",
		"max",
		"step",
		"disabled",
		"onChange",
		"onChangeEnd",
		"class",
		"trackClass",
		"thumbClass",
		"aria-label",
		"aria-labelledby",
	]);

	return (
		<KSlider
			value={local.value}
			defaultValue={local.defaultValue}
			minValue={local.min ?? 0}
			maxValue={local.max ?? 100}
			step={local.step ?? 1}
			disabled={local.disabled}
			onChange={local.onChange}
			onChangeEnd={local.onChangeEnd}
			class={cn(
				// The rail wears the shared recessed input surface, so the track reads
				// as the same dug-out glass as every Input/Select field.
				"relative flex w-full touch-none select-none items-center rounded-xl",
				INPUT_SURFACE,
				local.disabled && "cursor-not-allowed opacity-50",
				local.class,
			)}
			style={{
				"padding-left": `${HALF_THUMB}px`,
				"padding-right": `${HALF_THUMB}px`,
			}}
		>
			<KSlider.Track
				class={cn("relative w-full", local.trackClass)}
				style={{
					height: `${THUMB_SIZE}px`,
					cursor: local.disabled ? "not-allowed" : "pointer",
				}}
			>
				<KSlider.Fill
						// Bare `.glass` resets to the tinted defaults (see @layer base in
						// globals.css), so the parent rail's INPUT_SURFACE knobs no longer
						// flatten it; only the primary tone needs setting.
						class="glass [--glass-tone:var(--primary)]"
					style={{
						position: "absolute",
						top: "0",
						bottom: "0",
						"margin-left": `${-HALF_THUMB}px`,
						"margin-right": `${-HALF_THUMB}px`,
						"border-radius": "var(--radius-xl)",
					}}
				/>
				<Index each={local.value ?? local.defaultValue ?? [0]}>
					{() => (
						<KSlider.Thumb
							class={cn(
								"absolute top-0 block rounded-xl transition-transform duration-200 ease-out hover:scale-125 active:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
								local.disabled && "cursor-not-allowed",
								local.thumbClass,
							)}
							aria-label={local["aria-label"]}
							aria-labelledby={local["aria-labelledby"]}
							style={{
								width: `${THUMB_SIZE}px`,
								height: `${THUMB_SIZE}px`,
								background: "var(--primary)",
								"box-shadow":
									"0 2px 5px oklch(0 0 0 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.35), inset 0 -2px 3px oklch(0 0 0 / 0.2)",
							}}
						>
							<KSlider.Input />
						</KSlider.Thumb>
					)}
				</Index>
			</KSlider.Track>
		</KSlider>
	);
};

export { Slider };
