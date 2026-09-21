import { type Component, type ComponentProps, createSignal, splitProps } from "solid-js";
import { FIELD_CHROME, FOCUS_RING } from "../lib/input-classes.js";
import { THUMB_CLASS, THUMB_FACE_ON } from "../lib/thumb-classes.js";
import { cn } from "../lib/utils.js";

type SwitchProps = Omit<ComponentProps<"button">, "onChange" | "children"> & {
	checked?: boolean;
	defaultChecked?: boolean;
	onChange?: (checked: boolean) => void;
};

const Switch: Component<SwitchProps> = (props) => {
	const [local, rest] = splitProps(props, [
		"class",
		"checked",
		"defaultChecked",
		"onChange",
		"disabled",
		"name",
	]);
	const [uncontrolled, setUncontrolled] = createSignal(props.defaultChecked ?? false);
	const checked = () => local.checked ?? uncontrolled();

	return (
		<button
			{...rest}
			type="button"
			role="switch"
			aria-checked={checked()}
			data-slot="switch"
			data-checked={checked() ? "" : undefined}
			disabled={local.disabled}
			class={cn(
				// Unchecked wears the recessed input surface, the same dug-out glass as
				// the slider rail; checked matches the slider fill. A `border-input`
				// utility here would beat `:where(.glass)` and flatten the rim.
				`group/switch peer relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-xl transition-glass duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`,
				checked() ? "glass glass-tint [--glass-tone:var(--primary)]" : FIELD_CHROME,
				local.class,
			)}
			onClick={() => {
				const next = !checked();
				setUncontrolled(next);
				local.onChange?.(next);
			}}
		>
			<span
				data-slot="switch-thumb"
				class={cn(
					THUMB_CLASS,
					"pointer-events-none transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-data-[checked]/switch:translate-x-full",
				)}
				// Off must read quieter than on: the knob dims with the track rather
				// than staying one bright material in both states.
				style={{
					"--thumb-face-on": THUMB_FACE_ON,
					background: checked() ? "var(--thumb-face-on)" : "var(--thumb-face-off)",
				}}
			/>
			{local.name && <input type="hidden" name={local.name} value={checked() ? "on" : "off"} />}
		</button>
	);
};

export { Switch };
