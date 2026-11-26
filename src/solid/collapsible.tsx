import {
  type Accessor,
  type Component,
  createContext,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  onSettled,
  Show,
  omit,
  createEffect,
  merge,
} from "solid-js";
import { useRequired } from "../lib/context.js";
import { type ComponentProps, type ValidComponent } from "@solidjs/web";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { createPresence } from "../lib/behavior/presence.js";
import { callEventHandler } from "../lib/behavior/solid.js";
import { MOTION_EXIT_MS } from "../lib/motion-classes.js";
import { cn } from "../lib/utils.js";

type CollapsibleProps = Omit<ComponentProps<"div">, "onChange"> & {
  as?: ValidComponent;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  forceMount?: boolean;
};

type CollapsibleTriggerProps = ComponentProps<"button"> & { as?: ValidComponent };

type CollapsibleContentProps = ComponentProps<"div"> & { as?: ValidComponent };

type Markers = Record<"data-expanded" | "data-closed" | "data-disabled", "" | undefined>;

interface CollapsibleContextValue {
  open: Accessor<boolean>;
  disabled: Accessor<boolean>;
  forceMount: Accessor<boolean>;
  markers: Markers;
  toggle: () => void;
  defaultContentId: Accessor<string>;
  controls: Accessor<string | undefined>;
  registerContent: (id: string) => () => void;
}

const CollapsibleContext = createContext<CollapsibleContextValue>();

export function useCollapsible(): CollapsibleContextValue {
  const ctx = useRequired(CollapsibleContext, "A collapsible part", "Collapsible");
  return ctx;
}

const SIZE_VARS = {
  height: ["--collapsible-content-height", "--kb-collapsible-content-height"],
  width: ["--collapsible-content-width", "--kb-collapsible-content-width"],
} as const;

function freeze(node: HTMLElement, still: boolean) {
  node.style.transitionDuration = still ? "0s" : "";
  node.style.animationName = still ? "none" : "";
}

function writeSize(node: HTMLElement) {
  const box = node.getBoundingClientRect();
  for (const side of ["height", "width"] as const) {
    for (const name of SIZE_VARS[side]) {
      if (box[side]) node.style.setProperty(name, `${box[side]}px`);
      else node.style.removeProperty(name);
    }
  }
}

export const CollapsibleRoot: Component<CollapsibleProps> = (props) => {
  const fallbackId = `collapsible-${createUniqueId()}`;
  const others = omit(props, "as", "open", "defaultOpen", "onOpenChange", "disabled", "forceMount");
  const [state, setOpen] = createControllableSignal<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (next) => props.onOpenChange?.(next),
  });
  // An accordion item's open state derives from the whole selection; a sibling's change must not wake it.
  const open = createMemo(state);
  const disabled = () => props.disabled ?? false;
  const [content, setContent] = createSignal<string>();

  const ctx: CollapsibleContextValue = {
    open,
    disabled,
    forceMount: () => props.forceMount ?? false,
    markers: {
      get "data-expanded"() {
        return open() ? "" : undefined;
      },
      get "data-closed"() {
        return open() ? undefined : "";
      },
      get "data-disabled"() {
        return disabled() ? "" : undefined;
      },
    },
    toggle: () => setOpen(!open()),
    defaultContentId: () => `${others.id ?? fallbackId}-content`,
    controls: () => (open() ? content() : undefined),
    registerContent: (id) => {
      setContent(id);
      return () => setContent((current) => (current === id ? undefined : current));
    },
  };

  return (
    <CollapsibleContext value={ctx}>
      <Polymorphic
        {...merge({ id: fallbackId }, ctx.markers, others, {
          as: props.as,
          defaultAs: "div" as ValidComponent,
        })}
      />
    </CollapsibleContext>
  );
};

