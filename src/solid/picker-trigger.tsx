import { Show, omit } from "solid-js";
import { type JSX } from "@solidjs/web";
import { PICKER_TRIGGER } from "../lib/picker-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { useUiText } from "./locale.js";
import { useAnchorTrigger } from "./popover.js";

export interface PickerTriggerProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> {
  /** data-slot for the button, so each picker keeps its own test and style hook. */
  slot: string;
  open: boolean;
  onToggle: () => void;
  /** Passed only when there is a value to drop: its presence paints the clear button. */
  onClear?: () => void;
  clearLabel?: string;
}

export function PickerTrigger(props: PickerTriggerProps) {
  const text = useUiText();
  const rest = omit(
    props,
    "slot",
    "open",
    "onToggle",
    "onClear",
    "clearLabel",
    "class",
    "children",
    "ref",
  );
  const anchorTrigger = useAnchorTrigger();

  return (
    <div class="relative">
      <button
        ref={(el) => {
          anchorTrigger?.(el);
          if (typeof props.ref === "function") props.ref(el);
        }}
        type="button"
        data-slot={props.slot}
        data-expanded={props.open || undefined}
        class={cn(PICKER_TRIGGER, props.class)}
        onClick={() => props.onToggle()}
        {...rest}
      >
        {props.children}
        {/* The clear button cannot nest inside the trigger button, so it is
				    positioned over this gap, left of the chevron. */}
        <Show when={props.onClear}>
          <span class="w-6 shrink-0" />
        </Show>
        <Icon
          icon="lucide:chevron-down"
          width={16}
          height={16}
          class={cn(
            "text-muted-foreground shrink-0 transition-transform",
            props.open && "rotate-180",
          )}
        />
      </button>
      <Show when={props.onClear}>
        <button
          type="button"
          data-slot="picker-trigger-clear"
          aria-label={props.clearLabel ?? text("ui.picker-trigger.clear")}
          disabled={rest.disabled}
          class="text-muted-foreground hover:text-foreground absolute top-1/2 right-9 flex -translate-y-1/2 items-center rounded-sm p-1 transition-colors disabled:pointer-events-none disabled:opacity-50"
          onClick={() => props.onClear?.()}
        >
          <Icon icon="lucide:circle-x" width={16} height={16} />
        </button>
      </Show>
    </div>
  );
}
