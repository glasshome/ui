import {
  type Accessor,
  type Component,
  type ComponentProps,
  createContext,
  createSignal,
  createUniqueId,
  type JSX,
  onCleanup,
  type ParentComponent,
  Show,
  splitProps,
  untrack,
  useContext,
  type ValidComponent,
} from "solid-js";
import { Portal } from "solid-js/web";
import type { Align, Side } from "../lib/anchor-placement.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { createMenu, type Menu, type MenuOptions } from "../lib/behavior/menu.js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { createPresence } from "../lib/behavior/presence.js";
import { effect, merge } from "../lib/behavior/solid.js";
import { glassToneText } from "../lib/glass-tone.js";
import {
  MENU_ITEM,
  MENU_ITEM_BASE,
  MENU_ITEM_RADIUS,
  MENU_LABEL,
  MENU_SEPARATOR,
} from "../lib/menu-classes.js";
import { STAGGER } from "../lib/motion-classes.js";
import { FLOATING_PANEL } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { usePortalMount } from "./portal-mount.js";
import { SelectionHighlight, SelectionScope } from "./selection.js";

/* The panel without its motion: DropdownMenu morphs out of its trigger,
 * ContextMenu unfolds from the pointer. */
const MENU_CONTENT_CLASS = cn(FLOATING_PANEL, "min-w-[8rem] overflow-hidden p-1");

/** Every menu content and sub content wraps its rows in one selection scope, keyed off the highlighted row. */
const MenuContentIndicator: ParentComponent = (props) => (
  // The one element between role="menu" and its rows: an unnamed div there breaks the menu's ownership in the a11y tree.
  <SelectionScope role="none" class={STAGGER} marker="highlighted" radius={MENU_ITEM_RADIUS}>
    {props.children}
  </SelectionScope>
);

export type MenuPlacement = Side | `${Side}-${Exclude<Align, "center">}`;

export function parsePlacement(placement: MenuPlacement): [Side, Align] {
  const [side, align] = placement.split("-") as [Side, Align?];
  return [side, align ?? "center"];
}

/** One open level of a menu tree: the root menu or a submenu, with the ids its trigger and panel name each other by. */
export interface MenuLevel {
  menu: Menu;
  parent: MenuLevel | undefined;
  triggerId: Accessor<string | undefined>;
  setTriggerId: (id: string | undefined) => void;
  contentId: Accessor<string | undefined>;
  setContentId: (id: string | undefined) => void;
}

const MenuLevelContext = createContext<MenuLevel>();

export const MenuLevelProvider = MenuLevelContext.Provider;

export function useMenuLevel(): MenuLevel {
  const level = useContext(MenuLevelContext);
  if (!level) throw new Error("Menu parts render inside a DropdownMenu or a ContextMenu");
  return level;
}

export function createMenuLevel(options: MenuOptions, parent?: MenuLevel): MenuLevel {
  const menu = createMenu(parent ? merge(options, { parent: parent.menu }) : options);
  const [triggerId, setTriggerId] = createSignal<string>();
  const [contentId, setContentId] = createSignal<string>();
  return { menu, parent, triggerId, setTriggerId, contentId, setContentId };
}

/** @deprecated Ignored options; removed in 2.0.0. */
export interface DeprecatedMenuRootProps {
  /** @deprecated Ignored; removed in 2.0.0. */
  modal?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  preventScroll?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  id?: string;
  /** @deprecated Ignored; removed in 2.0.0. */
  forceMount?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  orientation?: "horizontal" | "vertical";
  /** @deprecated Ignored; removed in 2.0.0. */
  value?: string;
  /** @deprecated Ignored; removed in 2.0.0. */
  shift?: number;
  /** @deprecated Ignored; removed in 2.0.0. */
  flip?: boolean | string;
  /** @deprecated Ignored; removed in 2.0.0. */
  slide?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  overlap?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  sameWidth?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  fitViewport?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  hideWhenDetached?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  detachedPadding?: number;
  /** @deprecated Ignored; removed in 2.0.0. */
  arrowPadding?: number;
  /** @deprecated Ignored; removed in 2.0.0. */
  overflowPadding?: number;
}

