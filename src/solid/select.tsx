import {
  type Component,
  createMemo,
  createSignal,
  createUniqueId,
  Show,
  omit,
  untrack,
  createEffect,
  onFlush,
  merge,
} from "solid-js";
import { type ComponentProps, type JSX } from "@solidjs/web";
import { ButtonRoot, type ButtonRootProps } from "../lib/behavior/button-root.js";
import { claimKeys } from "../lib/behavior/claims.js";
import { createTypeahead } from "../lib/behavior/collection.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { focusFell, focusWithoutTracking } from "../lib/behavior/focus-scope.js";
import { CONTROL_H } from "../lib/input-classes.js";
import { MENU_LABEL } from "../lib/menu-classes.js";
import { PICKER_TRIGGER } from "../lib/picker-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { type Field, read, sameKeys, type SelectNode } from "./select-model.js";
import { forwardRef } from "../lib/behavior/solid.js";
import {
  flag,
  TAP_SLOP_PX,
  useSelect,
  SelectContext,
  type SelectContextValue,
} from "./select-context.js";
import { SelectContent, SelectGroup, SelectItem, SelectSeparator } from "./select-listbox.js";

const PRESS_CLAIM = "prevent:pointerdown";
const TRIGGER_CLAIM = `${claimKeys(["Enter", " ", "ArrowDown", "ArrowUp"])} ${PRESS_CLAIM}`;
const STEP_CLAIM = claimKeys(["ArrowLeft", "ArrowRight"]);

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
type SelectionProps = {
  multiple?: unknown;
  value?: unknown;
  defaultValue?: unknown;
  onChange?: unknown;
};

function Select<Option, OptGroup = never>(props: SelectProps<Option, OptGroup>): JSX.Element {
  const rest = omit(
    props as SelectBaseProps<Option, OptGroup> & SelectionProps,
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
    "multiple",
    "value",
    "defaultValue",
    "onChange",
  );

  const keyOf = (option: Option): string =>
    props.optionValue === undefined ? String(option) : String(read(option, props.optionValue));
  const textOf = (option: Option): string =>
    props.optionTextValue === undefined
      ? String(option)
      : String(read(option, props.optionTextValue));
  const disabledOf = (option: Option): boolean => read(option, props.optionDisabled) === true;

  const nodes = createMemo(() => {
    const out: SelectNode<unknown>[] = [];
    let items = 0;
    const groupKey = props.optionGroupChildren;
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
    for (const entry of props.options) {
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
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (next) => props.onOpenChange?.(next),
  });
  const [openFrom, setOpenFrom] = createSignal<"first" | "last">("first");
  const [trigger, setTrigger] = createSignal<HTMLElement>();
  const [triggerId, setTriggerId] = createSignal<string>("");
  const [labelId, setLabelId] = createSignal<string>();
  const [listboxLabelledBy, setListboxLabelledBy] = createSignal<string>();
  let closeAutoFocus: ((event: Event) => void) | undefined;
  let refocusIfLost = false;

  const blocked = () => !!props.disabled || !!props.readOnly || !!props.busy;
  const focusTrigger = () => {
    const event = new Event("closeautofocus", { cancelable: true });
    closeAutoFocus?.(event);
    if (!event.defaultPrevented) focusWithoutTracking(trigger());
  };

  const id = untrack(() => props.id) || createUniqueId();
  const typer = createTypeahead();

  const ctx: SelectContextValue = {
    ids: { root: id, trigger: triggerId, value: `${id}-value`, listbox: `${id}-listbox` },
    setTriggerId,
    open,
    openFrom,
    show: (from) => {
      if (blocked() || untrack(open)) return;
      if (items().length === 0 && props.open === undefined) return;
      refocusIfLost = false;
      setOpenFrom(from);
      setOpen(true);
    },
    close: (reason) => {
      if (!untrack(open)) return;
      refocusIfLost = false;
      setOpen(false);
      onFlush(() => {
        if (untrack(open)) return;
        if (reason === "commit") focusTrigger();
        else if (reason === "outside") refocusIfLost = true;
      });
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
      // Its own flush: async work onChange starts would hold a close written beside it.
      if (props.closeOnSelection ?? !props.multiple) onFlush(() => ctx.close("commit"));
      if (props.multiple) {
        const current = untrack(keys);
        setKeys(current.includes(key) ? current.filter((k) => k !== key) : [...current, key]);
      } else if (!untrack(selected).has(key)) setKeys([key]);
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
    placeholder: () => props.placeholder,
    itemComponent: () =>
      props.itemComponent as Component<{ item: SelectNode<unknown> }> | undefined,
    sectionComponent: () =>
      props.sectionComponent as Component<{ section: SelectNode<unknown> }> | undefined,
    trigger,
    setTrigger,
    labelId,
    setLabelId,
    listboxLabelledBy,
    setListboxLabelledBy,
    blocked,
    disabled: () => !!props.disabled,
    busy: () => !!props.busy,
    attrs: {
      get "data-expanded"() {
        return flag(open());
      },
      get "data-closed"() {
        return flag(!open());
      },
      get "data-valid"() {
        return flag(props.validationState === "valid");
      },
      get "data-invalid"() {
        return flag(props.validationState === "invalid");
      },
      get "data-required"() {
        return flag(!!props.required);
      },
      get "data-disabled"() {
        return flag(!!props.disabled);
      },
      get "data-readonly"() {
        return flag(!!props.readOnly);
      },
    },
  };

  return (
    <SelectContext value={ctx}>
      <div {...merge(rest, ctx.attrs, { role: "group" as const, id })}>{props.children}</div>
    </SelectContext>
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
  const others = omit(props, "children");
  const child = createMemo(() => props.children);
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
  const rest = omit(
    props as SelectTriggerProps & { ref?: unknown },
    "class",
    "children",
    "size",
    "ref",
    "id",
    "aria-label",
    "aria-labelledby",
  );
  const size = () => props.size ?? "default";
  const triggerId = () => props.id || `${ctx.ids.root}-trigger`;
  const labelledBy = () =>
    [
      props["aria-labelledby"] ?? ctx.labelId(),
      props["aria-label"] !== undefined ? triggerId() : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  createEffect(triggerId, (next) => {
    ctx.setTriggerId(next);
  });
  createEffect(labelledBy, (next) => {
    ctx.setListboxLabelledBy(next);
  });

  createEffect(ctx.trigger, (el) => {
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
          forwardRef(() => props.ref, el);
        },
        get id() {
          return triggerId();
        },
        get disabled() {
          return ctx.disabled();
        },
        get "aria-busy"() {
          return ctx.busy() ? "true" : undefined;
        },
        get "aria-disabled"() {
          return ctx.busy() ? "true" : undefined;
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
          return props["aria-label"];
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
            props.class,
          );
        },
      })}
    >
      {props.children}
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

const SelectLabel: Component<ComponentProps<"span">> = (props) => {
  const ctx = useSelect();
  const rest = omit(props, "class", "id");
  const labelId = () => props.id || `${ctx.ids.root}-label`;
  createEffect(labelId, (next) => {
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
          return cn(MENU_LABEL, "font-normal", props.class);
        },
      })}
      onClick={() => focusWithoutTracking(ctx.trigger())}
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
