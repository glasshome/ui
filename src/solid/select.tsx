import {
  type Accessor,
  type Component,
  type ComponentProps,
  createComponent,
  createContext,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  type JSX,
  onCleanup,
  Show,
  splitProps,
  untrack,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";
import { createAnchored } from "../lib/behavior/anchored.js";
import { ButtonRoot, type ButtonRootProps } from "../lib/behavior/button-root.js";
import { claimKeys, createClaim } from "../lib/behavior/claims.js";
import { createCollection, createTypeahead } from "../lib/behavior/collection.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { createDismiss } from "../lib/behavior/dismiss.js";
import { focusFell, focusWithoutTracking } from "../lib/behavior/focus-scope.js";
import { registerLayer } from "../lib/behavior/layer-stack.js";
import {
  type InteractOutsideEvent,
  interactOutside,
  type PointerDownOutsideEvent,
  vetoed,
} from "../lib/behavior/modal-root.js";
import { createPresence } from "../lib/behavior/presence.js";
import { effect, merge } from "../lib/behavior/solid.js";
import { CONTROL_H, INPUT_SURFACE } from "../lib/input-classes.js";
import { nestedLayerAttrs, Z_CLASS } from "../lib/layers.js";
import { MENU_ITEM, MENU_ITEM_RADIUS, MENU_LABEL, MENU_SEPARATOR } from "../lib/menu-classes.js";
import { FIELD_MOTION, MOTION_EXIT_MS } from "../lib/motion-classes.js";
import { PICKER_LIST, PICKER_TRIGGER } from "../lib/picker-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { usePortalMount } from "./portal-mount.js";
import { SelectionHighlight, SelectionScope } from "./selection.js";

const PRESS_CLAIM = "prevent:pointerdown";
const TRIGGER_CLAIM = `${claimKeys(["Enter", " ", "ArrowDown", "ArrowUp"])} ${PRESS_CLAIM}`;
const STEP_CLAIM = claimKeys(["ArrowLeft", "ArrowRight"]);
const LISTBOX_CLAIM = claimKeys(["Enter", " "]);

/** One row of the list: an option, or the heading of a group of options. */
interface SelectNode<T> {
  type: "item" | "section";
  key: string;
  rawValue: T;
  textValue: string;
  disabled: boolean;
  level: number;
  index: number;
  prevKey?: string;
  nextKey?: string;
}

type Field<T, V> = keyof Exclude<T, null> | ((option: Exclude<T, null>) => V);

interface SelectBaseProps<Option, OptGroup> extends Omit<
  ComponentProps<"div">,
  "onChange" | "placeholder" | "children"
> {
  options: (Option | OptGroup)[];
  optionValue?: Field<Option, string | number>;
  optionTextValue?: Field<Option, string>;
  optionDisabled?: Field<Option, boolean>;
  optionGroupChildren?: keyof Exclude<OptGroup, null>;
  itemComponent?: Component<{ item: SelectNode<Option> }>;
  sectionComponent?: Component<{ section: SelectNode<OptGroup> }>;
  placeholder?: JSX.Element;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnSelection?: boolean;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  busy?: boolean;
  validationState?: "valid" | "invalid";
  children?: JSX.Element;
}

interface SingleProps<Option> {
  multiple?: false;
  value?: Option | null;
  defaultValue?: Option;
  onChange?: (value: Option | null) => void;
}

interface MultipleProps<Option> {
  multiple: true;
  value?: Option[];
  defaultValue?: Option[];
  onChange?: (value: Option[]) => void;
}

type SelectProps<Option, OptGroup = never> = SelectBaseProps<Option, OptGroup> &
  (SingleProps<Option> | MultipleProps<Option>);

type CloseReason = "commit" | "outside" | "parent";

interface SelectContextValue {
  ids: { root: string; trigger: Accessor<string>; value: string; listbox: string };
  setTriggerId: (id: string) => void;
  open: Accessor<boolean>;
  openFrom: Accessor<"first" | "last">;
  show: (from: "first" | "last") => void;
  close: (reason: CloseReason) => void;
  /** The panel unmounted: a close by an outside press refocuses the trigger only if focus fell to the page. */
  settle: () => void;
  setCloseAutoFocus: (handler: ((event: Event) => void) | undefined) => void;
  nodes: Accessor<readonly SelectNode<unknown>[]>;
  optionId: (key: string | undefined) => string | undefined;
  multiple: Accessor<boolean>;
  isSelected: (key: string) => boolean;
  firstSelected: Accessor<string | undefined>;
  empty: Accessor<boolean>;
  choose: (key: string) => void;
  step: (by: 1 | -1) => void;
  typeahead: (event: KeyboardEvent) => boolean;
  selectedOptions: Accessor<unknown[]>;
  remove: (option: unknown) => void;
  clear: () => void;
  placeholder: () => JSX.Element;
  itemComponent: Accessor<Component<{ item: SelectNode<unknown> }> | undefined>;
  sectionComponent: Accessor<Component<{ section: SelectNode<unknown> }> | undefined>;
  trigger: Accessor<HTMLElement | undefined>;
  setTrigger: (el: HTMLElement | undefined) => void;
  labelId: Accessor<string | undefined>;
  setLabelId: (id: string | undefined) => void;
  listboxLabelledBy: Accessor<string | undefined>;
  setListboxLabelledBy: (ids: string | undefined) => void;
  blocked: Accessor<boolean>;
  disabled: Accessor<boolean>;
  busy: Accessor<boolean>;
  attrs: StateAttrs;
}

type StateAttrs = {
  [
    K in
      | "data-expanded"
      | "data-closed"
      | "data-valid"
      | "data-invalid"
      | "data-required"
      | "data-disabled"
      | "data-readonly"
  ]: "" | undefined;
};

const SelectContext = createContext<SelectContextValue | null>(null);

const useSelect = (): SelectContextValue => {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error("Select parts render inside a Select");
  return ctx;
};

interface SelectListValue {
  highlighted: Accessor<string | undefined>;
}

const SelectListContext = createContext<SelectListValue | null>(null);

const useSelectList = (): SelectListValue => {
  const ctx = useContext(SelectListContext);
  if (!ctx) throw new Error("SelectItem renders inside SelectContent, through itemComponent");
  return ctx;
};

const ITEM = '[role="option"][data-key]';
const TAP_SLOP_PX = 10;
const flag = (on: boolean) => (on ? "" : undefined);

function read<T, V>(option: T, by: Field<T, V> | undefined): unknown {
  if (by === undefined || option === null || option === undefined) return undefined;
  if (typeof by === "function") return by(option as Exclude<T, null>);
  return (option as Record<PropertyKey, unknown>)[by as PropertyKey];
}

const sameKeys = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((key, i) => key === b[i]);

type SelectionProps = {
  multiple?: unknown;
  value?: unknown;
  defaultValue?: unknown;
  onChange?: unknown;
};

function Select<Option, OptGroup = never>(props: SelectProps<Option, OptGroup>): JSX.Element {
  const [local, , rest] = splitProps(
    props as SelectBaseProps<Option, OptGroup> & SelectionProps,
    [
      "options",
      "optionValue",
      "optionTextValue",
      "optionDisabled",
      "optionGroupChildren",
      "itemComponent",
      "sectionComponent",
      "placeholder",
      "open",
      "defaultOpen",
      "onOpenChange",
      "closeOnSelection",
      "disabled",
      "required",
      "readOnly",
      "busy",
      "validationState",
      "children",
      "id",
    ],
    ["multiple", "value", "defaultValue", "onChange"],
  );

  const keyOf = (option: Option): string =>
    local.optionValue === undefined ? String(option) : String(read(option, local.optionValue));
  const textOf = (option: Option): string =>
    local.optionTextValue === undefined
      ? String(option)
      : String(read(option, local.optionTextValue));
  const disabledOf = (option: Option): boolean => read(option, local.optionDisabled) === true;

  const nodes = createMemo(() => {
    const out: SelectNode<unknown>[] = [];
    let items = 0;
    const groupKey = local.optionGroupChildren;
    const add = (option: Option, level: number) =>
      out.push({
        type: "item",
        key: keyOf(option),
        rawValue: option,
        textValue: textOf(option),
        disabled: disabledOf(option),
        level,
        index: items++,
      });
    for (const entry of local.options) {
      const children =
        groupKey !== undefined && entry !== null && typeof entry === "object"
          ? (entry as Record<PropertyKey, unknown>)[groupKey as PropertyKey]
          : undefined;
      if (Array.isArray(children)) {
        out.push({
          type: "section",
          key: `section-${out.length}`,
          rawValue: entry,
          textValue: "",
          disabled: false,
          level: 0,
          index: out.length,
        });
        for (const child of children as Option[]) add(child, 1);
      } else add(entry as Option, 0);
    }
    out.forEach((node, i) => {
      node.prevKey = out[i - 1]?.key;
      node.nextKey = out[i + 1]?.key;
    });
    return out;
  });
  const items = createMemo(() => nodes().filter((node) => node.type === "item"));
  const byKey = createMemo(() => new Map(items().map((node) => [node.key, node])));

  const toKeys = (value: Option | Option[] | null | undefined): string[] | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return [];
    return props.multiple ? (value as Option[]).map(keyOf) : [keyOf(value as Option)];
  };
  const optionsOf = (keys: readonly string[]) =>
    keys.flatMap((key) => {
      const node = byKey().get(key);
      return node ? [node.rawValue as Option] : [];
    });
  const [keys, setKeys] = createControllableSignal<readonly string[]>({
    value: () => toKeys(props.value),
    defaultValue: () => toKeys(props.defaultValue) ?? [],
    equals: sameKeys,
    onChange: (next) => {
      const chosen = optionsOf(next);
      if (props.multiple) props.onChange?.(chosen);
      else props.onChange?.(chosen[0] ?? null);
    },
  });
  const selected = createMemo(() => new Set(keys()));

  const [open, setOpen] = createControllableSignal<boolean>({
    value: () => local.open,
    defaultValue: () => local.defaultOpen ?? false,
    onChange: (next) => local.onOpenChange?.(next),
  });
  const [openFrom, setOpenFrom] = createSignal<"first" | "last">("first");
  const [trigger, setTrigger] = createSignal<HTMLElement>();
  const [triggerId, setTriggerId] = createSignal<string>("");
  const [labelId, setLabelId] = createSignal<string>();
  const [listboxLabelledBy, setListboxLabelledBy] = createSignal<string>();
  let closeAutoFocus: ((event: Event) => void) | undefined;
  let refocusIfLost = false;

  const blocked = () => !!local.disabled || !!local.readOnly || !!local.busy;
  const focusTrigger = () => {
    const event = new Event("closeautofocus", { cancelable: true });
    closeAutoFocus?.(event);
    if (!event.defaultPrevented) focusWithoutTracking(trigger());
  };

  const id = untrack(() => local.id) ?? createUniqueId();
  const typer = createTypeahead();

  const ctx: SelectContextValue = {
    ids: { root: id, trigger: triggerId, value: `${id}-value`, listbox: `${id}-listbox` },
    setTriggerId,
    open,
    openFrom,
    show: (from) => {
      if (blocked() || untrack(open)) return;
      if (items().length === 0 && local.open === undefined) return;
      refocusIfLost = false;
      setOpenFrom(from);
      setOpen(true);
    },
    close: (reason) => {
      if (!untrack(open)) return;
      refocusIfLost = false;
      setOpen(false);
      if (untrack(open)) return;
      if (reason === "commit") focusTrigger();
      else if (reason === "outside") refocusIfLost = true;
    },
    settle: () => {
      const near = trigger();
      if (!refocusIfLost || !near) return;
      refocusIfLost = false;
      if (focusFell(near)) focusTrigger();
    },
    setCloseAutoFocus: (handler) => {
      closeAutoFocus = handler;
    },
    nodes,
    optionId: (key) => {
      const node = key === undefined ? undefined : byKey().get(key);
      return node ? `${id}-option-${node.index}` : undefined;
    },
    multiple: () => !!props.multiple,
    isSelected: (key) => selected().has(key),
    firstSelected: () => keys()[0],
    empty: () => keys().length === 0,
    choose: (key) => {
      const node = byKey().get(key);
      if (!node || node.disabled || blocked()) return;
      if (props.multiple) {
        const current = untrack(keys);
        setKeys(current.includes(key) ? current.filter((k) => k !== key) : [...current, key]);
      } else if (!untrack(selected).has(key)) setKeys([key]);
      if (local.closeOnSelection ?? !props.multiple) ctx.close("commit");
    },
    step: (by) => {
      if (props.multiple || blocked()) return;
      const enabled = items().filter((node) => !node.disabled);
      const at = enabled.findIndex((node) => node.key === untrack(keys)[0]);
      const next = at < 0 ? enabled[0] : enabled[at + by];
      if (next) setKeys([next.key]);
    },
    typeahead: (event) => {
      const enabled = items().filter((node) => !node.disabled);
      const from = enabled.findIndex((node) => node.key === untrack(keys)[0]);
      const index = typer.match(
        event,
        enabled.map((node) => node.textValue),
        from,
      );
      if (index === undefined) return false;
      const next = enabled[index];
      if (next && !props.multiple && !blocked()) setKeys([next.key]);
      return true;
    },
    selectedOptions: () => optionsOf(keys()),
    remove: (option) => {
      const key = keyOf(option as Option);
      setKeys(untrack(keys).filter((k) => k !== key));
    },
    clear: () => setKeys([]),
    placeholder: () => local.placeholder,
    itemComponent: () =>
      local.itemComponent as Component<{ item: SelectNode<unknown> }> | undefined,
    sectionComponent: () =>
      local.sectionComponent as Component<{ section: SelectNode<unknown> }> | undefined,
    trigger,
    setTrigger,
    labelId,
    setLabelId,
    listboxLabelledBy,
    setListboxLabelledBy,
    blocked,
    disabled: () => !!local.disabled,
    busy: () => !!local.busy,
    attrs: {
      get "data-expanded"() {
        return flag(open());
      },
      get "data-closed"() {
        return flag(!open());
      },
      get "data-valid"() {
        return flag(local.validationState === "valid");
      },
      get "data-invalid"() {
        return flag(local.validationState === "invalid");
      },
      get "data-required"() {
        return flag(!!local.required);
      },
      get "data-disabled"() {
        return flag(!!local.disabled);
      },
      get "data-readonly"() {
        return flag(!!local.readOnly);
      },
    },
  };

  return (
    <SelectContext.Provider value={ctx}>
      <div {...merge(rest, ctx.attrs, { role: "group" as const, id })}>{local.children}</div>
    </SelectContext.Provider>
  );
}

