import { type JSX, Show, splitProps } from "solid-js";
import { PICKER_TRIGGER } from "../lib/picker-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";

export interface PickerTriggerProps
	extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
	/** data-slot for the button, so each picker keeps its own test and style hook. */
	slot: string;
	open: boolean;
	onToggle: () => void;
	/** Passed only when there is a value to drop: its presence paints the clear button. */
	onClear?: () => void;
	clearLabel?: string;
}

export function PickerTrigger(props: PickerTriggerProps) {
	const [own, rest] = splitProps(props, [
		"slot",
		"open",
		"onToggle",
		"onClear",
		"clearLabel",
		"class",
		"children",
	]);

	return (
		<div class="relative">
			<button
				type="button"
				data-slot={own.slot}
				data-expanded={own.open || undefined}
				class={cn(PICKER_TRIGGER, own.class)}
				onClick={() => own.onToggle()}
				{...rest}
			>
				{own.children}
				{/* The clear button cannot nest inside the trigger button, so it is
				    positioned over this gap, left of the chevron. */}
				<Show when={own.onClear}>
					<span class="w-6 shrink-0" />
				</Show>
				<Icon
					icon="lucide:chevron-down"
					width={16}
					height={16}
					class={cn(
						"shrink-0 text-muted-foreground transition-transform",
						own.open && "rotate-180",
					)}
				/>
			</button>
			<Show when={own.onClear}>
				<button
					type="button"
					data-slot="picker-trigger-clear"
					aria-label={own.clearLabel ?? "Clear selection"}
					disabled={rest.disabled}
					class="absolute top-1/2 right-9 flex -translate-y-1/2 items-center rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
					onClick={() => own.onClear?.()}
				>
					<Icon icon="lucide:circle-x" width={16} height={16} />
				</button>
			</Show>
		</div>
	);
}
