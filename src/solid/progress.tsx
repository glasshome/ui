import { Progress as ProgressPrimitive } from "@kobalte/core/progress";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { FIELD_CHROME } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";

const Progress: Component<
  ComponentProps<typeof ProgressPrimitive> & { value?: number; tone?: string }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "value", "tone"]);
  return (
    <ProgressPrimitive
      data-slot="progress"
      value={local.value}
      class={cn(FIELD_CHROME, "relative h-2 w-full overflow-hidden rounded-full", local.class)}
      {...rest}
    >
      <ProgressPrimitive.Track class="h-full w-full">
        <ProgressPrimitive.Fill
          data-slot="progress-indicator"
          class="glass glass-tint transition-glass h-full w-full flex-1"
          style={{
            "--glass-tone": local.tone ?? "var(--primary)",
            transform: `translateX(-${100 - (local.value || 0)}%)`,
          }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive>
  );
};

export { Progress };