interface SelectValueState<Option> {
  selectedOption: () => Option;
  selectedOptions: () => Option[];
  remove: (option: Option) => void;
  clear: () => void;
}

interface SelectValueProps<Option> extends Omit<ComponentProps<"span">, "children"> {
  children?: JSX.Element | ((state: SelectValueState<Option>) => JSX.Element);
}

function SelectValue<Option>(props: SelectValueProps<Option>): JSX.Element {
  const ctx = useSelect();
  const [local, others] = splitProps(props, ["children"]);
  const child = createMemo(() => local.children);
  const state: SelectValueState<Option> = {
    selectedOption: () => ctx.selectedOptions()[0] as Option,
    selectedOptions: () => ctx.selectedOptions() as Option[],
    remove: (option) => ctx.remove(option),
    clear: () => ctx.clear(),
  };
  const shown = () => {
    const value = child();
    return typeof value === "function" ? value(state) : value;
  };
  return (
    <span
      {...merge(others, ctx.attrs, {
        id: ctx.ids.value,
        get "data-placeholder-shown"() {
          return flag(ctx.empty());
        },
      })}
    >
      <Show when={!ctx.empty()} fallback={ctx.placeholder()}>
        {shown()}
      </Show>
    </span>
  );
}

type SelectTriggerProps = ButtonRootProps<"button"> & { size?: "sm" | "default" };