/** @deprecated Ignored callbacks; removed in 2.0.0. */
export interface DeprecatedMenuContentProps {
  /** @deprecated Ignored; removed in 2.0.0. */
  forceMount?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  onOpenAutoFocus?: (event: Event) => void;
  /** @deprecated Ignored; removed in 2.0.0. */
  onCloseAutoFocus?: (event: Event) => void;
  /** @deprecated Ignored; removed in 2.0.0. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** @deprecated Ignored; removed in 2.0.0. */
  onPointerDownOutside?: (event: Event) => void;
  /** @deprecated Ignored; removed in 2.0.0. */
  onFocusOutside?: (event: Event) => void;
  /** @deprecated Ignored; removed in 2.0.0. */
  onInteractOutside?: (event: Event) => void;
}

const DEPRECATED_CONTENT_PROPS = [
  "forceMount",
  "onOpenAutoFocus",
  "onCloseAutoFocus",
  "onEscapeKeyDown",
  "onPointerDownOutside",
  "onFocusOutside",
  "onInteractOutside",
] as const;

export type MenuContentProps = Omit<ComponentProps<"div">, "role"> & DeprecatedMenuContentProps;

type MenuContentPartProps = MenuContentProps & {
  slotName: string;
  motionClass?: string;
  exitMs: number;
  onPanel?: (el: HTMLElement) => void;
};

export const MenuContentPart: Component<MenuContentPartProps> = (props) => {
  const level = useMenuLevel();
  const menu = level.menu;
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "ref",
    "id",
    "slotName",
    "motionClass",
    "exitMs",
    "onPanel",
    ...DEPRECATED_CONTENT_PROPS,
  ]);
  const fallback = createUniqueId();
  const id = (): string => local.id ?? fallback;
  effect(id, (value) => {
    level.setContentId(value);
    return () => level.setContentId(undefined);
  });
  const presence = createPresence({
    present: menu.open,
    element: menu.content,
    exitMs: untrack(() => local.exitMs),
  });

  const Panel: Component = () => {
    onCleanup(() => menu.setContent(undefined));
    return (
      <div
        {...rest}
        ref={(el) => {
          menu.setContent(el);
          local.onPanel?.(el);
          if (typeof local.ref === "function") local.ref(el);
        }}
        id={id()}
        role="menu"
        tabIndex={-1}
        aria-labelledby={level.triggerId()}
        data-orientation="horizontal"
        data-expanded={menu.open() ? "" : undefined}
        data-closed={menu.open() ? undefined : ""}
        data-slot={local.slotName}
        class={cn(MENU_CONTENT_CLASS, local.motionClass, local.class)}
      >
        <MenuContentIndicator>{local.children}</MenuContentIndicator>
      </div>
    );
  };

  return (
    <Show when={presence.mounted()}>
      <Portal mount={usePortalMount()}>
        <Panel />
      </Portal>
    </Show>
  );
};

export interface MenuSubProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  gutter?: number;
  children?: JSX.Element;
  /** @deprecated Ignored; removed in 2.0.0. */
  shift?: number;
  /** @deprecated Ignored; removed in 2.0.0. */
  slide?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  overlap?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  fitViewport?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  hideWhenDetached?: boolean;
  /** @deprecated Ignored; removed in 2.0.0. */
  detachedPadding?: number;
  /** @deprecated Ignored; removed in 2.0.0. */
  arrowPadding?: number;
  /** @deprecated Ignored; removed in 2.0.0. */
  overflowPadding?: number;
  /** @deprecated Ignored; removed in 2.0.0. */
  getAnchorRect?: (anchor?: HTMLElement) => unknown;
}

export const MenuSub: Component<MenuSubProps> = (props) => {
  const parent = useMenuLevel();
  const [open, setOpen] = createControllableSignal<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (next) => props.onOpenChange?.(next),
  });
  const level = createMenuLevel(
    { open, onOpenChange: setOpen, offset: untrack(() => props.gutter ?? 0) },
    parent,
  );
  return <MenuLevelProvider value={level}>{props.children}</MenuLevelProvider>;
};

type ToneProps = {
  tone?: string;
  /** @deprecated `tone="var(--destructive)"`; removed in 2.0.0. */
  variant?: "default" | "destructive";
};

function resolveTone(local: ToneProps): string | undefined {
  return local.tone ?? (local.variant === "destructive" ? "var(--destructive)" : undefined);
}

function toneStyle(tone: string | undefined) {
  return tone ? { "--selection-tone": tone, color: glassToneText(tone) } : undefined;
}

/* True order among the menu's rows, labels and separators, for the stagger:
 * nth-child restarts inside a group, the DOM order does not. Refs fire before
 * insertion, hence the microtask. */
