import { Progress as ProgressPrimitive } from "@kobalte/core/progress";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils.js";

const Progress: Component<ComponentProps<typeof ProgressPrimitive> & { value?: number }> = (
	props,
) => {
	const [local, rest] = splitProps(props, ["class", "value"]);
	return (
		<ProgressPrimitive
			data-slot="progress"
			value={local.value}
			// Recessed glass channel: a faint tint + an inset shadow so the track
			// reads as a groove the glass fill sits in.
			class={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/15", local.class)}
			style={{ "box-shadow": "inset 0 1px 2px oklch(0 0 0 / 0.18)" }}
			{...rest}
		>
			<ProgressPrimitive.Track class="h-full w-full">
				<ProgressPrimitive.Fill
					data-slot="progress-indicator"
					class="glass h-full w-full flex-1 transition-all"
					style={{
						"--glass-tone": "var(--primary)",
						transform: `translateX(-${100 - (local.value || 0)}%)`,
					}}
				/>
			</ProgressPrimitive.Track>
		</ProgressPrimitive>
	);
};

export { Progress };
