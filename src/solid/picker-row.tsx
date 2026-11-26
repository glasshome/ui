import { children, Show, omit } from "solid-js";
import { type ComponentProps, type JSX, type ValidComponent } from "@solidjs/web";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { MENU_ITEM } from "../lib/menu-classes.js";
import { ICON_PILL, ICON_PILL_TINT } from "../lib/pill-classes.js";
import { cn } from "../lib/utils.js";
import { Checkbox } from "./checkbox.js";
import { Icon } from "./icon.js";
import { SelectionHighlight } from "./selection.js";

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
  /** The row the keys point at; it carries `data-highlighted` and the selection glass. */
  highlighted?: boolean;
  multi: boolean;
  dimmed?: boolean;
};

export function PickerRow(props: PickerRowProps) {
  const rest = omit(
    props,
    "as",
    "icon",
    "title",
    "subtitle",
    "meta",
    "selected",
    "highlighted",
    "multi",
    "dimmed",
    "class",
  );
  const subtitle = children(() => props.subtitle);
  const meta = children(() => props.meta);
  return (
    <Polymorphic
      defaultAs="div"
      as={props.as}
      class={cn(
        MENU_ITEM,
        "w-full cursor-pointer gap-3 py-0 text-left",
        props.selected && "text-foreground",
        props.class,
      )}
      style={{ "min-height": `${PICKER_ROW_HEIGHT}px` }}
      data-highlighted={props.highlighted ? "" : undefined}
      {...rest}
    >
      <SelectionHighlight active={props.highlighted} />
      <Show when={props.icon}>
        {(icon) => (
          <div
            class={cn(
              "size-8 rounded-lg",
              props.selected
                ? `${ICON_PILL_TINT} text-foreground [--glass-tone:var(--primary)]`
                : ICON_PILL,
              props.dimmed && "opacity-50",
            )}
          >
            <Icon icon={icon()} width={18} height={18} />
          </div>
        )}
      </Show>
      <div class={cn("min-w-0 flex-1", props.dimmed && "opacity-60")}>
        <div class="truncate font-medium">{props.title}</div>
        <Show when={subtitle()}>
          <div class="text-muted-foreground truncate text-xs">{subtitle()}</div>
        </Show>
      </div>
      <Show when={meta()}>
        <span
          class={cn(
            "text-muted-foreground max-w-24 shrink-0 truncate text-xs",
            props.dimmed && "italic",
          )}
        >
          {meta()}
        </span>
      </Show>
      <Show
        when={props.multi}
        fallback={
          <div class="flex size-4 shrink-0 items-center justify-center">
            <Show when={props.selected}>
              <Icon icon="lucide:check" width={16} height={16} class="text-primary" />
            </Show>
          </div>
        }
      >
        <div aria-hidden="true" class="pointer-events-none shrink-0">
          <Checkbox
            checked={props.selected}
            disabled
            size="sm"
            class="cursor-pointer opacity-100"
          />
        </div>
      </Show>
    </Polymorphic>
  );
}