const SelectTrigger: Component<SelectTriggerProps> = (props) => {
  const ctx = useSelect();
  const [local, rest] = splitProps(props as SelectTriggerProps & { ref?: unknown }, [
    "class",
    "children",
    "size",
    "ref",
    "id",
    "aria-label",
    "aria-labelledby",
  ]);
  const size = () => local.size ?? "default";
  const triggerId = () => local.id ?? `${ctx.ids.root}-trigger`;
  const labelledBy = () =>
    [
      local["aria-labelledby"] ?? ctx.labelId(),
      local["aria-label"] !== undefined ? triggerId() : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  effect(triggerId, (next) => {
    ctx.setTriggerId(next);
  });
  effect(labelledBy, (next) => {
    ctx.setListboxLabelledBy(next);
  });

  effect(ctx.trigger, (el) => {
    if (!el) return;
    let touch: { x: number; y: number } | undefined;
    let pressed = false;
    const onPointerDown = (event: PointerEvent) => {
      touch = undefined;
      pressed = true;
      if (ctx.blocked()) return;
      if (event.pointerType === "touch") {
        touch = { x: event.clientX, y: event.clientY };
        return;
      }
      if (event.button !== 0 || event.ctrlKey) return;
      event.preventDefault();
      if (ctx.open()) ctx.close("commit");
      else ctx.show("first");
    };
    const onPointerMove = (event: PointerEvent) => {
      if (touch && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > TAP_SLOP_PX)
        touch = undefined;
    };
    const onPointerCancel = () => {
      touch = undefined;
      pressed = false;
    };
    // A click with no pointer press before it comes from assistive technology.
    const onClick = () => {
      const tapped = touch !== undefined;
      const unpressed = !pressed;
      touch = undefined;
      pressed = false;
      if (!tapped && (!unpressed || ctx.blocked())) return;
      if (ctx.open()) ctx.close("commit");
      else ctx.show("first");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || ctx.blocked() || ctx.open()) return;
      if (event.key === " " && ctx.typeahead(event)) return event.preventDefault();
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        ctx.show("first");
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        ctx.show("last");
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        if (ctx.multiple()) return;
        event.preventDefault();
        ctx.step(event.key === "ArrowLeft" ? -1 : 1);
      } else if (ctx.typeahead(event)) event.preventDefault();
    };
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointercancel", onPointerCancel);
    el.addEventListener("click", onClick);
    el.addEventListener("keydown", onKeyDown);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointercancel", onPointerCancel);
      el.removeEventListener("click", onClick);
      el.removeEventListener("keydown", onKeyDown);
    };
  });

  return (
    <ButtonRoot
      {...merge(rest, ctx.attrs, {
        ref: (el: HTMLButtonElement) => {
          ctx.setTrigger(el);
          if (typeof local.ref === "function") local.ref(el);
        },
        get id() {
          return triggerId();
        },
        get disabled() {
          return ctx.disabled();
        },
        get "aria-busy"() {
          return ctx.busy() || undefined;
        },
        get "aria-disabled"() {
          return ctx.busy() || undefined;
        },
        "aria-haspopup": "listbox" as const,
        get "data-claim"() {
          if (ctx.blocked()) return undefined;
          if (ctx.open()) return PRESS_CLAIM;
          return ctx.multiple() ? TRIGGER_CLAIM : `${TRIGGER_CLAIM} ${STEP_CLAIM}`;
        },
        get "aria-expanded"() {
          return ctx.open() ? ("true" as const) : ("false" as const);
        },
        get "aria-controls"() {
          return ctx.open() ? ctx.ids.listbox : undefined;
        },
        get "aria-label"() {
          return local["aria-label"];
        },
        get "aria-labelledby"() {
          return [labelledBy(), ctx.ids.value].filter(Boolean).join(" ");
        },
        "data-slot": "select-trigger",
        get "data-size"() {
          return size();
        },
        get class() {
          return cn(
            PICKER_TRIGGER,
            // The one deviation from the shared recipe: a Select sizes to its
            // value, every other picker fills its field.
            "data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground w-fit whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            size() === "sm" && CONTROL_H.sm,
            "aria-busy:cursor-progress aria-busy:opacity-50",
            local.class,
          );
        },
      })}
    >
      {local.children}
      <span aria-hidden="true" {...ctx.attrs}>
        <Icon
          icon="lucide:chevron-down"
          width={16}
          height={16}
          class="text-muted-foreground size-4 opacity-50"
        />
      </span>
    </ButtonRoot>
  );
};

