import { Show, omit } from "solid-js";
import { type JSX } from "@solidjs/web";
import { focusWithoutTracking } from "../lib/behavior/focus-scope.js";
import { CONTROL_H, FIELD_TEXT } from "../lib/input-classes.js";
import { CONTROL_H_TOUCH } from "../lib/picker-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";

export interface PickerSearchProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onInput" | "class"
> {
  value?: string;
  onValueChange?: (value: string) => void;
  /** Rendered leading; the row is a divider, not a nested field. */
  icon?: string;
  /** Trailing button that empties the query; hidden while it is empty. */
  clearLabel?: string;
  class?: string;
  inputRef?: (el: HTMLInputElement) => void;
  /** "touch" is the sheet row: a picker that opens as a bottom sheet makes this
   *  its primary control, so it takes the full touch target. */
  size?: "default" | "touch";
}

const SEARCH_H = { default: CONTROL_H.default, touch: CONTROL_H_TOUCH } as const;

/* The search row inside a picker panel. A bare input, not a nested Input: the
 * panel already wears the field surface, so a second one reads as a field in a
 * field. */
export function PickerSearch(props: PickerSearchProps) {
  const rest = omit(
    props,
    "value",
    "onValueChange",
    "icon",
    "clearLabel",
    "class",
    "inputRef",
    "size",
  );
  let input: HTMLInputElement | undefined;
  return (
    <div
      data-slot="picker-search"
      class={cn(
        "border-border/50 flex shrink-0 items-center gap-2 border-b px-3",
        SEARCH_H[props.size ?? "default"],
        props.class,
      )}
    >
      <Icon
        icon={props.icon ?? "mdi:magnify"}
        width={16}
        height={16}
        class="text-muted-foreground shrink-0"
        aria-hidden="true"
      />
      <input
        ref={(el) => {
          input = el;
          props.inputRef?.(el);
        }}
        data-slot="picker-search-input"
        type="text"
        value={props.value ?? ""}
        onInput={(e) => props.onValueChange?.(e.currentTarget.value)}
        class={cn(
          "placeholder:text-muted-foreground h-full w-full min-w-0 appearance-none bg-transparent outline-none",
          FIELD_TEXT,
        )}
        {...rest}
      />
      <Show when={props.clearLabel && props.value}>
        <button
          type="button"
          data-slot="picker-search-clear"
          aria-label={props.clearLabel}
          class="text-muted-foreground hover:text-foreground shrink-0 rounded-sm p-1 transition-colors"
          onClick={() => {
            props.onValueChange?.("");
            focusWithoutTracking(input, { preventScroll: false });
          }}
        >
          <Icon icon="mdi:close-circle" width={16} height={16} />
        </button>
      </Show>
    </div>
  );
}