export const CollapsibleTriggerRoot: Component<CollapsibleTriggerProps> = (props) => {
  const ctx = useCollapsible();
  const others = omit(props, "as", "ref", "onClick");
  const [el, setEl] = createSignal<HTMLElement>();
  const native = () => (props.as ?? "button") === "button";

  // Bound on the element: a delegated handler never hears a press inside a closed shadow root.
  createEffect(el, (node) => {
    if (!node) return;
    const click = (event: MouseEvent) => {
      callEventHandler(
        event as MouseEvent & { currentTarget: HTMLButtonElement; target: Element },
        props.onClick,
      );
      if (!ctx.disabled()) ctx.toggle();
    };
    node.addEventListener("click", click);
    return () => node.removeEventListener("click", click);
  });

  return (
    <Polymorphic
      {...merge(
        {
          get "aria-expanded"() {
            return ctx.open() ? "true" : "false";
          },
          get "aria-controls"() {
            return ctx.controls();
          },
          get role() {
            return native() ? undefined : "button";
          },
          get tabIndex() {
            return native() || ctx.disabled() ? undefined : 0;
          },
          get disabled() {
            return native() ? ctx.disabled() : undefined;
          },
          get "aria-disabled"() {
            return !native() && ctx.disabled() ? "true" : undefined;
          },
          get "data-disabled"() {
            return ctx.disabled() ? "" : undefined;
          },
          get "data-expanded"() {
            return ctx.open() ? "" : undefined;
          },
          get "data-closed"() {
            return ctx.open() ? undefined : "";
          },
        },
        others,
        {
          as: props.as,
          defaultAs: "button" as ValidComponent,
          ref: (node: HTMLElement) => {
            setEl(node);
            if (typeof props.ref === "function") props.ref(node as HTMLButtonElement);
          },
        },
      )}
    />
  );
};

export const CollapsibleContentRoot: Component<CollapsibleContentProps> = (props) => {
  const ctx = useCollapsible();
  const others = omit(props, "as", "ref", "id");
  const id = () => props.id || ctx.defaultContentId();
  createEffect(id, (value) => ctx.registerContent(value));

  const [el, setEl] = createSignal<HTMLElement>();
  const presence = createPresence({
    present: ctx.open,
    element: el,
    exitMs: MOTION_EXIT_MS.disclosure,
    keep: ctx.forceMount,
  });

  // Open from the start, the content shows at once: its motion stays off until it first closes.
  let still = ctx.open();
  onSettled(() => {
    const frame = requestAnimationFrame(() => (still = false));
    return () => cancelAnimationFrame(frame);
  });

  createEffect(
    () => [el(), ctx.open()] as const,
    ([node, open]) => {
      if (!node) return;
      if (!open) return freeze(node, false);
      freeze(node, true);
      writeSize(node);
      if (!still) freeze(node, false);
    },
  );

  const Panel: Component = () => {
    onCleanup(() => setEl(undefined));
    return (
      <Polymorphic
        {...merge(ctx.markers, others, {
          as: props.as,
          defaultAs: "div" as ValidComponent,
          get id() {
            return id();
          },
          ref: (node: HTMLElement) => {
            setEl(node);
            if (typeof props.ref === "function") props.ref(node as HTMLDivElement);
          },
        })}
      />
    );
  };

  return (
    <Show when={presence.mounted()}>
      <Panel />
    </Show>
  );
};

const Collapsible: Component<CollapsibleProps> = (props) => {
  return <CollapsibleRoot data-slot="collapsible" {...props} />;
};

const CollapsibleTrigger: Component<CollapsibleTriggerProps> = (props) => {
  const rest = omit(props, "class");
  return (
    <CollapsibleTriggerRoot
      data-slot="collapsible-trigger"
      class={cn("cursor-pointer py-3", props.class)}
      {...rest}
    />
  );
};

const CollapsibleContent: Component<CollapsibleContentProps> = (props) => {
  const rest = omit(props, "class");
  return (
    <CollapsibleContentRoot
      data-slot="collapsible-content"
      class={cn(
        "data-closed:animate-collapsible-up data-expanded:animate-collapsible-down overflow-hidden",
        props.class,
      )}
      {...rest}
    />
  );
};

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
