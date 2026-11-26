import {
  type Accessor,
  type Component,
  createContext,
  createSignal,
  createUniqueId,
  onCleanup,
  type ParentComponent,
  Show,
  omit,
  untrack,
  useContext,
  createEffect,
  merge,
} from "solid-js";
import { type ComponentProps, type JSX, type ValidComponent } from "@solidjs/web";
import { Layer } from "../lib/behavior/layer.js";
import type { Align, Side } from "../lib/anchor-placement.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { createMenu, type Menu, type MenuOptions, rowClaim } from "../lib/behavior/menu.js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { createPresence } from "../lib/behavior/presence.js";
import { glassToneText } from "../lib/glass-tone.js";
import {
  MENU_ITEM,
  MENU_ITEM_BASE,
  MENU_ITEM_RADIUS,
  MENU_LABEL,
  MENU_SEPARATOR,
} from "../lib/menu-classes.js";
import { FLOATING_PANEL } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { usePortalMount } from "./portal-mount.js";
import { useRequired } from "../lib/context.js";
import { SelectionHighlight, SelectionScope } from "./selection.js";

/* The panel without its motion: DropdownMenu morphs out of its trigger,
 * ContextMenu unfolds from the pointer. */
const MENU_CONTENT_CLASS = cn(FLOATING_PANEL, "min-w-[8rem] overflow-hidden p-1");

/** Every menu content and sub content wraps its rows in one selection scope, keyed off the highlighted row. */
const MenuContentIndicator: ParentComponent = (props) => (
  // The one element between role="menu" and its rows: an unnamed div there breaks the menu's ownership in the a11y tree.
  <SelectionScope role="none" marker="highlighted" radius={MENU_ITEM_RADIUS}>
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

export const MenuLevelProvider = MenuLevelContext;

export function useMenuLevel(): MenuLevel {
  return useRequired(MenuLevelContext, "Menu parts", ["DropdownMenu", "ContextMenu"]);
}

export function createMenuLevel(options: MenuOptions, parent?: MenuLevel): MenuLevel {
  const menu = createMenu(parent ? merge(options, { parent: parent.menu }) : options);
  const [triggerId, setTriggerId] = createSignal<string>();
  const [contentId, setContentId] = createSignal<string>();
  return { menu, parent, triggerId, setTriggerId, contentId, setContentId };
}

export type MenuContentProps = Omit<ComponentProps<"div">, "role">;

type MenuContentPartProps = MenuContentProps & {
  slotName: string;
  motionClass?: string;
  exitMs: number;
  onPanel?: (el: HTMLElement) => void;
};

export const MenuContentPart: Component<MenuContentPartProps> = (props) => {
  const level = useMenuLevel();
  const menu = level.menu;
  const rest = omit(
    props,
    "class",
    "children",
    "ref",
    "id",
    "slotName",
    "motionClass",
    "exitMs",
    "onPanel",
  );
  const fallback = createUniqueId();
  const id = (): string => props.id || fallback;
  createEffect(id, (value) => {
    level.setContentId(value);
    return () => level.setContentId(undefined);
  });
  const presence = createPresence({
    present: menu.open,
    element: menu.content,
    exitMs: untrack(() => props.exitMs),
  });

  const portalMount = usePortalMount();
  const Panel: Component = () => {
    onCleanup(() => menu.setContent(undefined));
    return (
      <div
        {...rest}
        ref={(el) => {
          menu.setContent(el);
          props.onPanel?.(el);
          if (typeof props.ref === "function") props.ref(el);
        }}
        id={id()}
        role="menu"
        tabindex={-1}
        aria-labelledby={level.triggerId()}
        data-orientation="horizontal"
        data-expanded={menu.open() ? "" : undefined}
        data-closed={menu.open() ? undefined : ""}
        data-slot={props.slotName}
        class={cn(MENU_CONTENT_CLASS, props.motionClass, props.class)}
      >
        <MenuContentIndicator>{props.children}</MenuContentIndicator>
      </div>
    );
  };

  return (
    <Show when={presence.mounted()}>
      <Layer mount={portalMount}>
        <Panel />
      </Layer>
    </Show>
  );
};

export interface MenuSubProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  gutter?: number;
  children?: JSX.Element;
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
};

function toneStyle(tone: string | undefined) {
  return tone ? { "--selection-tone": tone, color: glassToneText(tone) } : undefined;
}

interface RowOwnProps {
  disabled?: boolean;
  closeOnSelect?: boolean;
  onSelect?: () => void;
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

const RowContext = createContext<RowState | null>(null);

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
  const rest = omit(
    props,
    "kind",
    "slotName",
    "inset",
    "tone",
    "as",
    "id",
    "ref",
    "class",
    "style",
    "children",
    "disabled",
    "closeOnSelect",
    "onSelect",
    "checked",
    "indeterminate",
    "choose",
  );
  const key = untrack(() => props.id) ?? createUniqueId();
  const disabled = () => props.disabled ?? false;
  const checked = () => props.checked ?? false;
  const indeterminate = () => props.indeterminate ?? false;
  const checkable = kind === "checkbox" || kind === "radio";
  const tone = () => props.tone;

