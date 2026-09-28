import { Select as SelectPrimitive } from "@kobalte/core/select";
import { type Component, type ComponentProps, type ParentComponent, splitProps } from "solid-js";
import { CONTROL_H, INPUT_SURFACE } from "../lib/input-classes.js";
import { Z_CLASS } from "../lib/layers.js";
import { MENU_ITEM, MENU_LABEL, MENU_SEPARATOR } from "../lib/menu-classes.js";
import { FIELD_MOTION, STAGGER } from "../lib/motion-classes.js";
import { anchorToTriggerTop } from "../lib/overlay-classes.js";
import { PICKER_LIST, PICKER_TRIGGER } from "../lib/picker-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { SlidingIndicator } from "./sliding-indicator.js";

const Select = ((props: ComponentProps<typeof SelectPrimitive>) => (
  <SelectPrimitive gutter={0} getAnchorRect={anchorToTriggerTop} flip={false} overlap {...props} />
)) as typeof SelectPrimitive;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger: ParentComponent<
  ComponentProps<typeof SelectPrimitive.Trigger> & { size?: "sm" | "default" }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "size"]);
  const size = () => local.size ?? "default";
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size()}
      class={cn(
        PICKER_TRIGGER,
        // The one deviation from the shared recipe: a Select sizes to its
        // value, every other picker fills its field.
        "data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground w-fit whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        size() === "sm" && CONTROL_H.sm,
        local.class,
      )}
      {...rest}
    >
      {local.children}
      <SelectPrimitive.Icon>
        <Icon
          icon="lucide:chevron-down"
          width={16}
          height={16}
          class="text-muted-foreground size-4 opacity-50"
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
};

const SelectContent: ParentComponent<
  ComponentProps<typeof SelectPrimitive.Content> & { listboxClass?: string }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "listboxClass"]);
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        class={cn(
          // Same concave surface as the trigger: opening reads as the input
          // expanding, not a separate floating panel.
          INPUT_SURFACE,
          FIELD_MOTION,
          `relative ${Z_CLASS.overlay} text-popover-foreground overflow-hidden rounded-md p-1`,
          local.class,
        )}
        {...rest}
      >
        <SlidingIndicator
          activeSelector="[data-highlighted]"
          orientation="vertical"
          indicatorClass="rounded-sm"
          class={cn("w-full", PICKER_LIST)}
        >
          <SelectPrimitive.Listbox class={cn(STAGGER, local.listboxClass)} />
        </SlidingIndicator>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
};

const SelectLabel: Component<ComponentProps<typeof SelectPrimitive.Label>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      class={cn(MENU_LABEL, "font-normal", local.class)}
      {...rest}
    />
  );
};

const SelectItem: ParentComponent<ComponentProps<typeof SelectPrimitive.Item>> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      class={cn(
        MENU_ITEM,
        "focus:text-foreground data-[highlighted]:text-foreground w-full pr-8 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        local.class,
      )}
      {...rest}
    >
      <span class="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Icon icon="lucide:check" width={16} height={16} class="size-4 text-current" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemLabel>{local.children}</SelectPrimitive.ItemLabel>
    </SelectPrimitive.Item>
  );
};

const SelectGroup: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return <div data-slot="select-group" class={cn("", local.class)} {...rest} />;
};

const SelectSeparator: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="select-separator"
      class={cn("pointer-events-none", MENU_SEPARATOR, local.class)}
      {...rest}
    />
  );
};

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
