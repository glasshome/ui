import type { JSX } from "solid-js";
import { For } from "solid-js";
import { cn } from "../lib/utils.js";
import { RadioGroup, RadioGroupItem } from "./radio-group.js";

/** One colour out of a few, as swatches sharing one row; `children` is the custom slot at the end (a picker). */
export function SwatchPicker(props: {
	value: string | null;
	colors: readonly string[];
	onChange: (color: string) => void;
	"aria-label": string;
	/** Names each swatch for assistive tech. */
	labelOf?: (color: string, index: number) => string;
	class?: string;
	children?: JSX.Element;
}) {
	return (
		<RadioGroup
			data-slot="swatch-picker"
			class={cn("grid auto-cols-fr grid-flow-col items-center gap-2", props.class)}
			value={props.value ?? ""}
			onChange={props.onChange}
			aria-label={props["aria-label"]}
		>
			<For each={props.colors}>
				{(color, index) => (
					<RadioGroupItem
						data-slot="swatch-picker-item"
						value={color}
						showControl={false}
						class="group/swatch"
					>
						<span
							data-slot="swatch-picker-swatch"
							class="block aspect-square w-full max-w-9 rounded-full border border-foreground/15 transition-glass duration-200 group-active/swatch:scale-90 group-has-[:focus-visible]/swatch:ring-[3px] group-has-[:focus-visible]/swatch:ring-ring/50 group-data-[checked]/swatch:ring-2 group-data-[checked]/swatch:ring-foreground group-data-[checked]/swatch:ring-offset-2 group-data-[checked]/swatch:ring-offset-transparent"
							style={{ background: color }}
						/>
						<span class="sr-only">
							{props.labelOf?.(color, index()) ?? `Colour ${index() + 1}`}
						</span>
					</RadioGroupItem>
				)}
			</For>
			{props.children}
		</RadioGroup>
	);
}
