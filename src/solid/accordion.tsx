import {
  type Accessor,
  type Component,
  type ComponentProps,
  createContext,
  createSignal,
  createUniqueId,
  type JSX,
  type ParentComponent,
  splitProps,
  useContext,
  type ValidComponent,
} from "solid-js";
import { claimKeys } from "../lib/behavior/claims.js";
import { type Collection, createCollection } from "../lib/behavior/collection.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { focusWithoutTracking, trackFocus } from "../lib/behavior/focus-scope.js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { callEventHandler, effect, merge } from "../lib/behavior/solid.js";
import { cn } from "../lib/utils.js";
import {
  CollapsibleContentRoot,
  CollapsibleRoot,
  CollapsibleTriggerRoot,
  useCollapsible,
} from "./collapsible.js";
import { Icon } from "./icon.js";

type AccordionProps = Omit<ComponentProps<"div">, "onChange"> & {
  as?: ValidComponent;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  multiple?: boolean;
  collapsible?: boolean;
  shouldFocusWrap?: boolean;
};

type AccordionItemProps = Omit<ComponentProps<"div">, "onChange"> & {
  as?: ValidComponent;
  value: string;
  disabled?: boolean;
  forceMount?: boolean;
};

type AccordionHeaderProps = ComponentProps<"h3"> & { as?: ValidComponent };
type AccordionTriggerProps = ComponentProps<"button"> & { as?: ValidComponent };
type AccordionContentProps = ComponentProps<"div"> & { as?: ValidComponent };

interface AccordionContextValue {
  rootId: Accessor<string>;
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
  collection: Collection;
}

interface AccordionItemContextValue {
  value: Accessor<string>;
  itemId: Accessor<string>;
  triggerId: Accessor<string | undefined>;
  setTriggerId: (id: string | undefined) => void;
}

const AccordionContext = createContext<AccordionContextValue>();
const AccordionItemContext = createContext<AccordionItemContextValue>();

function useAccordion(): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("An accordion part renders inside an Accordion");
  return ctx;
}

function useAccordionItem(): AccordionItemContextValue {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) throw new Error("An accordion part renders inside an AccordionItem");
  return ctx;
}

const NAVIGATION_KEYS = new Set(["ArrowDown", "ArrowUp", "Home", "End"]);
const NAVIGATION_CLAIM = claimKeys(NAVIGATION_KEYS);
const ESCAPE_CLAIM = claimKeys(["Escape"]);

const AccordionRoot: Component<AccordionProps> = (props) => {
  const fallbackId = `accordion-${createUniqueId()}`;
  const [local, others] = splitProps(props, [
    "as",
    "ref",
    "value",
    "defaultValue",
    "onChange",
    "multiple",
    "collapsible",
    "shouldFocusWrap",
  ]);
  const [value, setValue] = createControllableSignal<string[]>({
    value: () => local.value,
    defaultValue: () => local.defaultValue ?? [],
    onChange: (next) => local.onChange?.(next),
  });
  const mayEmpty = () => !!local.multiple || !!local.collapsible;
  const [el, setEl] = createSignal<HTMLElement>();
  const collection = createCollection({
    root: el,
    itemSelector: "[data-key]",
    orientation: () => "vertical",
    focus: "roving",
    loop: () => local.shouldFocusWrap ?? true,
    claimsKeys: false,
  });

  const toggle = (item: string) => {
    const current = value();
    if (current.includes(item)) {
      if (local.multiple) setValue(current.filter((v) => v !== item));
      else if (local.collapsible) setValue([]);
    } else setValue(local.multiple ? [...current, item] : [item]);
  };

  effect(el, (node) => {
    if (!node) return;
    const keydown = (event: KeyboardEvent) => {
      const onTrigger = event.target instanceof HTMLElement && event.target.matches("[data-key]");
      if (onTrigger && NAVIGATION_KEYS.has(event.key)) return collection.onKeyDown(event);
      if (event.key !== "Escape" || event.defaultPrevented || !mayEmpty()) return;
      if (value().length === 0) return;
      event.preventDefault();
      setValue([]);
    };
    node.addEventListener("keydown", keydown);
    return () => node.removeEventListener("keydown", keydown);
  });

  const ctx: AccordionContextValue = {
    rootId: () => others.id ?? fallbackId,
    isOpen: (item) => value().includes(item),
    toggle,
    collection,
  };

  return (
    <AccordionContext.Provider value={ctx}>
      <Polymorphic
        {...merge({ id: fallbackId }, others, {
          as: local.as,
          defaultAs: "div" as ValidComponent,
          ref: (node: HTMLElement) => {
            setEl(node);
            if (typeof local.ref === "function") local.ref(node as HTMLDivElement);
          },
          get "data-claim"() {
            return mayEmpty() && value().length > 0 ? ESCAPE_CLAIM : undefined;
          },
        })}
      />
    </AccordionContext.Provider>
  );
};

