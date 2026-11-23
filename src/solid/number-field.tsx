import {
  type Component,
  type ComponentProps,
  createSignal,
  on,
  createEffect,
  splitProps,
} from "solid-js";
import { INPUT_CLASS } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { useUiFormat, useUiText } from "./locale.js";

/* The spinner column and the padding that reserves it: one pair, so the value
 * can never run under the chevrons. */
const SPINNER_COLUMN = "w-10";
const SPINNER_RESERVE = "pr-10";

const NumberField: Component<Omit<ComponentProps<"input">, "type">> = (props) => {
  const [local, others] = splitProps(props, ["class", "step", "min", "max"]);
  let ref: HTMLInputElement | undefined;
  const text = useUiText();
  const format = useUiFormat();
  const [typed, setTyped] = createSignal<string>();
  createEffect(
    on(
      () => props.value,
      () => setTyped(undefined),
      { defer: true },
    ),
  );
  const valueText = () => {
    const raw = typed() ?? (props.value == null ? "" : String(props.value));
    const value = Number(raw);
    return raw.trim() === "" || !Number.isFinite(value)
      ? undefined
      : format.number(value, { maximumFractionDigits: 20 });
  };
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
    <div data-slot="number-field-root" class="relative">
      <input
        ref={ref}
        type="number"
        data-slot="number-field"
        aria-valuetext={valueText()}
        on:input={(e) => setTyped(e.currentTarget.value)}
        step={local.step}
        min={local.min}
        max={local.max}
        class={cn(
          INPUT_CLASS,
          SPINNER_RESERVE,
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          local.class,
        )}
        {...others}
      />
      <div
        data-slot="number-field-spinner"
        class={cn(
          "divide-border border-border absolute inset-y-0 right-0 flex flex-col divide-y overflow-hidden rounded-r-md border-l",
          SPINNER_COLUMN,
        )}
      >
        <button
          type="button"
          tabindex={-1}
          aria-label={text("ui.number-field.increment")}
          onClick={() => nudge(1)}
          class="text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted flex flex-1 items-center justify-center transition-colors"
        >
          <Icon icon="lucide:chevron-up" width={16} height={16} class="size-4" />
        </button>
        <button
          type="button"
          tabindex={-1}
          aria-label={text("ui.number-field.decrement")}
          onClick={() => nudge(-1)}
          class="text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted flex flex-1 items-center justify-center transition-colors"
        >
          <Icon icon="lucide:chevron-down" width={16} height={16} class="size-4" />
        </button>
      </div>
    </div>
  );
};

export { NumberField };
