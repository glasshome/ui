import { type Component, splitProps } from "solid-js";
import { INPUT_SURFACE } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";

const TRACK_HEIGHT = 28;
const THUMB_SIZE = 28;
const TRACK_WIDTH = THUMB_SIZE * 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE;

export interface SwitchProps {
	checked?: boolean;
	defaultChecked?: boolean;
	onChange?: (checked: boolean) => void;
	disabled?: boolean;
	class?: string;
	name?: string;
}

const Switch: Component<SwitchProps> = (props) => {
	const [local] = splitProps(props, [
		"class",
		"checked",
		"defaultChecked",
		"onChange",
		"disabled",
		"name",
	]);

	return (
		<button
			type="button"
			role="switch"
			aria-checked={local.checked ?? false}
			data-slot="switch"
			disabled={local.disabled}
			class={cn(
				// Unchecked wears the recessed input surface, the same dug-out glass as
				// the slider rail; checked matches the slider fill. A `border-input`
				// utility here would beat `:where(.glass)` and flatten the rim.
				"peer relative inline-flex shrink-0 cursor-pointer items-center rounded-xl outline-none transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
				local.checked ? "glass glass-tint [--glass-tone:var(--primary)]" : INPUT_SURFACE,
				local.class,
			)}
			style={{
				width: `${TRACK_WIDTH}px`,
				height: `${TRACK_HEIGHT}px`,
			}}
			onClick={() => local.onChange?.(!local.checked)}
		>
			<span
				data-slot="switch-thumb"
				class="pointer-events-none block rounded-xl transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
				style={{
					width: `${THUMB_SIZE}px`,
					height: `${THUMB_SIZE}px`,
					background: "var(--primary)",
					"box-shadow":
						"0 2px 5px oklch(0 0 0 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.35), inset 0 -2px 3px oklch(0 0 0 / 0.2)",
					transform: `translateX(${local.checked ? THUMB_TRAVEL : 0}px)`,
				}}
			/>
			{local.name && <input type="hidden" name={local.name} value={local.checked ? "on" : "off"} />}
		</button>
	);
};

export { Switch };
