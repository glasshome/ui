import { Progress as ProgressPrimitive } from "@kobalte/core/progress";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Progress: Component<ComponentProps<typeof ProgressPrimitive> & { value?: number }> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "value"]);
  return (
    <ProgressPrimitive
      data-slot="progress"
      value={local.value}
      class={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", local.class)}
      {...rest}
    >
      <ProgressPrimitive.Track class="h-full w-full">
        <ProgressPrimitive.Fill
          data-slot="progress-indicator"
          class="h-full w-full flex-1 bg-primary transition-all"
          style={{ transform: `translateX(-${100 - (local.value || 0)}%)` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive>
  );
};

export { Progress };
