import {
  type Component,
  type ComponentProps,
  createContext,
  createSignal,
  createUniqueId,
  type JSX,
  onCleanup,
  splitProps,
  untrack,
  useContext,
  type ValidComponent,
} from "solid-js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { callEventHandler, effect, merge } from "../lib/behavior/solid.js";
import { createHold } from "../lib/hold.js";
import { MOTION_EXIT_MS, OVERLAY_MOTION } from "../lib/motion-classes.js";
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

interface ContextMenuRootProps {
  onOpenChange?: (open: boolean) => void;
  placement?: MenuPlacement;
  gutter?: number;
  children?: JSX.Element;
}

type Point = { x: number; y: number };

const PointContext = createContext<(point: Point) => void>();

const usePoint = (): ((point: Point) => void) => {
  const setPoint = useContext(PointContext);
  if (!setPoint) throw new Error("ContextMenuTrigger renders inside a ContextMenu");
  return setPoint;
};

const ContextMenuRoot: Component<ContextMenuRootProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const setOpen = (next: boolean) => {
    if (next === untrack(isOpen)) return;
    setIsOpen(next);
    props.onOpenChange?.(next);
  };
  const [point, setPoint] = createSignal<Point>({ x: 0, y: 0 });
  const placement = () => parsePlacement(props.placement ?? "right-start");
  const level = createMenuLevel({
    open: isOpen,
    onOpenChange: setOpen,
    anchor: (trigger) => {
      const at = point();
      return {
        getBoundingClientRect: () => ({ left: at.x, top: at.y, width: 0, height: 0 }),
        getRootNode: () => trigger?.getRootNode() ?? document,
      };
    },
    side: () => placement()[0],
    align: () => placement()[1],
    offset: untrack(() => props.gutter ?? 2),
    triggerIsArea: true,
  });
  return (
    <PointContext.Provider value={setPoint}>
      <MenuLevelProvider value={level}>{props.children}</MenuLevelProvider>
    </PointContext.Provider>
  );
};

type TriggerOwnProps = {
  disabled?: boolean;
  id?: string;
  ref?: unknown;
  style?: JSX.CSSProperties | string;
  onContextMenu?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>;
  onPointerDown?: JSX.EventHandlerUnion<HTMLElement, PointerEvent>;
  onPointerMove?: JSX.EventHandlerUnion<HTMLElement, PointerEvent>;
  onPointerUp?: JSX.EventHandlerUnion<HTMLElement, PointerEvent>;
  onPointerCancel?: JSX.EventHandlerUnion<HTMLElement, PointerEvent>;
};

type ContextMenuTriggerProps<T extends ValidComponent = "div"> = TriggerOwnProps & {
  as?: T;
} & Omit<ComponentProps<T>, "as" | keyof TriggerOwnProps>;

type Bound<E extends Event> = E & { currentTarget: HTMLElement; target: Element };

const NO_CALLOUT = "-webkit-touch-callout: none";
const MENU_CLAIM = "prevent:contextmenu stop:contextmenu";

