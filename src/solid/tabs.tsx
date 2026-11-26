import {
  type Accessor,
  type Component,
  createContext,
  createSignal,
  createUniqueId,
  onCleanup,
  Show,
  omit,
  createEffect,
  merge,
} from "solid-js";
import { useRequired } from "../lib/context.js";
import { type ComponentProps, type ValidComponent } from "@solidjs/web";
import { type Collection, createCollection } from "../lib/behavior/collection.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { CANDIDATES, focusWithoutTracking, trackFocus } from "../lib/behavior/focus-scope.js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { TRACK_SURFACE } from "../lib/card-classes.js";
import { PRESS_DIP, SETTLE_MOTION } from "../lib/motion-classes.js";
import { SCROLL_TRACK_FADE, trackScroll } from "../lib/scroll-track.js";
import { SEGMENT_ITEM, SEGMENT_RADIUS } from "../lib/segment-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { SelectionHighlight, SelectionScope } from "./selection.js";
import { forwardRef } from "../lib/behavior/solid.js";

/** `split`: the root is `display: contents`, so a host (a modal panel) lays the
 *  list and the content out in its own regions while the tab state still spans
 *  them. */
type TabsLayout = "stack" | "split";

type Orientation = "horizontal" | "vertical";

const TABS_LAYOUT: Record<TabsLayout, string> = {
  stack: "flex flex-col gap-2", // ui-text-ok: utility classes
  split: "contents",
};

type TabsProps = Omit<ComponentProps<"div">, "onChange"> & {
  as?: ValidComponent;
  layout?: TabsLayout;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  orientation?: Orientation;
  activationMode?: "automatic" | "manual";
  disabled?: boolean;
};

interface TabsContextValue {
  value: Accessor<string | undefined>;
  select: (value: string) => void;
  orientation: Accessor<Orientation>;
  disabled: Accessor<boolean>;
  automatic: Accessor<boolean>;
  collection: Collection;
  setList: (el: HTMLElement | undefined) => void;
  register: (part: "trigger" | "content", value: string, id: string | undefined) => () => void;
  triggerId: (value: string) => string;
  contentId: (value: string) => string;
}

const TabsContext = createContext<TabsContextValue>();

const useTabs = (): TabsContextValue => {
  const ctx = useRequired(TabsContext, "Tabs parts", "Tabs");
  return ctx;
};

const TAB = '[role="tab"][data-key]';

type Ids = Record<string, string | undefined>;

const Tabs: Component<TabsProps> = (props) => {
  const others = omit(
    props,
    "class",
    "layout",
    "value",
    "defaultValue",
    "onChange",
    "orientation",
    "activationMode",
    "disabled",
    "id",
    "as",
  );
  const fallbackId = `tabs-${createUniqueId()}`;
  const id = () => props.id || fallbackId;
  const orientation = () => props.orientation ?? "horizontal";
  const [value, setValue] = createControllableSignal<string | undefined>({
    value: () => props.value,
    defaultValue: () => props.defaultValue,
    onChange: (next) => next !== undefined && props.onChange?.(next),
  });
  const [list, setList] = createSignal<HTMLElement>();
  const [triggerIds, setTriggerIds] = createSignal<Ids>({});
  const [contentIds, setContentIds] = createSignal<Ids>({});
  const collection = createCollection({
    root: list,
    itemSelector: TAB,
    orientation,
    focus: "roving",
    loop: () => true,
    dir: () => (list()?.closest("[dir]")?.getAttribute("dir") === "rtl" ? "rtl" : "ltr"),
    preferred: () => {
      const current = value();
      return current === undefined ? [] : [current];
    },
  });

  const select = (next: string) => {
    if (next === value()) props.onChange?.(next);
    else setValue(next);
  };

  createEffect(
    () => [list(), value(), triggerIds()] as const,
    ([el, current]) => {
      if (!el) return;
      const tabs = [...el.querySelectorAll<HTMLElement>(TAB)];
      if (tabs.some((tab) => tab.dataset.key === current)) return;
      const first = tabs.find((tab) => !tab.hasAttribute("data-disabled")) ?? tabs[0];
      if (first?.dataset.key !== undefined) setValue(first.dataset.key);
    },
  );

  const register: TabsContextValue["register"] = (part, key, custom) => {
    const set = part === "trigger" ? setTriggerIds : setContentIds;
    set((ids) => ({ ...ids, [key]: custom }));
    return () =>
      set((ids) => {
        const { [key]: _gone, ...kept } = ids;
        return kept;
      });
  };

  const context: TabsContextValue = {
    value,
    select,
    orientation,
    disabled: () => props.disabled ?? false,
    automatic: () => (props.activationMode ?? "automatic") === "automatic",
    collection,
    setList,
    register,
    triggerId: (key) => triggerIds()[key] ?? `${id()}-trigger-${key}`,
    contentId: (key) => contentIds()[key] ?? `${id()}-content-${key}`,
  };

  return (
    <TabsContext value={context}>
      <Polymorphic
        {...merge({ "data-slot": "tabs" }, others, {
          as: props.as,
          defaultAs: "div" as ValidComponent,
          get id() {
            return id();
          },
          get "data-orientation"() {
            return orientation();
          },
          get "data-layout"() {
            return props.layout ?? "stack";
          },
          get class() {
            return cn(TABS_LAYOUT[props.layout ?? "stack"], props.class);
          },
        })}
      />
    </TabsContext>
  );
};

