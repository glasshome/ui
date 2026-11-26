import {
  type Component,
  type ComponentProps,
  createSignal,
  createUniqueId,
  type JSX,
  splitProps,
  untrack,
  type ValidComponent,
} from "solid-js";
import type { AnchorLike } from "../lib/behavior/anchored.js";
import { ButtonRoot, type ButtonRootProps } from "../lib/behavior/button-root.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { createMenuButton } from "../lib/behavior/menu.js";
import { callEventHandler, effect, merge } from "../lib/behavior/solid.js";
import { MORPH_MOTION, MOTION_EXIT_MS } from "../lib/motion-classes.js";
import { cn } from "../lib/utils.js";
import {
  createMenuLevel,
  type MenuCheckboxItemProps,
  MenuCheckboxItemPart,
  MenuContentPart,
  type MenuContentProps,
  MenuGroup,
  MenuItemIndicator,
  type MenuItemProps,
  MenuItemPart,
  type MenuLabelProps,
  MenuLabelPart,
  MenuLevelProvider,
  type MenuPlacement,
  MenuRadioGroup,
  type MenuRadioItemProps,
  MenuRadioItemPart,
  MenuSeparatorPart,
  MenuSub,
  MenuSubContentPart,
  type MenuSubTriggerProps,
  MenuSubTriggerPart,
  parsePlacement,
  useMenuLevel,
} from "./menu-parts.js";
import { controlRadius } from "../lib/anchor-placement.js";

type AnchorRect = { x?: number; y?: number; width?: number; height?: number };

interface DropdownMenuRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: MenuPlacement;
  gutter?: number;
  /** The box the panel sits beside, read from the trigger; unset, the panel covers the trigger. */
  getAnchorRect?: (anchor?: HTMLElement) => AnchorRect | undefined;
  children?: JSX.Element;
}

function rectOf(trigger: HTMLElement, read: (el?: HTMLElement) => AnchorRect | undefined) {
  const anchor: AnchorLike = {
    getBoundingClientRect: () => {
      const rect = read(trigger) ?? {};
      return {
        left: rect.x ?? 0,
        top: rect.y ?? 0,
        width: rect.width ?? 0,
        height: rect.height ?? 0,
      };
    },
    getRootNode: () => trigger.getRootNode(),
  };
  return anchor;
}

const DropdownMenuRoot: Component<DropdownMenuRootProps> = (props) => {
  const [open, setOpen] = createControllableSignal<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (next) => props.onOpenChange?.(next),
  });
  const placement = () => parsePlacement(props.placement ?? "bottom-start");
  const level = createMenuLevel({
    open,
    onOpenChange: setOpen,
    anchor: (trigger) => {
      const read = props.getAnchorRect;
      return read && trigger ? rectOf(trigger, read) : trigger;
    },
    coverAnchor: !props.getAnchorRect,
    side: () => placement()[0],
    align: () => placement()[1],
    offset: untrack(() => props.gutter ?? 0),
  });
  return <MenuLevelProvider value={level}>{props.children}</MenuLevelProvider>;
};

type TriggerHandlers = {
  id?: string;
  ref?: unknown;
  onPointerDown?: JSX.EventHandlerUnion<HTMLElement, PointerEvent>;
  onKeyDown?: JSX.EventHandlerUnion<HTMLElement, KeyboardEvent>;
  onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>;
};

type Bound<E extends Event> = E & { currentTarget: HTMLElement; target: Element };