function ContextMenuTrigger<T extends ValidComponent = "div">(
  props: ContextMenuTriggerProps<T>,
): JSX.Element {
  const level = useMenuLevel();
  const menu = level.menu;
  const setPoint = usePoint();
  const [local, rest] = splitProps(props as ContextMenuTriggerProps<ValidComponent>, [
    "as",
    "id",
    "ref",
    "disabled",
    "style",
    "onContextMenu",
    "onPointerDown",
    "onPointerMove",
    "onPointerUp",
    "onPointerCancel",
  ]);
  const fallback = createUniqueId();
  const id = (): string => local.id ?? fallback;
  effect(id, (value) => {
    level.setTriggerId(value);
    return () => level.setTriggerId(undefined);
  });
  const disabled = () => local.disabled ?? false;
  const openAt = (point: Point) => {
    setPoint(point);
    menu.show("content");
  };
  let pressedAt: Point = { x: 0, y: 0 };
  const hold = createHold({ onHold: () => openAt(pressedAt) });
  onCleanup(hold.cancel);
  const [el, setEl] = createSignal<HTMLElement>();

  // Bound on the element, since Solid's delegated handlers never reach inside a closed shadow root.
  effect(el, (node) => {
    if (!node) return;
    const onMenu = (event: MouseEvent) => {
      callEventHandler(event as Bound<MouseEvent>, local.onContextMenu);
      // A fired hold already opened the menu and spent this press.
      if (disabled() || event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      openAt({ x: event.clientX, y: event.clientY });
    };
    const onDown = (event: PointerEvent) => {
      callEventHandler(event as Bound<PointerEvent>, local.onPointerDown);
      if (disabled() || event.pointerType === "mouse") return;
      pressedAt = { x: event.clientX, y: event.clientY };
      hold.down(event);
    };
    const onMove = (event: PointerEvent) => {
      callEventHandler(event as Bound<PointerEvent>, local.onPointerMove);
      hold.move(event);
    };
    const onUp = (event: PointerEvent) => {
      callEventHandler(event as Bound<PointerEvent>, local.onPointerUp);
      hold.up();
    };
    const onCancel = (event: PointerEvent) => {
      callEventHandler(event as Bound<PointerEvent>, local.onPointerCancel);
      hold.cancel();
    };
    node.addEventListener("contextmenu", onMenu);
    node.addEventListener("pointerdown", onDown);
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerup", onUp);
    node.addEventListener("pointercancel", onCancel);
    return () => {
      node.removeEventListener("contextmenu", onMenu);
      node.removeEventListener("pointerdown", onDown);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerup", onUp);
      node.removeEventListener("pointercancel", onCancel);
      if (untrack(menu.trigger) === node) menu.setTrigger(undefined);
    };
  });

  return (
    <Polymorphic
      {...merge({ "data-slot": "context-menu-trigger" }, rest, {
        as: local.as,
        defaultAs: "div" as ValidComponent,
        get id() {
          return id();
        },
        ref: (node: HTMLElement) => {
          setEl(node);
          menu.setTrigger(node);
          if (typeof local.ref === "function") local.ref(node);
        },
        get style() {
          const own = local.style;
          return typeof own === "string"
            ? `${NO_CALLOUT}; ${own}`
            : { "-webkit-touch-callout": "none", ...own };
        },
        get "data-claim"() {
          if (disabled()) return undefined;
          return [MENU_CLAIM, hold.claim()].filter(Boolean).join(" ");
        },
        get "data-disabled"() {
          return disabled() ? "" : undefined;
        },
        get "data-expanded"() {
          return menu.open() ? "" : undefined;
        },
        get "data-closed"() {
          return menu.open() ? undefined : "";
        },
      })}
    />
  );
}

// The panel opens at the pointer with its start corner there, so it unfolds from that corner.
const ORIGIN_AT_POINTER =
  "data-[side=right]:origin-top-left data-[side=left]:origin-top-right data-[side=bottom]:origin-top-left data-[side=top]:origin-bottom-left";

const ContextMenuContent: Component<MenuContentProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <MenuContentPart
      slotName="context-menu-content"
      motionClass={cn(OVERLAY_MOTION, ORIGIN_AT_POINTER, "overflow-x-hidden overflow-y-auto")}
      exitMs={MOTION_EXIT_MS.overlay}
      class={local.class}
      {...rest}
    />
  );
};

function ContextMenuItem<T extends ValidComponent = "div">(props: MenuItemProps<T>): JSX.Element {
  return (
    <MenuItemPart slotName="context-menu-item" {...(props as MenuItemProps<ValidComponent>)} />
  );
}

function ContextMenuSubTrigger<T extends ValidComponent = "div">(
  props: MenuSubTriggerProps<T>,
): JSX.Element {
  return (
    <MenuSubTriggerPart
      slotName="context-menu-sub-trigger"
      {...(props as MenuSubTriggerProps<ValidComponent>)}
    />
  );
}

const ContextMenuSubContent: Component<MenuContentProps> = (props) => (
  <MenuSubContentPart slotName="context-menu-sub-content" {...props} />
);

function ContextMenuCheckboxItem<T extends ValidComponent = "div">(
  props: MenuCheckboxItemProps<T>,
): JSX.Element {
  return (
    <MenuCheckboxItemPart
      slotName="context-menu-checkbox-item"
      {...(props as MenuCheckboxItemProps<ValidComponent>)}
    />
  );
}

function ContextMenuRadioItem<T extends ValidComponent = "div">(
  props: MenuRadioItemProps<T>,
): JSX.Element {
  return (
    <MenuRadioItemPart
      slotName="context-menu-radio-item"
      {...(props as MenuRadioItemProps<ValidComponent>)}
    />
  );
}

const ContextMenuLabel: Component<MenuLabelProps> = (props) => (
  <MenuLabelPart slotName="context-menu-label" {...props} />
);

const ContextMenuSeparator: Component<ComponentProps<"hr">> = (props) => (
  <MenuSeparatorPart slotName="context-menu-separator" {...props} />
);

const ContextMenuShortcut: Component<ComponentProps<"span">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <span
      data-slot="context-menu-shortcut"
      class={cn("text-muted-foreground ml-auto text-xs tracking-widest", local.class)}
      {...rest}
    />
  );
};

const ContextMenuGroup = MenuGroup;
const ContextMenuSub = MenuSub;
const ContextMenuRadioGroup = MenuRadioGroup;

const ContextMenu = Object.assign(ContextMenuRoot, {
  Root: ContextMenuRoot,
  Trigger: ContextMenuTrigger,
  Content: ContextMenuContent,
  Item: ContextMenuItem,
  CheckboxItem: ContextMenuCheckboxItem,
  RadioGroup: ContextMenuRadioGroup,
  RadioItem: ContextMenuRadioItem,
  Group: ContextMenuGroup,
  GroupLabel: ContextMenuLabel,
  Separator: ContextMenuSeparator,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
  ItemIndicator: MenuItemIndicator,
});

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};
