import {
  type Component,
  createComponent,
  createSignal,
  For,
  onCleanup,
  Show,
  omit,
  untrack,
  createEffect,
  merge,
} from "solid-js";
import { type ComponentProps, type JSX } from "@solidjs/web";
import { Layer } from "../lib/behavior/layer.js";
import { createAnchored } from "../lib/behavior/anchored.js";
import { claimKeys, createClaim } from "../lib/behavior/claims.js";
import { createCollection } from "../lib/behavior/collection.js";
import { createDismiss } from "../lib/behavior/dismiss.js";
import { focusWithoutTracking } from "../lib/behavior/focus-scope.js";
import { registerLayer } from "../lib/behavior/layer-stack.js";
import {
  type InteractOutsideEvent,
  interactOutside,
  type PointerDownOutsideEvent,
  vetoed,
} from "../lib/behavior/modal-root.js";
import { createPresence } from "../lib/behavior/presence.js";
import { INPUT_SURFACE } from "../lib/input-classes.js";
import { nestedLayerAttrs, Z_CLASS } from "../lib/layers.js";
import { MENU_ITEM, MENU_ITEM_RADIUS, MENU_SEPARATOR } from "../lib/menu-classes.js";
import { FIELD_MOTION, MOTION_EXIT_MS } from "../lib/motion-classes.js";
import { PICKER_LIST } from "../lib/picker-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { type SelectNode } from "./select-model.js";
import { usePortalMount } from "./portal-mount.js";
import { SelectionHighlight, SelectionScope } from "./selection.js";
import { forwardRef } from "../lib/behavior/solid.js";
import {
  flag,
  ITEM,
  SelectListContext,
  TAP_SLOP_PX,
  useSelect,
  useSelectList,
} from "./select-context.js";

const LISTBOX_CLAIM = claimKeys(["Enter", " "]);

interface SelectContentProps extends Omit<ComponentProps<"div">, "children"> {
  listboxClass?: string;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void;
  onInteractOutside?: (event: InteractOutsideEvent) => void;
  onCloseAutoFocus?: (event: Event) => void;
}

const SelectContent: Component<SelectContentProps> = (props) => {
  const ctx = useSelect();
  const others = omit(
    props,
    "class",
    "listboxClass",
    "ref",
    "onEscapeKeyDown",
    "onPointerDownOutside",
    "onInteractOutside",
    "onCloseAutoFocus",
  );
  const [panel, setPanel] = createSignal<HTMLElement>();
  const [listbox, setListbox] = createSignal<HTMLElement>();

  createEffect(
    () => props.onCloseAutoFocus,
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
        if (vetoed(props.onEscapeKeyDown, event as KeyboardEvent)) return;
        ctx.close("commit");
        return;
      }
      const outside = interactOutside(event as PointerEvent, (e) => {
        props.onPointerDownOutside?.(e);
        props.onInteractOutside?.(e);
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

  createEffect(
    () => [ctx.open(), listbox()] as const,
    ([open, list]) => {
      if (!open || !list) return;
      const enabled = [...list.querySelectorAll<HTMLElement>(ITEM)].filter(
        (el) => el.getAttribute("aria-disabled") !== "true",
      );
      const chosen = untrack(ctx.firstSelected);
      const start =
        enabled.find((el) => el.dataset.key === chosen) ??
        (untrack(ctx.openFrom) === "last" ? enabled.at(-1) : enabled[0]);
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

  const portalMount = usePortalMount();
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
            forwardRef(() => props.ref, el);
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
              props.class,
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
            class={props.listboxClass}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onClick={onClick}
          >
            <For each={ctx.nodes()} keyed={(node) => node.key}>
              {(node) => (
                <Show when={node().type === "section"} fallback={<Row node={node()} />}>
                  <Section node={node()} />
                </Show>
              )}
            </For>
          </ul>
        </SelectionScope>
      </div>
    );
  };

  return (
    <SelectListContext value={{ highlighted: collection.highlighted }}>
      <Layer mount={portalMount} when={presence.mounted()}>
        <Panel />
      </Layer>
    </SelectListContext>
  );
};

interface SelectItemProps extends Omit<ComponentProps<"li">, "children"> {
  item: SelectNode<unknown>;
  children?: JSX.Element;
}

const SelectItem: Component<SelectItemProps> = (props) => {
  const ctx = useSelect();
  const list = useSelectList();
  const rest = omit(props, "class", "children", "item");
  const key = () => props.item.key;
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
      return flag(props.item.disabled);
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
          return props.item.disabled ? ("true" as const) : ("false" as const);
        },
        get "aria-labelledby"() {
          return labelId();
        },
        "data-slot": "select-item",
        get class() {
          return cn(
            MENU_ITEM,
            "focus:text-foreground data-[highlighted]:text-foreground w-full pr-8 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
            props.class,
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
        {props.children}
      </div>
    </li>
  );
};

const SelectGroup: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  return <div data-slot="select-group" class={cn("", props.class)} {...rest} />;
};

const SelectSeparator: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  return (
    <div
      data-slot="select-separator"
      class={cn("pointer-events-none", MENU_SEPARATOR, props.class)}
      {...rest}
    />
  );
};

export { SelectContent, SelectGroup, SelectItem, SelectSeparator };