  menu.register(key, {
    disabled,
    closeOnSelect: () => props.closeOnSelect ?? kind === "item",
    onSelect: () => {
      props.onSelect?.();
      props.choose?.();
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
  const [row, setRow] = createSignal<HTMLElement>();
  const inner = (
    <RowContext value={{ checked, indeterminate }}>
      <SelectionHighlight active={menu.highlighted() === key} />
      {props.children}
    </RowContext>
  );
  return (
    <Polymorphic
      {...merge(rest, {
        as: props.as,
        defaultAs: "div" as ValidComponent,
        ref: (el: HTMLElement) => {
          setRow(el);
          submenu?.menu.setTrigger(el);
          if (typeof props.ref === "function") props.ref(el);
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
          return submenu ? (subOpen() ? "true" : "false") : undefined;
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
        get "data-claim"() {
          return disabled() ? undefined : rowClaim(menu, row(), !!submenu);
        },
        get "data-checked"() {
          return checkable && checked() ? "" : undefined;
        },
        get "data-indeterminate"() {
          return indeterminate() ? "" : undefined;
        },
        get "data-slot"() {
          return props.slotName;
        },
        get "data-inset"() {
          return props.inset;
        },
        get "data-tone"() {
          return tone() ? "" : undefined;
        },
        get class() {
          return cn(
            checkable ? cn(MENU_ITEM_BASE, "py-1.5 pr-2 pl-8") : MENU_ITEM,
            props.inset && "pl-8",
            props.class,
          );
        },
        get style() {
          return { ...toneStyle(tone()), ...props.style };
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
  const rest = omit(props, "forceMount");
  const on = () => props.forceMount || row?.checked() || row?.indeterminate();
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

const GroupContext = createContext<((id: string | undefined) => void) | null>(null);

export const MenuLabelPart: Component<MenuLabelProps & { slotName: string }> = (props) => {
  const register = useContext(GroupContext);
  const rest = omit(props, "class", "inset", "slotName", "id", "as", "ref");
  const fallback = createUniqueId();
  const id = (): string => props.id || fallback;
  createEffect(id, (value) => {
    register?.(value);
    return () => register?.(undefined);
  });
  return (
    <Polymorphic
      {...merge(rest, {
        as: props.as,
        defaultAs: "span" as ValidComponent,
        ref: (el: HTMLElement) => {
          if (typeof props.ref === "function") props.ref(el);
        },
        get id() {
          return id();
        },
        "aria-hidden": "true",
        get "data-slot"() {
          return props.slotName;
        },
        get "data-inset"() {
          return props.inset;
        },
        get class() {
          return cn(MENU_LABEL, props.inset && "pl-8", props.class);
        },
      })}
    />
  );
};

export type MenuGroupProps = { as?: ValidComponent } & Omit<ComponentProps<"div">, "as">;

export const MenuGroup: Component<MenuGroupProps> = (props) => {
  const rest = omit(props, "as", "id");
  const [labelId, setLabelId] = createSignal<string>();
  const fallback = createUniqueId();
  return (
    <GroupContext value={setLabelId}>
      <Polymorphic
        {...merge(rest, {
          as: props.as,
          defaultAs: "div" as ValidComponent,
          get id() {
            return props.id || fallback;
          },
          role: "group",
          get "aria-labelledby"() {
            return labelId();
          },
        })}
      />
    </GroupContext>
  );
};

interface RadioState {
  value: Accessor<string | undefined>;
  setValue: (value: string) => void;
  disabled: Accessor<boolean>;
}

const RadioContext = createContext<RadioState | null>(null);

export type MenuRadioGroupProps = Omit<MenuGroupProps, "onChange"> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export const MenuRadioGroup: Component<MenuRadioGroupProps> = (props) => {
  const rest = omit(props, "value", "defaultValue", "onChange", "disabled");
  const [value, setValue] = createControllableSignal<string | undefined>({
    value: () => props.value,
    defaultValue: () => props.defaultValue,
    onChange: (next) => {
      if (next !== undefined) props.onChange?.(next);
    },
  });
  const state: RadioState = { value, setValue, disabled: () => props.disabled ?? false };
  return (
    <RadioContext value={state}>
      <MenuGroup {...rest} />
    </RadioContext>
  );
};

type MenuSeparatorProps = ComponentProps<"hr"> & { slotName: string };

export const MenuSeparatorPart: Component<MenuSeparatorProps> = (props) => {
  const rest = omit(props, "class", "slotName", "ref");
  return (
    <hr
      {...rest}
      ref={(el) => {
        if (typeof props.ref === "function") props.ref(el);
      }}
      data-orientation="horizontal"
      data-slot={props.slotName}
      class={cn(MENU_SEPARATOR, props.class)}
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
  const rest = omit(props as RowInput, "children");
  return (
    <MenuRow kind="sub" {...rest}>
      {props.children}
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
  const rest = omit(
    props as RowInput & CheckboxOwnProps,
    "children",
    "checked",
    "defaultChecked",
    "onChange",
  );
  const [checked, setChecked] = createControllableSignal<boolean>({
    value: () => props.checked,
    defaultValue: () => props.defaultChecked ?? false,
    onChange: (next) => props.onChange?.(next),
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
      {props.children}
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
  const rest = omit(props as RowInput & RadioOwnProps, "children", "value", "disabled");
  return (
    <MenuRow
      kind="radio"
      {...rest}
      disabled={props.disabled || group?.disabled()}
      checked={group?.value() === props.value}
      choose={() => group?.setValue(props.value)}
    >
      <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuItemIndicator>
          {/* mdi:circle is filled; lucide:circle is stroke-only and invisible at 8px. */}
          <Icon icon="mdi:circle" width={8} height={8} class="size-2" />
        </MenuItemIndicator>
      </span>
      {props.children}
    </MenuRow>
  );
}
