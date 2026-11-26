import {
  type Accessor,
  type Component,
  type ComponentProps,
  createContext,
  createSignal,
  createUniqueId,
  onCleanup,
  onMount,
  Show,
  splitProps,
  useContext,
  type ValidComponent,
} from "solid-js";
import { type Collection, createCollection } from "../lib/behavior/collection.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { CANDIDATES, focusWithoutTracking, trackFocus } from "../lib/behavior/focus-scope.js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { effect, merge } from "../lib/behavior/solid.js";
import { TRACK_SURFACE } from "../lib/card-classes.js";
import { PRESS_DIP, SETTLE_MOTION } from "../lib/motion-classes.js";
import { SCROLL_TRACK_FADE, trackScroll } from "../lib/scroll-track.js";
import { SEGMENT_ITEM, SEGMENT_RADIUS } from "../lib/segment-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { SelectionHighlight, SelectionScope } from "./selection.js";

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

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabs = (): TabsContextValue => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs parts render inside a Tabs");
  return ctx;
};

const TAB = '[role="tab"][data-key]';

type Ids = Record<string, string | undefined>;

const Tabs: Component<TabsProps> = (props) => {
  const [local, others] = splitProps(props, [
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
  ]);
  const fallbackId = `tabs-${createUniqueId()}`;
  const id = () => local.id ?? fallbackId;
  const orientation = () => local.orientation ?? "horizontal";
  const [value, setValue] = createControllableSignal<string | undefined>({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: (next) => next !== undefined && local.onChange?.(next),
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
    if (next === value()) local.onChange?.(next);
    else setValue(next);
  };

  effect(
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
    disabled: () => local.disabled ?? false,
    automatic: () => (local.activationMode ?? "automatic") === "automatic",
    collection,
    setList,
    register,
    triggerId: (key) => triggerIds()[key] ?? `${id()}-trigger-${key}`,
    contentId: (key) => contentIds()[key] ?? `${id()}-content-${key}`,
  };

  return (
    <TabsContext.Provider value={context}>
      <Polymorphic
        {...merge({ "data-slot": "tabs" }, others, {
          as: local.as,
          defaultAs: "div" as ValidComponent,
          get id() {
            return id();
          },
          get "data-orientation"() {
            return orientation();
          },
          get "data-layout"() {
            return local.layout ?? "stack";
          },
          get class() {
            return cn(TABS_LAYOUT[local.layout ?? "stack"], local.class);
          },
        })}
      />
    </TabsContext.Provider>
  );
};

type TabsListProps = ComponentProps<"div"> & { as?: ValidComponent };

const TabsList: Component<TabsListProps> = (props) => {
  const ctx = useTabs();
  const [local, others] = splitProps(props, ["class", "children", "ref", "as"]);
  const [el, setEl] = createSignal<HTMLElement>();
  onMount(() => {
    const listEl = el();
    if (listEl) onCleanup(trackScroll(listEl, "[data-selected]", ctx.value));
  });
  onCleanup(() => ctx.setList(undefined));

  effect(el, (node) => {
    if (!node) return;
    const keydown = (event: KeyboardEvent) => {
      const before = ctx.collection.highlighted();
      ctx.collection.onKeyDown(event);
      const after = ctx.collection.highlighted();
      if (after !== undefined && after !== before && ctx.automatic()) ctx.select(after);
    };
    node.addEventListener("keydown", keydown);
    return () => node.removeEventListener("keydown", keydown);
  });

  return (
    <Polymorphic
      {...merge({ "data-slot": "tabs-list" }, others, {
        as: local.as,
        defaultAs: "div" as ValidComponent,
        ref: (node: HTMLElement) => {
          setEl(node);
          ctx.setList(node);
          if (typeof local.ref === "function") local.ref(node as HTMLDivElement);
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
            local.class,
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
        {local.children}
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
  const [local, others] = splitProps(props, [
    "class",
    "icon",
    "inline",
    "children",
    "value",
    "disabled",
    "id",
    "ref",
    "as",
  ]);
  const [el, setEl] = createSignal<HTMLElement>();
  const disabled = () => local.disabled || ctx.disabled();
  effect(disabled, () => ctx.collection.refresh());
  onCleanup(() => ctx.collection.refresh());
  const selected = () => ctx.value() === local.value;

  effect(
    () => [local.value, local.id] as const,
    ([key, custom]) => ctx.register("trigger", key, custom),
  );

  effect(el, (node) => {
    if (!node) return;
    let mousePressed = false;
    const focused = trackFocus(node);
    const choose = () => {
      if (disabled()) return;
      ctx.select(local.value);
      ctx.collection.highlight(local.value, "pointer");
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
    const focus = () => ctx.collection.highlight(local.value, "pointer");
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
        as: local.as,
        defaultAs: "button" as ValidComponent,
        ref: (node: HTMLElement) => {
          setEl(node);
          if (typeof local.ref === "function") local.ref(node as HTMLButtonElement);
        },
        get id() {
          return ctx.triggerId(local.value);
        },
        role: "tab",
        get tabIndex() {
          return disabled() ? undefined : ctx.collection.tabIndex(local.value);
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
          return selected() ? ctx.contentId(local.value) : undefined;
        },
        get "data-key"() {
          return local.value;
        },
        get "data-orientation"() {
          return ctx.orientation();
        },
        get "data-selected"() {
          return selected() ? "" : undefined;
        },
        get "data-highlighted"() {
          return ctx.collection.highlighted() === local.value ? "" : undefined;
        },
        get "data-disabled"() {
          return disabled() ? "" : undefined;
        },
        get class() {
          return cn(
            SEGMENT_ITEM,
            PRESS_DIP,
            "not-data-[selected]:hover:text-foreground relative isolate data-[selected]:text-(--material-accent)",
            local.icon && !local.inline && "h-auto flex-1 flex-col gap-1 py-2 text-xs",
            local.class,
          );
        },
      })}
    >
      <SelectionHighlight active={selected()} />
      {local.icon && (
        <Icon
          data-slot={local.inline ? "tabs-trigger-inline-icon" : "tabs-trigger-icon"}
          icon={local.icon}
          width={local.inline ? 16 : 18}
          height={local.inline ? 16 : 18}
          aria-hidden="true"
        />
      )}
      {local.children}
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
  const [local, others] = splitProps(props, ["class", "value", "forceMount", "id", "ref", "as"]);
  const [el, setEl] = createSignal<HTMLElement>();
  const [holdsTabStop, setHoldsTabStop] = createSignal(false);
  const selected = () => ctx.value() === local.value;

  effect(
    () => [local.value, local.id] as const,
    ([key, custom]) => ctx.register("content", key, custom),
  );
  effect(el, (node) => {
    if (node) setHoldsTabStop(node.querySelector(CANDIDATES) !== null);
  });

  return (
    <Show when={local.forceMount || selected()}>
      <Polymorphic
        {...merge({ "data-slot": "tabs-content" }, others, {
          as: local.as,
          defaultAs: "div" as ValidComponent,
          ref: (node: HTMLElement) => {
            setEl(node);
            if (typeof local.ref === "function") local.ref(node as HTMLDivElement);
          },
          get id() {
            return ctx.contentId(local.value);
          },
          role: "tabpanel",
          get tabIndex() {
            return holdsTabStop() ? undefined : 0;
          },
          get "aria-labelledby"() {
            return ctx.triggerId(local.value);
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
              local.class,
            );
          },
        })}
      />
    </Show>
  );
};

export { Tabs, TabsContent, TabsList, TabsTrigger };