interface SelectContentProps extends Omit<ComponentProps<"div">, "children"> {
  listboxClass?: string;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void;
  onInteractOutside?: (event: InteractOutsideEvent) => void;
  onCloseAutoFocus?: (event: Event) => void;
}

const SelectContent: Component<SelectContentProps> = (props) => {
  const ctx = useSelect();
  const [local, others] = splitProps(props, [
    "class",
    "listboxClass",
    "ref",
    "onEscapeKeyDown",
    "onPointerDownOutside",
    "onInteractOutside",
    "onCloseAutoFocus",
  ]);
  const [panel, setPanel] = createSignal<HTMLElement>();
  const [listbox, setListbox] = createSignal<HTMLElement>();

  effect(
    () => local.onCloseAutoFocus,
    (handler) => {
      ctx.setCloseAutoFocus(handler);
      return () => ctx.setCloseAutoFocus(undefined);
    },
  );

  const presence = createPresence({
    present: ctx.open,
    element: panel,
    exitMs: MOTION_EXIT_MS.field,
  });
  const layer = registerLayer({
    element: panel,
    open: ctx.open,
    kind: "popover",
    escape: () => true,
    dismiss: () => ctx.close("parent"),
    trigger: ctx.trigger,
  });
  createDismiss({
    layer,
    onDismiss: (reason, event) => {
      if (reason === "escape") {
        if (vetoed(local.onEscapeKeyDown, event as KeyboardEvent)) return;
        ctx.close("commit");
        return;
      }
      const outside = interactOutside(event as PointerEvent, (e) => {
        local.onPointerDownOutside?.(e);
        local.onInteractOutside?.(e);
      });
      if (outside.defaultPrevented) return;
      ctx.close("outside");
    },
  });
  createAnchored({
    anchor: ctx.trigger,
    floating: panel,
    open: ctx.open,
    side: () => "bottom",
    align: () => "start",
    offset: 0,
    matchAnchorWidth: true,
    coverAnchor: true,
  });

  const collection = createCollection({
    root: listbox,
    itemSelector: ITEM,
    orientation: () => "vertical",
    focus: "virtual",
  });
  createClaim(listbox, () => LISTBOX_CLAIM);

  effect(
    () => [ctx.open(), listbox()] as const,
    ([open, list]) => {
      if (!open || !list) return;
      const enabled = [...list.querySelectorAll<HTMLElement>(ITEM)].filter(
        (el) => el.getAttribute("aria-disabled") !== "true",
      );
      const chosen = ctx.firstSelected();
      const start =
        enabled.find((el) => el.dataset.key === chosen) ??
        (ctx.openFrom() === "last" ? enabled.at(-1) : enabled[0]);
      if (start?.dataset.key) collection.highlight(start.dataset.key, "keyboard");
      focusWithoutTracking(list);
    },
  );

  const keyAt = (target: EventTarget | null): string | undefined => {
    const list = listbox();
    const option = target instanceof Element ? target.closest<HTMLElement>(ITEM) : null;
    return option && list?.contains(option) ? option.dataset.key : undefined;
  };

  let press: { x: number; y: number; type: string; moved: boolean } | undefined;
  let pointerPressed = false;
  const onPointerDown = (event: PointerEvent) => {
    pointerPressed = true;
    press =
      event.button === 0
        ? { x: event.clientX, y: event.clientY, type: event.pointerType, moved: false }
        : undefined;
  };
  const onPointerMove = (event: PointerEvent) => {
    if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > TAP_SLOP_PX)
      press.moved = true;
    if (event.pointerType !== "mouse" || !ctx.open()) return;
    const key = keyAt(event.target);
    if (key && key !== collection.highlighted()) collection.highlight(key, "pointer");
  };
  const onPointerUp = (event: PointerEvent) => {
    const started = press;
    press = undefined;
    if (!started || !ctx.open()) return;
    if (started.type !== "mouse" && started.moved) return;
    const key = keyAt(event.target);
    if (key) ctx.choose(key);
  };
  const onPointerCancel = () => {
    press = undefined;
    pointerPressed = false;
  };
  // A click with no pointer press before it comes from assistive technology.
  const onClick = (event: MouseEvent) => {
    const pressed = pointerPressed;
    pointerPressed = false;
    if (pressed || !ctx.open()) return;
    const key = keyAt(event.target);
    if (key) ctx.choose(key);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (!ctx.open()) return;
    collection.onKeyDown(event);
    if (event.defaultPrevented) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const key = collection.highlighted();
      if (key) ctx.choose(key);
    } else if (event.key === "Tab") ctx.close("commit");
  };

  const Row: Component<{ node: SelectNode<unknown> }> = (row) => (
    <Show when={ctx.itemComponent()} keyed>
      {(Item) =>
        createComponent(Item, {
          get item() {
            return row.node;
          },
        })
      }
    </Show>
  );
  const Section: Component<{ node: SelectNode<unknown> }> = (row) => (
    <li role="presentation">
      <Show when={ctx.sectionComponent()} keyed>
        {(Heading) =>
          createComponent(Heading, {
            get section() {
              return row.node;
            },
          })
        }
      </Show>
    </li>
  );

  const Panel: Component = () => {
    onCleanup(() => {
      setPanel(undefined);
      setListbox(undefined);
      ctx.settle();
    });
    return (
      <div
        {...merge(others, nestedLayerAttrs(false), {
          ref: (el: HTMLDivElement) => {
            setPanel(el);
            if (typeof local.ref === "function") local.ref(el);
          },
          "data-slot": "select-content",
          get "data-expanded"() {
            return flag(ctx.open());
          },
          get "data-closed"() {
            return flag(!ctx.open());
          },
          get class() {
            return cn(
              // Same concave surface as the trigger: opening reads as the input
              // expanding, not a separate floating panel.
              INPUT_SURFACE,
              FIELD_MOTION,
              `relative ${Z_CLASS.overlay} text-popover-foreground overflow-hidden rounded-md p-1`,
              local.class,
            );
          },
        })}
      >
        <SelectionScope
          marker="highlighted"
          radius={MENU_ITEM_RADIUS}
          class={cn("w-full", PICKER_LIST)}
        >
          <ul
            ref={setListbox}
            role="listbox"
            id={ctx.ids.listbox}
            tabindex="-1"
            aria-labelledby={ctx.listboxLabelledBy()}
            aria-multiselectable={ctx.multiple() ? "true" : undefined}
            aria-activedescendant={ctx.optionId(collection.highlighted())}
            class={local.listboxClass}
            on:keydown={onKeyDown}
            on:pointerdown={onPointerDown}
            on:pointermove={onPointerMove}
            on:pointerup={onPointerUp}
            on:pointercancel={onPointerCancel}
            on:click={onClick}
          >
            <For each={ctx.nodes()}>
              {(node) => (node.type === "section" ? <Section node={node} /> : <Row node={node} />)}
            </For>
          </ul>
        </SelectionScope>
      </div>
    );
  };

  return (
    <SelectListContext.Provider value={{ highlighted: collection.highlighted }}>
      <Show when={presence.mounted()}>
        <Portal mount={usePortalMount()}>
          <Panel />
        </Portal>
      </Show>
    </SelectListContext.Provider>
  );
};

