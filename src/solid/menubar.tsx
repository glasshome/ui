import { Menubar as MenubarPrimitive } from "@kobalte/core/menubar";
import { Check, ChevronRight, Circle } from "lucide-solid";
import { type Component, type ComponentProps, type ParentComponent, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const MenubarMenu = MenubarPrimitive.Menu;
const MenubarGroup = MenubarPrimitive.Group;
const MenubarRadioGroup = MenubarPrimitive.RadioGroup;
const MenubarSub = MenubarPrimitive.Sub;

const Menubar: Component<ComponentProps<typeof MenubarPrimitive>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <MenubarPrimitive
      data-slot="menubar"
      class={cn(
        "flex h-9 items-center gap-1 rounded-md border bg-background p-1 shadow-xs",
        local.class,
      )}
      {...rest}
    />
  );
};

const MenubarTrigger: Component<ComponentProps<typeof MenubarPrimitive.Trigger>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <MenubarPrimitive.Trigger
      data-slot="menubar-trigger"
      class={cn(
        "flex select-none items-center rounded-sm px-2 py-1 font-medium text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[expanded]:bg-accent data-[expanded]:text-accent-foreground",
        local.class,
      )}
      {...rest}
    />
  );
};

const MenubarContent: Component<ComponentProps<typeof MenubarPrimitive.Content>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        data-slot="menubar-content"
        class={cn(
          "data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[expanded]:animate-in",
          local.class,
        )}
        {...rest}
      />
    </MenubarPrimitive.Portal>
  );
};

const MenubarItem: Component<
  ComponentProps<typeof MenubarPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
  }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "inset", "variant"]);
  const variant = () => local.variant ?? "default";
  return (
    <MenubarPrimitive.Item
      data-slot="menubar-item"
      data-inset={local.inset}
      data-variant={variant()}
      class={cn(
        "data-[variant=destructive]:*:[svg]:!text-destructive relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[inset]:pl-8 data-[variant=destructive]:text-destructive data-[disabled]:opacity-50 data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
        local.class,
      )}
      {...rest}
    />
  );
};

const MenubarCheckboxItem: ParentComponent<ComponentProps<typeof MenubarPrimitive.CheckboxItem>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <MenubarPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      class={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        local.class,
      )}
      {...rest}
    >
      <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Check class="size-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {local.children}
    </MenubarPrimitive.CheckboxItem>
  );
};

const MenubarRadioItem: ParentComponent<ComponentProps<typeof MenubarPrimitive.RadioItem>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <MenubarPrimitive.RadioItem
      data-slot="menubar-radio-item"
      class={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        local.class,
      )}
      {...rest}
    >
      <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Circle class="size-2 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {local.children}
    </MenubarPrimitive.RadioItem>
  );
};

const MenubarLabel: Component<
  ComponentProps<typeof MenubarPrimitive.GroupLabel> & { inset?: boolean }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "inset"]);
  return (
    <MenubarPrimitive.GroupLabel
      data-slot="menubar-label"
      data-inset={local.inset}
      class={cn("px-2 py-1.5 font-medium text-sm data-[inset]:pl-8", local.class)}
      {...rest}
    />
  );
};

const MenubarSeparator: Component<ComponentProps<typeof MenubarPrimitive.Separator>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <MenubarPrimitive.Separator
      data-slot="menubar-separator"
      class={cn("-mx-1 my-1 h-px bg-border", local.class)}
      {...rest}
    />
  );
};

const MenubarShortcut: Component<ComponentProps<"span">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <span
      data-slot="menubar-shortcut"
      class={cn("ml-auto text-muted-foreground text-xs tracking-widest", local.class)}
      {...rest}
    />
  );
};

const MenubarSubTrigger: ParentComponent<
  ComponentProps<typeof MenubarPrimitive.SubTrigger> & { inset?: boolean }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "inset"]);
  return (
    <MenubarPrimitive.SubTrigger
      data-slot="menubar-sub-trigger"
      data-inset={local.inset}
      class={cn(
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[expanded]:bg-accent data-[inset]:pl-8 data-[expanded]:text-accent-foreground",
        local.class,
      )}
      {...rest}
    >
      {local.children}
      <ChevronRight class="ml-auto h-4 w-4" />
    </MenubarPrimitive.SubTrigger>
  );
};

const MenubarSubContent: Component<ComponentProps<typeof MenubarPrimitive.SubContent>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <MenubarPrimitive.SubContent
      data-slot="menubar-sub-content"
      class={cn(
        "data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[closed]:animate-out data-[expanded]:animate-in",
        local.class,
      )}
      {...rest}
    />
  );
};

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
};