function writeRowIndex(el: HTMLElement) {
  queueMicrotask(() => {
    const menu = el.closest('[role="menu"], [role="listbox"]');
    if (!menu) return;
    const i = Array.from(menu.querySelectorAll("[data-stagger-row]")).indexOf(el);
    if (i >= 0) el.style.setProperty("--i", String(i));
  });
}

interface RowOwnProps {
  disabled?: boolean;
  closeOnSelect?: boolean;
  onSelect?: () => void;
  /** @deprecated Ignored; removed in 2.0.0. */
  textValue?: string;
}

/** A menu row's props over the element or component it renders `as`, a link for one. */
export type MenuRowProps<T extends ValidComponent = "div", Own = RowOwnProps> = Own & {
  as?: T;
} & Omit<ComponentProps<T>, "as" | keyof Own>;

type RowKind = "item" | "checkbox" | "radio" | "sub";

const ROLE: Record<RowKind, string> = {
  item: "menuitem",
  checkbox: "menuitemcheckbox",
  radio: "menuitemradio",
  sub: "menuitem",
};

interface RowState {
  checked: Accessor<boolean>;
  indeterminate: Accessor<boolean>;
}

const RowContext = createContext<RowState>();

type MenuRowPartProps = RowOwnProps &
  ToneProps & {
    kind: RowKind;
    slotName: string;
    inset?: boolean;
    as?: ValidComponent;
    id?: string;
    ref?: unknown;
    class?: string;
    style?: JSX.CSSProperties;
    children?: JSX.Element;
    checked?: boolean;
    indeterminate?: boolean;
    choose?: () => void;
  };

type RowInput = Omit<MenuRowPartProps, "kind">;

function MenuRow(props: MenuRowPartProps): JSX.Element {
  const here = useMenuLevel();
  const kind = untrack(() => props.kind);
  const owner = kind === "sub" ? here.parent : here;
  if (!owner) throw new Error("A sub trigger renders inside a Sub");
  const submenu = kind === "sub" ? here : undefined;
  const menu = owner.menu;
  const [local, rest] = splitProps(props, [
    "kind",
    "slotName",
    "inset",
    "tone",
    "variant",
    "as",
    "id",
    "ref",
    "class",
    "style",
    "children",
    "disabled",
    "closeOnSelect",
    "onSelect",
    "textValue",
    "checked",
    "indeterminate",
    "choose",
  ]);
  const key = untrack(() => local.id) ?? createUniqueId();
  const disabled = () => local.disabled ?? false;
  const checked = () => local.checked ?? false;
  const indeterminate = () => local.indeterminate ?? false;
  const checkable = kind === "checkbox" || kind === "radio";
  const tone = () => resolveTone(local);

  menu.register(key, {
    disabled,
    closeOnSelect: () => local.closeOnSelect ?? kind === "item",
    onSelect: () => {
      local.onSelect?.();
      local.choose?.();
    },
    submenu: submenu?.menu,
  });
  if (submenu) {
    submenu.setTriggerId(key);
    onCleanup(() => {
      submenu.menu.setTrigger(undefined);
      submenu.setTriggerId(undefined);
    });
  }

  const subOpen = () => submenu?.menu.open() ?? false;
  const inner = (
    <RowContext.Provider value={{ checked, indeterminate }}>
      <SelectionHighlight active={menu.highlighted() === key} />
      {local.children}
    </RowContext.Provider>
  );
  return (
    <Polymorphic
      {...merge(rest, {
        as: local.as,
        defaultAs: "div" as ValidComponent,
        ref: (el: HTMLElement) => {
          writeRowIndex(el);
          submenu?.menu.setTrigger(el);
          if (typeof local.ref === "function") local.ref(el);
        },
        id: key,
        "data-key": key,
        role: ROLE[kind],
        get tabIndex() {
          return menu.tabIndex(key);
        },
        get "aria-checked"() {
          if (!checkable) return undefined;
          return indeterminate() ? "mixed" : checked() ? "true" : "false";
        },
        get "aria-disabled"() {
          return disabled() ? "true" : undefined;
        },
        "aria-haspopup": submenu ? "true" : undefined,
        get "aria-expanded"() {
          return submenu ? subOpen() : undefined;
        },
        get "aria-controls"() {
          return subOpen() ? submenu?.contentId() : undefined;
        },
        get "data-expanded"() {
          return subOpen() ? "" : undefined;
        },
        get "data-closed"() {
          return submenu && !subOpen() ? "" : undefined;
        },
        get "data-highlighted"() {
          return menu.highlighted() === key ? "" : undefined;
        },
        get "data-disabled"() {
          return disabled() ? "" : undefined;
        },
        get "data-checked"() {
          return checkable && checked() ? "" : undefined;
        },
        get "data-indeterminate"() {
          return indeterminate() ? "" : undefined;
        },
        "data-stagger-row": "",
        get "data-slot"() {
          return local.slotName;
        },
        get "data-inset"() {
          return local.inset;
        },
        get "data-tone"() {
          return tone() ? "" : undefined;
        },
        get class() {
          return cn(
            checkable ? cn(MENU_ITEM_BASE, "py-1.5 pr-2 pl-8") : MENU_ITEM,
            local.inset && "pl-8",
            local.class,
          );
        },
        get style() {
          return { ...toneStyle(tone()), ...local.style };
        },
        children: inner,
      })}
    />
  );
}