const AccordionItemRoot: Component<AccordionItemProps> = (props) => {
  const accordion = useAccordion();
  const fallbackId = `${accordion.rootId()}-item-${createUniqueId()}`;
  const [local, others] = splitProps(props, ["value", "disabled"]);
  const [triggerId, setTriggerId] = createSignal<string>();
  const itemId = () => others.id ?? fallbackId;

  return (
    <AccordionItemContext.Provider
      value={{ value: () => local.value, itemId, triggerId, setTriggerId }}
    >
      <CollapsibleRoot
        {...merge({ id: fallbackId }, others, {
          get open() {
            return accordion.isOpen(local.value);
          },
          onOpenChange: () => accordion.toggle(local.value),
          get disabled() {
            return local.disabled;
          },
        })}
      />
    </AccordionItemContext.Provider>
  );
};

const AccordionHeader: Component<AccordionHeaderProps> = (props) => {
  const collapsible = useCollapsible();
  const [local, others] = splitProps(props, ["as"]);
  return (
    <Polymorphic
      {...merge(collapsible.markers, others, { as: local.as, defaultAs: "h3" as ValidComponent })}
    />
  );
};

const AccordionTriggerRoot: Component<AccordionTriggerProps> = (props) => {
  const accordion = useAccordion();
  const item = useAccordionItem();
  const collapsible = useCollapsible();
  const [local, others] = splitProps(props, ["ref", "onClick"]);
  const [el, setEl] = createSignal<HTMLElement>();
  const id = () => others.id ?? `${item.itemId()}-trigger`;
  effect(id, (value) => {
    item.setTriggerId(value);
    return () => item.setTriggerId(undefined);
  });

  let focused: ReturnType<typeof trackFocus> | undefined;
  effect(el, (node) => {
    if (!node) return;
    const tracked = trackFocus(node);
    focused = tracked;
    const focus = () => accordion.collection.highlight(item.value(), "pointer");
    node.addEventListener("focus", focus);
    return () => {
      tracked.stop();
      node.removeEventListener("focus", focus);
    };
  });

  const click: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (event) => {
    callEventHandler(event, local.onClick);
    // WebKit leaves a clicked button unfocused, and the arrows move from the focused trigger.
    const node = el();
    if (node && !collapsible.disabled() && !focused?.has()) focusWithoutTracking(node);
  };

  return (
    <CollapsibleTriggerRoot
      {...merge(
        {
          get "data-key"() {
            return item.value();
          },
          "data-claim": NAVIGATION_CLAIM,
        },
        others,
        {
          get id() {
            return id();
          },
          onClick: click,
          ref: (node: HTMLButtonElement) => {
            setEl(node);
            if (typeof local.ref === "function") local.ref(node);
          },
        },
      )}
    />
  );
};

const CONTENT_VARS = {
  "--accordion-content-height": "var(--collapsible-content-height)",
  "--accordion-content-width": "var(--collapsible-content-width)",
  "--kb-accordion-content-height": "var(--kb-collapsible-content-height)",
  "--kb-accordion-content-width": "var(--kb-collapsible-content-width)",
};

const CONTENT_VARS_CSS = Object.entries(CONTENT_VARS)
  .map(([name, value]) => `${name}:${value};`)
  .join("");

const AccordionContentRoot: Component<AccordionContentProps> = (props) => {
  const item = useAccordionItem();
  const [local, others] = splitProps(props, ["style"]);
  return (
    <CollapsibleContentRoot
      {...merge(
        {
          role: "region" as const,
          get "aria-labelledby"() {
            return item.triggerId();
          },
          get style() {
            return typeof local.style === "string"
              ? `${CONTENT_VARS_CSS}${local.style}`
              : { ...CONTENT_VARS, ...local.style };
          },
        },
        others,
      )}
    />
  );
};

const Accordion = Object.assign(AccordionRoot, {
  Root: AccordionRoot,
  Item: AccordionItemRoot,
  Header: AccordionHeader,
  Trigger: AccordionTriggerRoot,
  Content: AccordionContentRoot,
});

const AccordionItem: Component<AccordionItemProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <AccordionItemRoot
      data-slot="accordion-item"
      class={cn("border-b last:border-b-0", local.class)}
      {...rest}
    />
  );
};

const AccordionTrigger: ParentComponent<AccordionTriggerProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <AccordionHeader class="flex">
      <AccordionTriggerRoot
        data-slot="accordion-trigger"
        class={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all duration-(--duration-state) outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-expanded]>[data-slot=icon]]:rotate-180",
          local.class,
        )}
        {...rest}
      >
        {local.children}
        <Icon
          icon="lucide:chevron-down"
          width={16}
          height={16}
          class="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-(--duration-expand)"
        />
      </AccordionTriggerRoot>
    </AccordionHeader>
  );
};

const AccordionContent: ParentComponent<AccordionContentProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <AccordionContentRoot
      data-slot="accordion-content"
      class="data-[closed]:animate-accordion-up data-[expanded]:animate-accordion-down overflow-hidden text-sm duration-(--duration-expand) [interpolate-size:allow-keywords]"
      {...rest}
    >
      <div class={cn("pt-0 pb-4", local.class)}>{local.children}</div>
    </AccordionContentRoot>
  );
};

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