type TabsListProps = ComponentProps<"div"> & { as?: ValidComponent };

const TabsList: Component<TabsListProps> = (props) => {
  const ctx = useTabs();
  const others = omit(props, "class", "children", "ref", "as");
  const [el, setEl] = createSignal<HTMLElement>();
  trackScroll(el, "[data-selected]", ctx.value);
  onCleanup(() => ctx.setList(undefined));

  createEffect(el, (node) => {
    if (!node) return;
    const keydown = (event: KeyboardEvent) => {
      const before = ctx.collection.highlighted();
      const after = ctx.collection.onKeyDown(event);
      if (after !== undefined && after !== before && ctx.automatic()) ctx.select(after);
    };
    node.addEventListener("keydown", keydown);
    return () => node.removeEventListener("keydown", keydown);
  });

  return (
    <Polymorphic
      {...merge({ "data-slot": "tabs-list" }, others, {
        as: props.as,
        defaultAs: "div" as ValidComponent,
        ref: (node: HTMLElement) => {
          setEl(node);
          ctx.setList(node);
          forwardRef(() => props.ref, node);
        },
        role: "tablist",
        get "aria-orientation"() {
          return ctx.orientation();
        },
        get "data-orientation"() {
          return ctx.orientation();
        },
        get class() {
          return cn(
            `scrollbar-hide inline-flex h-9 w-full items-center overflow-x-auto rounded-lg has-[[data-slot=tabs-trigger-icon]]:h-auto ${TRACK_SURFACE} ${SCROLL_TRACK_FADE} text-muted-foreground p-1`,
            props.class,
          );
        },
      })}
    >
      {/* w-max so triggers keep their natural width and the track scrolls;
			    w-full alone squeezed them past the rounded edge, unreachable. */}
      <SelectionScope
        marker="selected"
        radius={SEGMENT_RADIUS}
        class="flex h-full w-max min-w-full items-center gap-1"
      >
        {props.children}
      </SelectionScope>
    </Polymorphic>
  );
};

type TabsTriggerProps = ComponentProps<"button"> & {
  as?: ValidComponent;
  value: string;
  disabled?: boolean;
  icon?: string;
  inline?: boolean;
};

/** `icon` stacks a glyph over the word, so a tab row reads apart from the toggle groups under it.
 *  `inline` sets the glyph beside the word instead, for a row that stands alone. */