const SelectLabel: Component<ComponentProps<"span">> = (props) => {
  const ctx = useSelect();
  const [local, rest] = splitProps(props, ["class", "id"]);
  const labelId = () => local.id ?? `${ctx.ids.root}-label`;
  effect(labelId, (next) => {
    ctx.setLabelId(next);
    return () => ctx.setLabelId(undefined);
  });
  return (
    <span
      {...merge(rest, ctx.attrs, {
        get id() {
          return labelId();
        },
        "data-slot": "select-label",
        get class() {
          return cn(MENU_LABEL, "font-normal", local.class);
        },
      })}
      on:click={() => focusWithoutTracking(ctx.trigger())}
    />
  );
};

interface SelectItemProps extends Omit<ComponentProps<"li">, "children"> {
  item: SelectNode<unknown>;
  children?: JSX.Element;
}

const SelectItem: Component<SelectItemProps> = (props) => {
  const ctx = useSelect();
  const list = useSelectList();
  const [local, rest] = splitProps(props, ["class", "children", "item"]);
  const key = () => local.item.key;
  const optionId = () => ctx.optionId(key());
  const labelId = () => `${optionId()}-label`;
  const isSelected = () => ctx.isSelected(key());
  const marks = {
    get "data-selected"() {
      return flag(isSelected());
    },
    get "data-highlighted"() {
      return flag(list.highlighted() === key());
    },
    get "data-disabled"() {
      return flag(local.item.disabled);
    },
  };
  return (
    <li
      {...merge(rest, marks, {
        role: "option" as const,
        get id() {
          return optionId();
        },
        get "data-key"() {
          return key();
        },
        get "aria-selected"() {
          return isSelected() ? ("true" as const) : ("false" as const);
        },
        get "aria-disabled"() {
          return local.item.disabled ? ("true" as const) : ("false" as const);
        },
        get "aria-labelledby"() {
          return labelId();
        },
        "data-slot": "select-item",
        get class() {
          return cn(
            MENU_ITEM,
            "focus:text-foreground data-[highlighted]:text-foreground w-full pr-8 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
            local.class,
          );
        },
      })}
    >
      <SelectionHighlight active={list.highlighted() === key()} />
      <Show when={isSelected()}>
        <span class="absolute right-2 flex size-3.5 items-center justify-center">
          <div aria-hidden="true" {...marks}>
            <Icon icon="lucide:check" width={16} height={16} class="size-4 text-current" />
          </div>
        </span>
      </Show>
      <div id={labelId()} {...marks}>
        {local.children}
      </div>
    </li>
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