export interface ItemIndicatorProps {
  forceMount?: boolean;
  class?: string;
  children?: JSX.Element;
}

/** Shows its children while the row around it is checked. */
export const MenuItemIndicator: Component<ItemIndicatorProps> = (props) => {
  const row = useContext(RowContext);
  const [local, rest] = splitProps(props, ["forceMount"]);
  const on = () => local.forceMount || row?.checked() || row?.indeterminate();
  return (
    <Show when={on()}>
      <div
        {...rest}
        data-checked={row?.checked() ? "" : undefined}
        data-indeterminate={row?.indeterminate() ? "" : undefined}
      />
    </Show>
  );
};

type ItemOwnProps = RowOwnProps & ToneProps & { inset?: boolean };

export type MenuItemProps<T extends ValidComponent = "div"> = MenuRowProps<T, ItemOwnProps>;

export function MenuItemPart(props: MenuItemProps<ValidComponent> & { slotName: string }) {
  return <MenuRow kind="item" {...(props as RowInput)} />;
}

type LabelOwnProps = { inset?: boolean; as?: ValidComponent };

export type MenuLabelProps = LabelOwnProps & Omit<ComponentProps<"span">, "as">;

const GroupContext = createContext<(id: string | undefined) => void>();

export const MenuLabelPart: Component<MenuLabelProps & { slotName: string }> = (props) => {
  const register = useContext(GroupContext);
  const [local, rest] = splitProps(props, ["class", "inset", "slotName", "id", "as", "ref"]);
  const fallback = createUniqueId();
  const id = (): string => local.id ?? fallback;
  effect(id, (value) => {
    register?.(value);
    return () => register?.(undefined);
  });
  return (
    <Polymorphic
      {...merge(rest, {
        as: local.as,
        defaultAs: "span" as ValidComponent,
        ref: (el: HTMLElement) => {
          writeRowIndex(el);
          if (typeof local.ref === "function") local.ref(el);
        },
        get id() {
          return id();
        },
        "aria-hidden": "true",
        "data-stagger-row": "",
        get "data-slot"() {
          return local.slotName;
        },
        get "data-inset"() {
          return local.inset;
        },
        get class() {
          return cn(MENU_LABEL, local.inset && "pl-8", local.class);
        },
      })}
    />
  );
};

export type MenuGroupProps = { as?: ValidComponent } & Omit<ComponentProps<"div">, "as">;

export const MenuGroup: Component<MenuGroupProps> = (props) => {
  const [local, rest] = splitProps(props, ["as", "id"]);
  const [labelId, setLabelId] = createSignal<string>();
  const fallback = createUniqueId();
  return (
    <GroupContext.Provider value={setLabelId}>
      <Polymorphic
        {...merge(rest, {
          as: local.as,
          defaultAs: "div" as ValidComponent,
          get id() {
            return local.id ?? fallback;
          },
          role: "group",
          get "aria-labelledby"() {
            return labelId();
          },
        })}
      />
    </GroupContext.Provider>
  );
};

interface RadioState {
  value: Accessor<string | undefined>;
  setValue: (value: string) => void;
  disabled: Accessor<boolean>;
}

const RadioContext = createContext<RadioState>();

