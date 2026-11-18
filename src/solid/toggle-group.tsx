import type { VariantProps } from "cva";
import {
  type Accessor,
  children,
  type Component,
  type ComponentProps,
  createContext,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  type ParentComponent,
  Show,
  splitProps,
  useContext,
  type ValidComponent,
} from "solid-js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { merge, omit } from "../lib/behavior/solid.js";
import { BALANCE_CONTENT, BALANCED_ROWS, balanceRows } from "../lib/balance-rows.js";
import { TRACK_SURFACE } from "../lib/card-classes.js";
import { SCROLL_TRACK_FADE, trackScroll } from "../lib/scroll-track.js";
import { SEGMENT_RADIUS } from "../lib/segment-classes.js";
import { createToggleItem, createToggleSet, type ToggleSet } from "../lib/toggle-set.js";
import { cn } from "../lib/utils.js";
import { SelectionHighlight, SelectionScope } from "./selection.js";
import { toggleVariants } from "./toggle.js";

type Orientation = "horizontal" | "vertical";

type SingleSelection = {
  multiple?: false;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
};

type MultipleSelection = {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
};

type ToggleGroupProps = Omit<ComponentProps<"div">, "onChange"> &
  VariantProps<typeof toggleVariants> &
  (SingleSelection | MultipleSelection) & {
    as?: ValidComponent;
    orientation?: Orientation;
    disabled?: boolean;
    /** CSS colour for the selected segment's glass. Default `var(--material-accent)`. */
    tone?: string;
    /** One row that scrolls sideways when it outgrows its container, instead of wrapping. */
    scroll?: boolean;
  };

// Single-select paints the pressed segment with the selection highlight; multi-select has none.
type ToggleGroupContextValue = VariantProps<typeof toggleVariants> & {
  sliding: boolean;
  disabled: Accessor<boolean>;
  set: ToggleSet;
};

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

const useToggleGroup = (): ToggleGroupContextValue => {
  const ctx = useContext(ToggleGroupContext);
  if (!ctx) throw new Error("ToggleGroupItem renders inside a ToggleGroup");
  return ctx;
};

const ITEM = '[data-slot="toggle-group-item"]';

const toList = (value: string | string[] | null | undefined): string[] | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return [];
  return typeof value === "string" ? [value] : value;
};

