import { type ComponentProps, type JSX, Show, splitProps, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { MENU_ITEM } from "../lib/menu-classes.js";
import { ICON_PILL, ICON_PILL_TINT } from "../lib/pill-classes.js";
import { cn } from "../lib/utils.js";
import { Checkbox } from "./checkbox.js";
import { Icon } from "./icon.js";

/* One row for every picker that lists things with an icon (entities, areas):
 * icon well, title over a muted line, optional meta, and the selection
 * control (a presentation-only Checkbox when picking many, a check when
 * picking one). The row owns the click; the control never does. */
export const PICKER_ROW_HEIGHT = 52;

type PickerRowProps = Omit<ComponentProps<"button">, "title"> & {
  as?: ValidComponent;
  icon?: string;
  title: JSX.Element;
  subtitle?: JSX.Element;
  meta?: JSX.Element;
  selected: boolean;
  multi: boolean;
  dimmed?: boolean;
};

export function PickerRow(props: PickerRowProps) {
  const [local, rest] = splitProps(props, [
    "as",
    "icon",
    "title",
    "subtitle",
    "meta",
    "selected",
    "multi",
    "dimmed",
    "class",
  ]);
  return (
    <Dynamic
      component={local.as ?? "div"}
      class={cn(
        MENU_ITEM,
        "w-full cursor-pointer gap-3 py-0 text-left",
        local.selected && "text-foreground",
        local.class,
      )}
      style={{ "min-height": `${PICKER_ROW_HEIGHT}px` }}
      {...rest}
    >
      <Show when={local.icon}>
        {(icon) => (
          <div
            class={cn(
              "size-8 rounded-lg",
              local.selected
                ? `${ICON_PILL_TINT} text-foreground [--glass-tone:var(--primary)]`
                : ICON_PILL,
              local.dimmed && "opacity-50",
            )}
          >
            <Icon icon={icon()} width={18} height={18} />
          </div>
        )}
      </Show>
      <div class={cn("min-w-0 flex-1", local.dimmed && "opacity-60")}>
        <div class="truncate font-medium">{local.title}</div>
        <Show when={local.subtitle}>
          <div class="text-muted-foreground truncate text-xs">{local.subtitle}</div>
        </Show>
      </div>
      <Show when={local.meta}>
        <span
          class={cn(
            "text-muted-foreground max-w-24 shrink-0 truncate text-xs",
            local.dimmed && "italic",
          )}
        >
          {local.meta}
        </span>
      </Show>
      <Show
        when={local.multi}
        fallback={
          <div class="flex size-4 shrink-0 items-center justify-center">
            <Show when={local.selected}>
              <Icon icon="lucide:check" width={16} height={16} class="text-primary" />
            </Show>
          </div>
        }
      >
        <div aria-hidden="true" class="pointer-events-none shrink-0">
          <Checkbox
            checked={local.selected}
            disabled
            size="sm"
            class="cursor-pointer opacity-100"
          />
        </div>
      </Show>
    </Dynamic>
  );
}