export type MenuRadioGroupProps = Omit<MenuGroupProps, "onChange"> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export const MenuRadioGroup: Component<MenuRadioGroupProps> = (props) => {
  const [local, rest] = splitProps(props, ["value", "defaultValue", "onChange", "disabled"]);
  const [value, setValue] = createControllableSignal<string | undefined>({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: (next) => {
      if (next !== undefined) local.onChange?.(next);
    },
  });
  const state: RadioState = { value, setValue, disabled: () => local.disabled ?? false };
  return (
    <RadioContext.Provider value={state}>
      <MenuGroup {...rest} />
    </RadioContext.Provider>
  );
};

type MenuSeparatorProps = ComponentProps<"hr"> & { slotName: string };

export const MenuSeparatorPart: Component<MenuSeparatorProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "slotName", "ref"]);
  return (
    <hr
      {...rest}
      ref={(el) => {
        writeRowIndex(el);
        if (typeof local.ref === "function") local.ref(el);
      }}
      data-orientation="horizontal"
      data-stagger-row=""
      data-slot={local.slotName}
      class={cn(MENU_SEPARATOR, local.class)}
    />
  );
};

type SubTriggerOwnProps = Omit<RowOwnProps, "closeOnSelect" | "onSelect"> & { inset?: boolean };

export type MenuSubTriggerProps<T extends ValidComponent = "div"> = MenuRowProps<
  T,
  SubTriggerOwnProps
>;

export function MenuSubTriggerPart(
  props: MenuSubTriggerProps<ValidComponent> & { slotName: string },
) {
  const [local, rest] = splitProps(props as RowInput, ["children"]);
  return (
    <MenuRow kind="sub" {...rest}>
      {local.children}
      <Icon icon="lucide:chevron-right" width={16} height={16} class="ml-auto" />
    </MenuRow>
  );
}

export const MenuSubContentPart: Component<MenuContentProps & { slotName: string }> = (props) => (
  <MenuContentPart exitMs={0} {...props} />
);

type CheckboxOwnProps = Omit<RowOwnProps, "closeOnSelect"> & {
  closeOnSelect?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  indeterminate?: boolean;
};

export type MenuCheckboxItemProps<T extends ValidComponent = "div"> = MenuRowProps<
  T,
  CheckboxOwnProps
>;

export function MenuCheckboxItemPart(
  props: MenuCheckboxItemProps<ValidComponent> & { slotName: string },
) {
  const [local, rest] = splitProps(props as RowInput & CheckboxOwnProps, [
    "children",
    "checked",
    "defaultChecked",
    "onChange",
  ]);
  const [checked, setChecked] = createControllableSignal<boolean>({
    value: () => local.checked,
    defaultValue: () => local.defaultChecked ?? false,
    onChange: (next) => local.onChange?.(next),
  });
  return (
    <MenuRow
      kind="checkbox"
      {...rest}
      checked={checked()}
      choose={() => setChecked(!untrack(checked))}
    >
      <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuItemIndicator>
          <Icon icon="lucide:check" width={16} height={16} class="size-4" />
        </MenuItemIndicator>
      </span>
      {local.children}
    </MenuRow>
  );
}

type RadioOwnProps = Omit<RowOwnProps, "closeOnSelect"> & {
  closeOnSelect?: boolean;
  value: string;
};

export type MenuRadioItemProps<T extends ValidComponent = "div"> = MenuRowProps<T, RadioOwnProps>;

export function MenuRadioItemPart(
  props: MenuRadioItemProps<ValidComponent> & { slotName: string },
) {
  const group = useContext(RadioContext);
  const [local, rest] = splitProps(props as RowInput & RadioOwnProps, [
    "children",
    "value",
    "disabled",
  ]);
  return (
    <MenuRow
      kind="radio"
      {...rest}
      disabled={local.disabled || group?.disabled()}
      checked={group?.value() === local.value}
      choose={() => group?.setValue(local.value)}
    >
      <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuItemIndicator>
          {/* mdi:circle is filled; lucide:circle is stroke-only and invisible at 8px. */}
          <Icon icon="mdi:circle" width={8} height={8} class="size-2" />
        </MenuItemIndicator>
      </span>
      {local.children}
    </MenuRow>
  );
}

/** @deprecated Drop the wrapper; the content portals itself; removed in 2.0.0. */
export const MenuPortal: Component<{ children?: JSX.Element; mount?: Node }> = (props) => (
  <>{props.children}</>
);

/** @deprecated Ignored; removed in 2.0.0. */
export const MenuArrow: Component = () => null;

/** @deprecated Use a plain `span`; removed in 2.0.0. */
export const MenuTextPart: Component<ComponentProps<"span">> = (props) => <span {...props} />;
