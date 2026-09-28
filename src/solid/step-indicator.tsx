import { For } from "solid-js";
import { POSITION_BAR, POSITION_BAR_LIT } from "../lib/position-bar-classes.js";
import { cn } from "../lib/utils.js";

/**
 * Position inside a multi-step flow: lit bars for the eye, one spoken line for
 * screen readers. The bars carry no text of their own, so the sr-only line is
 * the only place the position is readable.
 */
export function StepIndicator(props: { count: number; index: number; class?: string }) {
  const steps = () => Array.from({ length: Math.max(props.count, 0) }, (_, step) => step);

  return (
    <div
      data-slot="step-indicator"
      class={cn("flex items-center justify-center gap-1", props.class)}
    >
      <span class="sr-only">{`Step ${props.index + 1} of ${props.count}`}</span>
      <For each={steps()}>
        {(step) => (
          <span
            data-slot="step-indicator-segment"
            aria-current={step === props.index ? "step" : undefined}
            class={cn(POSITION_BAR, "w-6", step <= props.index && POSITION_BAR_LIT)}
          />
        )}
      </For>
    </div>
  );
}
