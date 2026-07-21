import { Icon } from "@iconify-icon/solid";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { INPUT_CLASS } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";

const NumberField: Component<Omit<ComponentProps<"input">, "type">> = (props) => {
	const [local, others] = splitProps(props, ["class", "step", "min", "max"]);
	let ref: HTMLInputElement | undefined;
	const step = () => Number(local.step ?? 1) || 1;

	const nudge = (dir: 1 | -1) => {
		if (!ref) return;
		let next = (Number(ref.value) || 0) + dir * step();
		if (local.min != null) next = Math.max(Number(local.min), next);
		if (local.max != null) next = Math.min(Number(local.max), next);
		ref.value = String(next);
		ref.dispatchEvent(new Event("input", { bubbles: true }));
	};

	return (
		<div class="relative">
			<input
				ref={ref}
				type="number"
				data-slot="number-field"
				step={local.step}
				min={local.min}
				max={local.max}
				class={cn(
					INPUT_CLASS,
					"pr-11 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
					local.class,
				)}
				{...others}
			/>
			<div class="absolute inset-y-0 right-0 flex w-10 flex-col divide-y divide-border overflow-hidden rounded-r-md border-border border-l">
				<button
					type="button"
					tabindex={-1}
					aria-label="Increment"
					onClick={() => nudge(1)}
					class="flex flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted"
				>
					<Icon icon="lucide:chevron-up" width={16} height={16} class="size-4" />
				</button>
				<button
					type="button"
					tabindex={-1}
					aria-label="Decrement"
					onClick={() => nudge(-1)}
					class="flex flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted"
				>
					<Icon icon="lucide:chevron-down" width={16} height={16} class="size-4" />
				</button>
			</div>
		</div>
	);
};

export { NumberField };