const TabsTrigger: Component<TabsTriggerProps> = (props) => {
  const ctx = useTabs();
  const others = omit(
    props,
    "class",
    "icon",
    "inline",
    "children",
    "value",
    "disabled",
    "id",
    "ref",
    "as",
  );
  const [el, setEl] = createSignal<HTMLElement>();
  const disabled = () => props.disabled || ctx.disabled();
  createEffect(disabled, () => {
    ctx.collection.refresh();
  });
  onCleanup(() => ctx.collection.refresh());
  const selected = () => ctx.value() === props.value;

  createEffect(
    () => [props.value, typeof props.id === "string" ? props.id : undefined] as const,
    ([key, custom]) => {
      return ctx.register("trigger", key, custom);
    },
  );

  createEffect(el, (node) => {
    if (!node) return;
    let mousePressed = false;
    const focused = trackFocus(node);
    const choose = () => {
      if (disabled()) return;
      ctx.select(props.value);
      ctx.collection.highlight(props.value, "pointer");
    };
    // A mouse selects on press, so focus lands on a tab already selected and is announced so.
    const pointerdown = (event: PointerEvent) => {
      mousePressed = event.pointerType === "mouse" && event.button === 0;
      if (mousePressed) choose();
    };
    const click = (event: MouseEvent) => {
      // WebKit leaves a clicked button unfocused.
      if (!disabled() && !focused.has()) focusWithoutTracking(node);
      if (event.detail === 0 || !mousePressed) choose();
      mousePressed = false;
    };
    const focus = () => ctx.collection.highlight(props.value, "pointer");
    node.addEventListener("pointerdown", pointerdown);
    node.addEventListener("click", click);
    node.addEventListener("focus", focus);
    return () => {
      focused.stop();
      node.removeEventListener("pointerdown", pointerdown);
      node.removeEventListener("click", click);
      node.removeEventListener("focus", focus);
    };
  });

  return (
    <Polymorphic
      {...merge({ "data-slot": "tabs-trigger" }, others, {
        as: props.as,
        defaultAs: "button" as ValidComponent,
        ref: (node: HTMLElement) => {
          setEl(node);
          forwardRef(() => props.ref, node);
        },
        get id() {
          return ctx.triggerId(props.value);
        },
        role: "tab",
        get tabIndex() {
          return disabled() ? undefined : ctx.collection.tabIndex(props.value);
        },
        get disabled() {
          return disabled();
        },
        get "aria-selected"() {
          return selected() ? "true" : "false";
        },
        get "aria-disabled"() {
          return disabled() ? "true" : undefined;
        },
        get "aria-controls"() {
          return selected() ? ctx.contentId(props.value) : undefined;
        },
        get "data-key"() {
          return props.value;
        },
        get "data-orientation"() {
          return ctx.orientation();
        },
        get "data-selected"() {
          return selected() ? "" : undefined;
        },
        get "data-highlighted"() {
          return ctx.collection.highlighted() === props.value ? "" : undefined;
        },
        get "data-disabled"() {
          return disabled() ? "" : undefined;
        },
        get class() {
          return cn(
            SEGMENT_ITEM,
            PRESS_DIP,
            "not-data-[selected]:hover:text-foreground relative isolate data-[selected]:text-(--material-accent)",
            props.icon && !props.inline && "h-auto flex-1 flex-col gap-1 py-2 text-xs",
            props.class,
          );
        },
      })}
    >
      <SelectionHighlight active={selected()} />
      {props.icon && (
        <Icon
          data-slot={props.inline ? "tabs-trigger-inline-icon" : "tabs-trigger-icon"}
          icon={props.icon}
          width={props.inline ? 16 : 18}
          height={props.inline ? 16 : 18}
          aria-hidden="true"
        />
      )}
      {props.children}
    </Polymorphic>
  );
};

type TabsContentProps = ComponentProps<"div"> & {
  as?: ValidComponent;
  value: string;
  forceMount?: boolean;
};

const TabsContent: Component<TabsContentProps> = (props) => {
  const ctx = useTabs();
  const others = omit(props, "class", "value", "forceMount", "id", "ref", "as");
  const [el, setEl] = createSignal<HTMLElement>();
  const [holdsTabStop, setHoldsTabStop] = createSignal(false);
  const selected = () => ctx.value() === props.value;

  createEffect(
    () => [props.value, typeof props.id === "string" ? props.id : undefined] as const,
    ([key, custom]) => {
      return ctx.register("content", key, custom);
    },
  );
  createEffect(el, (node) => {
    if (node) setHoldsTabStop(node.querySelector(CANDIDATES) !== null);
  });

  return (
    <Show when={props.forceMount || selected()}>
      <Polymorphic
        {...merge({ "data-slot": "tabs-content" }, others, {
          as: props.as,
          defaultAs: "div" as ValidComponent,
          ref: (node: HTMLElement) => {
            setEl(node);
            forwardRef(() => props.ref, node);
          },
          get id() {
            return ctx.contentId(props.value);
          },
          role: "tabpanel",
          get tabIndex() {
            return holdsTabStop() ? undefined : 0;
          },
          get "aria-labelledby"() {
            return ctx.triggerId(props.value);
          },
          get "data-orientation"() {
            return ctx.orientation();
          },
          get "data-selected"() {
            return selected() ? "" : undefined;
          },
          get class() {
            return cn(
              SETTLE_MOTION,
              "focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
              props.class,
            );
          },
        })}
      />
    </Show>
  );
};

export { Tabs, TabsContent, TabsList, TabsTrigger };