const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const ToggleGroup: ParentComponent<ToggleGroupProps> = (props) => {
  const rest = omit(
    props,
    "class",
    "variant",
    "size",
    "tone",
    "scroll",
    "children",
    "value",
    "defaultValue",
    "onChange",
    "multiple",
    "orientation",
    "disabled",
    "id",
    "ref",
    "as",
  );
  const sliding = () => !props.multiple;
  const orientation = () => props.orientation ?? "horizontal";
  const vertical = () => orientation() === "vertical";
  const [values, setValues] = createControllableSignal<string[]>({
    value: () => toList(props.value),
    defaultValue: () => toList(props.defaultValue) ?? [],
    equals: sameList,
    onChange: (next) => {
      if (props.multiple) props.onChange?.(next);
      else props.onChange?.(next[0] ?? null);
    },
  });
  const [root, setRoot] = createSignal<HTMLElement>();
  const [scope, setScope] = createSignal<HTMLElement>();
  const set = createToggleSet({
    root,
    itemSelector: `${ITEM}[data-key]`,
    values,
    setValues,
    multiple: () => props.multiple ?? false,
    orientation,
    id: () => props.id,
  });

  onMount(() => {
    const el = root();
    if (!el) return;
    if (props.scroll) onCleanup(trackScroll(el, "[data-pressed]", values));
    else if (!vertical()) onCleanup(balanceRows(el, scope() ?? el, ITEM, set.members));
  });

  const context: ToggleGroupContextValue = {
    get variant() {
      return props.variant;
    },
    get size() {
      return props.size;
    },
    get sliding() {
      return sliding();
    },
    disabled: () => props.disabled ?? false,
    set,
  };

  return (
    <Polymorphic
      {...merge({ "data-slot": "toggle-group" }, rest, {
        as: props.as,
        defaultAs: "div" as ValidComponent,
        ref: (el: HTMLElement) => {
          setRoot(el);
          if (typeof props.ref === "function") props.ref(el as HTMLDivElement);
        },
        role: "group",
        get id() {
          return set.id();
        },
        get "data-orientation"() {
          return orientation();
        },
        get "data-variant"() {
          return props.variant;
        },
        get "data-size"() {
          return props.size;
        },
        get "data-scroll"() {
          return props.scroll ? "" : undefined;
        },
        get [BALANCED_ROWS]() {
          return props.scroll || vertical() || sliding() ? undefined : "";
        },
        "on:keydown": (event: KeyboardEvent) => set.collection.onKeyDown(event),
        get class() {
          return cn(
            `group/toggle-group w-fit max-w-full items-center gap-y-1 rounded-lg data-[wrapped]:w-full ${TRACK_SURFACE} p-1 data-[variant=outline]:shadow-xs`,
            props.scroll
              ? `flex [scrollbar-width:none] flex-nowrap overflow-x-auto ${SCROLL_TRACK_FADE}`
              : vertical()
                ? "flex flex-col items-stretch"
                : sliding()
                  ? "flex"
                  : undefined,
            props.class,
          );
        },
      })}
    >
      <ToggleGroupContext.Provider value={context}>
        <Show when={sliding()} fallback={props.children}>
          {/* w-full, not w-fit: a shrink-to-fit root still sizes to content, and a
					    `class="w-full"` root can finally let its items share the width. */}
          <SelectionScope
            ref={setScope}
            marker="pressed"
            radius={SEGMENT_RADIUS}
            tone={props.tone}
            {...{ [BALANCED_ROWS]: props.scroll || vertical() ? undefined : "" }}
            class={
              props.scroll
                ? "flex w-max flex-nowrap items-center"
                : vertical()
                  ? "flex w-full flex-col items-stretch gap-y-0.5"
                  : "w-full items-center gap-y-1"
            }
          >
            {props.children}
          </SelectionScope>
        </Show>
      </ToggleGroupContext.Provider>
    </Polymorphic>
  );
};

type ToggleGroupItemState = { pressed: Accessor<boolean> };

type ToggleGroupItemProps = Omit<ComponentProps<"button">, "children"> &
  VariantProps<typeof toggleVariants> & {
    as?: ValidComponent;
    value: string;
    disabled?: boolean;
    children?: JSX.Element | ((state: ToggleGroupItemState) => JSX.Element);
  };

const ToggleGroupItem: Component<ToggleGroupItemProps> = (props) => {
  const context = useToggleGroup();
  const [local, rest] = splitProps(props, [
    "class",
    "variant",
    "size",
    "children",
    "value",
    "disabled",
    "id",
    "ref",
    "as",
  ]);
  const disabled = () => local.disabled || context.disabled();
  const item = createToggleItem(context.set, { value: () => local.value, disabled });
  const content = children(() => {
    const body = local.children;
    return typeof body === "function" ? body({ pressed: item.pressed }) : body;
  });

  return (
    <Polymorphic
      {...merge({ "data-slot": "toggle-group-item" }, rest, item.props, {
        as: local.as,
        defaultAs: "button" as ValidComponent,
        ref: (node: HTMLElement) => {
          item.ref(node);
          if (typeof local.ref === "function") local.ref(node as HTMLButtonElement);
        },
        get id() {
          return local.id ?? item.props.id;
        },
        get "data-variant"() {
          return context.variant || local.variant;
        },
        get "data-size"() {
          return context.size || local.size;
        },
        get class() {
          return cn(
            toggleVariants({
              variant: context.variant || local.variant,
              size: context.size || local.size,
            }),
            "relative isolate min-w-max flex-1 shrink-0 rounded-md px-4 shadow-none focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first-of-type:border-l",
            // A hover fill would read as a second, squarer selection, so hover only tints the text.
            context.sliding
              ? "hover:text-(--material-accent)"
              : "data-[pressed]:bg-muted data-[pressed]:text-foreground not-data-[pressed]:hover:text-(--material-accent)",
            local.class,
          );
        },
      })}
    >
      <SelectionHighlight active={item.pressed()} />
      <span {...{ [BALANCE_CONTENT]: "" }}>{content()}</span>
    </Polymorphic>
  );
};

export { ToggleGroup, ToggleGroupItem };
