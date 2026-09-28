import { DropdownMenu as DropdownMenuPrimitive } from "@kobalte/core/dropdown-menu";
import { useMenuContext } from "@kobalte/core/menu";
import { type Component, type ComponentProps, type ParentComponent, splitProps } from "solid-js";
import { MORPH_MOTION } from "../lib/motion-classes.js";
import { anchorToTriggerTop } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";
import {
  MENU_CONTENT_CLASS,
  MenuCheckboxItemPart,
  MenuContentIndicator,
  MenuItemPart,
  MenuLabelPart,
  MenuRadioItemPart,
  MenuSeparatorPart,
  MenuSubContentPart,
  MenuSubTriggerPart,
} from "./menu-parts.js";

/* The panel covers the trigger (see MORPH_MOTION); statics carried across so
 * `DropdownMenu.Portal` keeps resolving. */
const DropdownMenuRoot: Component<ComponentProps<typeof DropdownMenuPrimitive>> = (props) => (
  <DropdownMenuPrimitive gutter={0} getAnchorRect={anchorToTriggerTop} {...props} />
);
const DropdownMenu = Object.assign(DropdownMenuRoot, DropdownMenuPrimitive) as Component<
  ComponentProps<typeof DropdownMenuPrimitive>
> &
  typeof DropdownMenuPrimitive;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuTrigger: Component<ComponentProps<typeof DropdownMenuPrimitive.Trigger>> = (
  props,
) => {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
};

const DropdownMenuContent: Component<ComponentProps<typeof DropdownMenuPrimitive.Content>> = (
  props,
) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  const menu = useMenuContext();
  // The morph starts as the trigger's box: its height and radius are read
  // from the trigger itself, its width is kobalte's anchor width.
  const writeMorphStart = (el: HTMLElement) => {
    const trigger = menu.triggerRef();
    if (!trigger) return;
    const height = trigger.getBoundingClientRect().height;
    // A pill's radius is "infinite"; the rendered one is half its height.
    const radius = Math.min(
      Number.parseFloat(getComputedStyle(trigger).borderTopLeftRadius) || 0,
      height / 2,
    );
    el.style.setProperty("--morph-h", `${height}px`);
    el.style.setProperty("--morph-radius", `${radius}px`);
  };
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={writeMorphStart}
        data-slot="dropdown-menu-content"
        class={cn(MENU_CONTENT_CLASS, MORPH_MOTION, local.class)}
        {...others}
      >
        <MenuContentIndicator>{local.children}</MenuContentIndicator>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
};

const DropdownMenuItem: Component<
  ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    tone?: string;
    /** @deprecated pass `tone="var(--destructive)"` instead */
    variant?: "default" | "destructive";
  }
> = (props) => <MenuItemPart slotName="dropdown-menu-item" {...props} />;

const DropdownMenuSubTrigger: ParentComponent<
  ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }
> = (props) => <MenuSubTriggerPart slotName="dropdown-menu-sub-trigger" {...props} />;

const DropdownMenuSubContent: ParentComponent<
  ComponentProps<typeof DropdownMenuPrimitive.SubContent>
> = (props) => <MenuSubContentPart slotName="dropdown-menu-sub-content" {...props} />;

const DropdownMenuCheckboxItem: ParentComponent<
  ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>
> = (props) => <MenuCheckboxItemPart slotName="dropdown-menu-checkbox-item" {...props} />;

const DropdownMenuRadioItem: ParentComponent<
  ComponentProps<typeof DropdownMenuPrimitive.RadioItem>
> = (props) => <MenuRadioItemPart slotName="dropdown-menu-radio-item" {...props} />;

const DropdownMenuSeparator: Component<ComponentProps<typeof DropdownMenuPrimitive.Separator>> = (
  props,
) => <MenuSeparatorPart slotName="dropdown-menu-separator" {...props} />;

const DropdownMenuLabel: Component<
  ComponentProps<typeof DropdownMenuPrimitive.GroupLabel> & { inset?: boolean }
> = (props) => <MenuLabelPart slotName="dropdown-menu-label" {...props} />;

const DropdownMenuShortcut: Component<ComponentProps<"span">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      class={cn("text-muted-foreground ml-auto text-xs tracking-widest", local.class)}
      {...others}
    />
  );
};

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