function DropdownMenuTrigger<T extends ValidComponent = "button">(
  props: ButtonRootProps<T>,
): JSX.Element {
  const level = useMenuLevel();
  const menu = level.menu;
  const [local, rest] = splitProps(props as ButtonRootProps<ValidComponent> & TriggerHandlers, [
    "id",
    "ref",
    "disabled",
    "onPointerDown",
    "onKeyDown",
    "onClick",
  ]);
  const fallback = createUniqueId();
  const id = (): string => local.id ?? fallback;
  effect(id, (value) => {
    level.setTriggerId(value);
    return () => level.setTriggerId(undefined);
  });
  const button = createMenuButton(menu, () => local.disabled ?? false);
  const [el, setEl] = createSignal<HTMLElement>();

  // Bound on the element, since Solid's delegated handlers never reach inside a closed shadow root.
  effect(el, (node) => {
    if (!node) return;
    const down = (event: PointerEvent) => {
      callEventHandler(event as Bound<PointerEvent>, local.onPointerDown);
      button.onPointerDown(event);
    };
    const key = (event: KeyboardEvent) => {
      callEventHandler(event as Bound<KeyboardEvent>, local.onKeyDown);
      button.onKeyDown(event);
    };
    node.addEventListener("pointerdown", down);
    node.addEventListener("keydown", key);
    return () => {
      node.removeEventListener("pointerdown", down);
      node.removeEventListener("keydown", key);
      if (untrack(menu.trigger) === node) menu.setTrigger(undefined);
    };
  });

  return (
    <ButtonRoot
      {...merge({ "data-slot": "dropdown-menu-trigger" }, rest, {
        get disabled() {
          return local.disabled;
        },
        get id() {
          return id();
        },
        ref: (node: HTMLElement) => {
          setEl(node);
          menu.setTrigger(node);
          if (typeof local.ref === "function") local.ref(node);
        },
        "aria-haspopup": "true",
        get "data-claim"() {
          return button.claim();
        },
        get "aria-expanded"() {
          return menu.open() ? "true" : "false";
        },
        get "aria-controls"() {
          return menu.open() ? level.contentId() : undefined;
        },
        get "data-expanded"() {
          return menu.open() ? "" : undefined;
        },
        get "data-closed"() {
          return menu.open() ? undefined : "";
        },
        onClick: (event: Bound<MouseEvent>) => {
          callEventHandler(event, local.onClick);
          button.onClick();
        },
      })}
    />
  );
}

/* The panel opens as its trigger's box. */
function writeMorphStart(trigger: HTMLElement | undefined, el: HTMLElement) {
  if (!trigger) return;
  const box = trigger.getBoundingClientRect();
  el.style.setProperty("--kb-popper-anchor-width", `${box.width}px`);
  el.style.setProperty("--morph-h", `${box.height}px`);
  el.style.setProperty("--morph-radius", controlRadius(box.height));
}

const DropdownMenuContent: Component<MenuContentProps> = (props) => {
  const level = useMenuLevel();
  return (
    <MenuContentPart
      slotName="dropdown-menu-content"
      motionClass={MORPH_MOTION}
      exitMs={MOTION_EXIT_MS.anchored}
      onPanel={(el) => writeMorphStart(untrack(level.menu.trigger), el)}
      {...props}
    />
  );
};

function DropdownMenuItem<T extends ValidComponent = "div">(props: MenuItemProps<T>): JSX.Element {
  return (
    <MenuItemPart slotName="dropdown-menu-item" {...(props as MenuItemProps<ValidComponent>)} />
  );
}

function DropdownMenuSubTrigger<T extends ValidComponent = "div">(
  props: MenuSubTriggerProps<T>,
): JSX.Element {
  return (
    <MenuSubTriggerPart
      slotName="dropdown-menu-sub-trigger"
      {...(props as MenuSubTriggerProps<ValidComponent>)}
    />
  );
}

const DropdownMenuSubContent: Component<MenuContentProps> = (props) => (
  <MenuSubContentPart slotName="dropdown-menu-sub-content" {...props} />
);

function DropdownMenuCheckboxItem<T extends ValidComponent = "div">(
  props: MenuCheckboxItemProps<T>,
): JSX.Element {
  return (
    <MenuCheckboxItemPart
      slotName="dropdown-menu-checkbox-item"
      {...(props as MenuCheckboxItemProps<ValidComponent>)}
    />
  );
}

function DropdownMenuRadioItem<T extends ValidComponent = "div">(
  props: MenuRadioItemProps<T>,
): JSX.Element {
  return (
    <MenuRadioItemPart
      slotName="dropdown-menu-radio-item"
      {...(props as MenuRadioItemProps<ValidComponent>)}
    />
  );
}

const DropdownMenuSeparator: Component<ComponentProps<"hr">> = (props) => (
  <MenuSeparatorPart slotName="dropdown-menu-separator" {...props} />
);

const DropdownMenuLabel: Component<MenuLabelProps> = (props) => (
  <MenuLabelPart slotName="dropdown-menu-label" {...props} />
);

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

const DropdownMenuGroup = MenuGroup;
const DropdownMenuSub = MenuSub;
const DropdownMenuRadioGroup = MenuRadioGroup;

const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Root: DropdownMenuRoot,
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  CheckboxItem: DropdownMenuCheckboxItem,
  RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem,
  Group: DropdownMenuGroup,
  GroupLabel: DropdownMenuLabel,
  Separator: DropdownMenuSeparator,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
  ItemIndicator: MenuItemIndicator,
});

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
