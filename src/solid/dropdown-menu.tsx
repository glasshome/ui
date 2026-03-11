import { DropdownMenu as DropdownMenuPrimitive } from "@kobalte/core/dropdown-menu";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const DropdownMenu = DropdownMenuPrimitive;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuContent: Component<ComponentProps<typeof DropdownMenuPrimitive.Content>> = (
  props,
) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        class={cn(
          "data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[closed]:animate-out data-[expanded]:animate-in",
          local.class,
        )}
        {...others}
      />
    </DropdownMenuPrimitive.Portal>
  );
};

const DropdownMenuItem: Component<ComponentProps<typeof DropdownMenuPrimitive.Item>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      class={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
        local.class,
      )}
      {...others}
    />
  );
};

const DropdownMenuSeparator: Component<ComponentProps<typeof DropdownMenuPrimitive.Separator>> = (
  props,
) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      class={cn("-mx-1 my-1 h-px bg-border", local.class)}
      {...others}
    />
  );
};

const DropdownMenuLabel: Component<ComponentProps<typeof DropdownMenuPrimitive.GroupLabel>> = (
  props,
) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <DropdownMenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      class={cn("px-2 py-1.5 font-medium text-sm", local.class)}
      {...others}
    />
  );
};

const DropdownMenuShortcut: Component<ComponentProps<"span">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      class={cn("ml-auto text-muted-foreground text-xs tracking-widest", local.class)}
      {...others}
    />
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuRadioGroup,
};
