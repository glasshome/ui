import { type JSX, Show, splitProps } from "solid-js";
import { DOCK_SLOT_SHAPE } from "../lib/dock-slot-classes.js";
import { FIELD_CHROME } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";

export interface SlotButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  /** An empty place for something to land: the add slot's dashed outline. */
  dashed?: boolean;
  /** A name under the slot; it names the button too. */
  label?: string;
}

/** A button in the dock's slot shape: it holds the icon a dock item will wear. */
export function SlotButton(props: SlotButtonProps) {
  const [own, rest] = splitProps(props, ["dashed", "label", "class", "children"]);
  return (
    <button
      type="button"
      data-slot="slot-button"
      class={cn(
        "group/slot-button flex min-w-0 touch-manipulation flex-col items-center gap-1.5 rounded-lg text-xs font-medium outline-none",
        own.class,
      )}
      {...rest}
    >
      <span
        data-slot="slot-button-face"
        class={cn(
          DOCK_SLOT_SHAPE,
          "transition-glass group-focus-visible/slot-button:ring-ring/50 shrink-0 duration-200 group-focus-visible/slot-button:ring-[3px] group-active/slot-button:scale-[0.97]",
          own.dashed
            ? "text-muted-foreground border-foreground/30 group-hover/slot-button:text-foreground group-hover/slot-button:border-foreground/60 border-2 border-dashed"
            : `${FIELD_CHROME} text-foreground`,
        )}
      >
        {own.children}
      </span>
      <Show when={own.label}>
        <span data-slot="slot-button-label" class="text-foreground max-w-full truncate">
          {own.label}
        </span>
      </Show>
    </button>
  );
}
