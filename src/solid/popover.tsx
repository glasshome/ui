import {
  type Accessor,
  type Component,
  createContext,
  createSignal,
  createUniqueId,
  onCleanup,
  omit,
  untrack,
  useContext,
  createEffect,
  merge,
  onFlush,
} from "solid-js";
import { useRequired } from "../lib/context.js";
import { type ComponentProps, type JSX, type ValidComponent } from "@solidjs/web";
import { Layer } from "../lib/behavior/layer.js";
import { type Align, controlRadius, type Side } from "../lib/anchor-placement.js";
import { createAnchored } from "../lib/behavior/anchored.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { createDismiss } from "../lib/behavior/dismiss.js";
import {
  createFocusScope,
  focusedIn,
  focusFell,
  focusWithoutTracking,
} from "../lib/behavior/focus-scope.js";
import { createHideOutside } from "../lib/behavior/hide-outside.js";
import { registerLayer } from "../lib/behavior/layer-stack.js";
import { createSlot } from "../lib/behavior/slot.js";
import {
  type FocusOutsideEvent,
  type InteractOutsideEvent,
  interactOutside,
  type PointerDownOutsideEvent,
  vetoed,
} from "../lib/behavior/modal-root.js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { callEventHandler, forwardRef } from "../lib/behavior/solid.js";
import { createPresence } from "../lib/behavior/presence.js";
import { INPUT_SURFACE } from "../lib/input-classes.js";
import { nestedLayerAttrs, Z_CLASS } from "../lib/layers.js";
import { FIELD_MOTION, MORPH_MOTION, MOTION_EXIT_MS } from "../lib/motion-classes.js";
import { FLOATING_PANEL } from "../lib/overlay-classes.js";
import { inShadowRoot } from "../lib/shadow-layer.js";
import { cn } from "../lib/utils.js";
import { usePortalMount } from "./portal-mount.js";

type PopoverSurface = "overlay" | "field";
type Placement = Side | `${Side}-${Exclude<Align, "center">}`;

const ANCHOR_WIDTH = "--kb-popper-anchor-width";

/* The expanding field panel: opaque (the trigger sits underneath it), bound to
 * the anchor width and radius, and padded by whatever part needs padding, never
 * by the panel, so the panel edge and the trigger edge are one rectangle. */
const FIELD_PANEL = `${INPUT_SURFACE} ${FIELD_MOTION} relative ${Z_CLASS.overlay} w-[var(--kb-popper-anchor-width)] overflow-hidden rounded-md text-popover-foreground outline-hidden`;

const OVERLAY_PANEL = `${FLOATING_PANEL} ${MORPH_MOTION} w-72 p-4`;

interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hides the page from assistive technology and keeps Tab inside the panel. */
  modal?: boolean;
  /** "field" anchors the panel over the trigger's top edge, so the field reads
   *  as expanding into its panel instead of a box dropping in below it. */
  surface?: PopoverSurface;
  placement?: Placement;
  gutter?: number;
  anchorRef?: Accessor<HTMLElement | undefined>;
  children?: JSX.Element;
}

interface PopoverContextValue {
  isOpen: Accessor<boolean>;
  setOpen: (open: boolean) => void;
  modal: Accessor<boolean>;
  surface: Accessor<PopoverSurface>;
  side: Accessor<Side>;
  align: Accessor<Align>;
  gutter: Accessor<number>;
  anchor: Accessor<HTMLElement | undefined>;
  setAnchor: (el: HTMLElement | undefined) => void;
  trigger: Accessor<HTMLElement | undefined>;
  setTrigger: (el: HTMLElement | undefined) => void;
  releaseTrigger: (el: HTMLElement) => void;
  contentId: Accessor<string | undefined>;
  setContentId: (id: string | undefined) => void;
  titleId: Accessor<string | undefined>;
  setTitleId: (id: string | undefined) => void;
  descriptionId: Accessor<string | undefined>;
  setDescriptionId: (id: string | undefined) => void;
}

const PopoverContext = createContext<PopoverContextValue>();

const usePopover = (): PopoverContextValue => {
  const ctx = useRequired(PopoverContext, "Popover parts", "Popover");
  return ctx;
};

const PopoverRoot: Component<PopoverProps> = (props) => {
  const [isOpen, setOpen] = createControllableSignal<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (next) => props.onOpenChange?.(next),
  });
  const [anchor, setAnchor] = createSignal<HTMLElement>();
  const [trigger, setTrigger, releaseTrigger] = createSlot<HTMLElement>();
  const [contentId, setContentId] = createSignal<string>();
  const [titleId, setTitleId] = createSignal<string>();
  const [descriptionId, setDescriptionId] = createSignal<string>();
  const placement = () => (props.placement ?? "bottom").split("-") as [Side, Align?];
  const value: PopoverContextValue = {
    isOpen,
    setOpen,
    modal: () => props.modal ?? false,
    surface: () => props.surface ?? "overlay",
    side: () => placement()[0],
    align: () => placement()[1] ?? "center",
    gutter: () => props.gutter ?? 0,
    anchor: () => props.anchorRef?.() ?? anchor(),
    setAnchor: (el) => setAnchor(el),
    trigger,
    setTrigger,
    releaseTrigger,
    contentId,
    setContentId,
    titleId,
    setTitleId,
    descriptionId,
    setDescriptionId,
  };
  return <PopoverContext value={value}>{props.children}</PopoverContext>;
};

type PartProps<T extends ValidComponent> = { as?: T } & Omit<ComponentProps<T>, "as">;

const expandedAttrs = (open: Accessor<boolean>) => ({
  get "data-expanded"() {
    return open() ? "" : undefined;
  },
  get "data-closed"() {
    return open() ? undefined : "";
  },
});

function PopoverTrigger<T extends ValidComponent = "button">(props: PartProps<T>): JSX.Element {
  const ctx = usePopover();
  const rest = omit(props as PartProps<ValidComponent>, "as", "ref");
  const [own, setOwn] = createSignal<HTMLElement>();
  onCleanup(() => {
    const el = untrack(own);
    if (el) ctx.releaseTrigger(el);
  });
  createEffect(own, (el) => {
    if (!el) return;
    // A press never focuses the trigger, so focus stays where the panel left it.
    const down = (event: PointerEvent) => event.preventDefault();
    const click = () => ctx.setOpen(!untrack(ctx.isOpen));
    el.addEventListener("pointerdown", down);
    el.addEventListener("click", click);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("click", click);
    };
  });
  return (
    <Polymorphic
      {...merge(
        { "data-slot": "popover-trigger", "data-claim": "prevent:pointerdown" },
        rest,
        expandedAttrs(ctx.isOpen),
        {
          as: props.as,
          defaultAs: "button" as ValidComponent,
          ref: (el: HTMLElement) => {
            setOwn(el);
            ctx.setTrigger(el);
            forwardRef(() => props.ref, el);
          },
          "aria-haspopup": "dialog",
          get "aria-expanded"() {
            return ctx.isOpen() ? "true" : "false";
          },
          get "aria-controls"() {
            return ctx.isOpen() ? ctx.contentId() : undefined;
          },
        },
      )}
    />
  );
}

/** Inside a PopoverAnchor: names the control that opens the popover, so focus goes back to it on close. */
const AnchorTriggerContext = createContext<((el: HTMLElement) => void) | null>(null);

function PopoverAnchor<T extends ValidComponent = "div">(props: PartProps<T>): JSX.Element {
  const ctx = usePopover();
  const rest = omit(props as PartProps<ValidComponent>, "as", "ref");
  onCleanup(() => ctx.setAnchor(undefined));
  return (
    <AnchorTriggerContext value={ctx.setTrigger}>
      <Polymorphic
        {...merge({ "data-slot": "popover-anchor" }, rest, expandedAttrs(ctx.isOpen), {
          as: props.as,
          defaultAs: "div" as ValidComponent,
          ref: (el: HTMLElement) => {
            ctx.setAnchor(el);
            forwardRef(() => props.ref, el);
          },
        })}
      />
    </AnchorTriggerContext>
  );
}

/** The control, inside a PopoverAnchor, that opens its popover. */
const useAnchorTrigger = () => useContext(AnchorTriggerContext) ?? undefined;

interface PopoverContentProps extends Omit<ComponentProps<"div">, "ref"> {
  surface?: PopoverSurface;
  ref?: HTMLElement | ((el: HTMLElement) => void);
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void;
  onFocusOutside?: (event: FocusOutsideEvent) => void;
  onInteractOutside?: (event: InteractOutsideEvent) => void;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
}

const PopoverContent: Component<PopoverContentProps> = (props) => {
  const ctx = usePopover();
  const rest = omit(
    props,
    "class",
    "surface",
    "ref",
    "id",
    "onEscapeKeyDown",
    "onPointerDownOutside",
    "onFocusOutside",
    "onInteractOutside",
    "onOpenAutoFocus",
    "onCloseAutoFocus",
  );
  const surface = () => props.surface ?? ctx.surface();
  const fallbackId = createUniqueId();
  const id = () => props.id || fallbackId;
  createEffect(id, (next) => {
    ctx.setContentId(next);
    return () => ctx.setContentId(undefined);
  });

  const mount = usePortalMount();
  // In a shadow root, hiding the page outside the panel would hide the realm's host, panel included.
  const modal = () => ctx.modal() && !inShadowRoot(mount);
  const [panel, setPanel] = createSignal<HTMLElement>();
  const presence = createPresence({
    present: ctx.isOpen,
    element: panel,
    get exitMs() {
      return surface() === "field" ? MOTION_EXIT_MS.field : MOTION_EXIT_MS.anchored;
    },
  });

  const handle = registerLayer({
    element: panel,
    open: ctx.isOpen,
    kind: "popover",
    escape: () => true,
    dismiss: () => ctx.setOpen(false),
    trigger: ctx.trigger,
    blockPointer: modal,
  });
  const covered = () => ctx.isOpen() && handle.above().some((layer) => layer.kind === "modal");

  let closedOutside = false;
  createDismiss({
    layer: handle,
    escapeFrom: "document",
    focusOutside: () => !modal(),
    onDismiss: (reason, original) => {
      if (reason === "escape") {
        if (vetoed(props.onEscapeKeyDown, original as KeyboardEvent)) return;
      } else {
        closedOutside = true;
        const event = interactOutside(original as PointerEvent | FocusEvent, (e) => {
          if (reason === "outside-press")
            props.onPointerDownOutside?.(e as PointerDownOutsideEvent);
          else props.onFocusOutside?.(e as FocusOutsideEvent);
          props.onInteractOutside?.(e);
        });
        if (event.defaultPrevented) {
          closedOutside = false;
          return;
        }
      }
      ctx.setOpen(false);
      onFlush(() => {
        // A controlled `open` refused the close.
        if (untrack(ctx.isOpen)) closedOutside = false;
      });
    },
  });

  createHideOutside({ layer: handle, active: () => ctx.isOpen() && modal() });

  createAnchored({
    anchor: () => ctx.anchor() ?? ctx.trigger(),
    floating: panel,
    open: ctx.isOpen,
    side: ctx.side,
    align: ctx.align,
    offset: untrack(ctx.gutter),
    coverAnchor: true,
    widthVar: ANCHOR_WIDTH,
  });

  const [scoping, setScoping] = createSignal(false);
  const scope = createFocusScope({
    container: panel,
    active: scoping,
    trapped: modal,
    initialFocus: (container) => {
      if (!vetoed(props.onOpenAutoFocus, new Event("openautofocus", { cancelable: true })))
        return null;
      const active = focusedIn(container);
      return active instanceof HTMLElement && container.contains(active) ? active : container;
    },
  });

  createEffect(
    () => ctx.isOpen() && panel() !== undefined,
    (open) => {
      if (open) {
        closedOutside = false;
        setScoping(true);
        return;
      }
      if (!untrack(scoping)) return;
      const outside = closedOutside;
      closedOutside = false;
      scope.skipRestore();
      setScoping(false);
      if (vetoed(props.onCloseAutoFocus, new Event("closeautofocus", { cancelable: true }))) return;
      const trigger = untrack(ctx.trigger);
      const from = untrack(panel);
      if (!trigger || !from) return;
      if (!outside) {
        queueMicrotask(() => focusWithoutTracking(trigger));
        return;
      }
      // After the press's own focus change: the trigger takes focus only if nothing else did.
      setTimeout(() => {
        if (trigger.isConnected && focusFell(from)) focusWithoutTracking(trigger);
      }, 0);
    },
  );

  // The morph starts as the trigger's box (pill radius clamped to h/2). A
  // field picker has an Anchor, not a Trigger, and keeps its clip reveal.
  const writeMorphStart = (el: HTMLElement) => {
    const trigger = ctx.trigger();
    if (!trigger || surface() === "field") return;
    const height = trigger.getBoundingClientRect().height;
    el.style.setProperty("--morph-h", `${height}px`);
    el.style.setProperty("--morph-radius", controlRadius(height));
  };

  const Panel: Component = () => {
    onCleanup(() => setPanel(undefined));
    return (
      <div
        {...nestedLayerAttrs(modal() || covered())}
        {...rest}
        ref={(el) => {
          setPanel(el);
          untrack(() => writeMorphStart(el));
          forwardRef(() => props.ref, el);
        }}
        id={id()}
        role="dialog"
        tabindex={-1}
        aria-labelledby={ctx.titleId()}
        aria-describedby={ctx.descriptionId()}
        data-slot="popover-content"
        data-surface={surface()}
        data-expanded={ctx.isOpen() ? "" : undefined}
        data-closed={ctx.isOpen() ? undefined : ""}
        class={cn(surface() === "field" ? FIELD_PANEL : OVERLAY_PANEL, props.class)}
      />
    );
  };

  return (
    <Layer mount={mount} when={presence.mounted()}>
      <Panel />
    </Layer>
  );
};

function labelPart(
  defaultAs: ValidComponent,
  register: (ctx: PopoverContextValue) => (id: string | undefined) => void,
) {
  return <T extends ValidComponent>(props: PartProps<T>): JSX.Element => {
    const set = register(usePopover());
    const rest = omit(props as PartProps<ValidComponent>, "as", "id");
    const fallback = createUniqueId();
    const id = (): string => props.id || fallback;
    createEffect(id, (next) => {
      set(next);
      return () => set(undefined);
    });
    return (
      <Polymorphic
        {...merge(rest, {
          as: props.as,
          defaultAs,
          get id() {
            return id();
          },
        })}
      />
    );
  };
}

const PopoverTitle = labelPart("h2", (ctx) => ctx.setTitleId);
const PopoverDescription = labelPart("p", (ctx) => ctx.setDescriptionId);

function PopoverCloseButton<T extends ValidComponent = "button">(props: PartProps<T>): JSX.Element {
  const ctx = usePopover();
  const rest = omit(props as PartProps<ValidComponent>, "as", "onClick");
  return (
    <Polymorphic
      {...merge({ "aria-label": "Dismiss" }, rest, {
        as: props.as,
        defaultAs: "button" as ValidComponent,
        onClick: (event: MouseEvent & { currentTarget: HTMLElement; target: Element }) => {
          callEventHandler(
            event,
            (props as ComponentProps<"button">).onClick as
              | JSX.EventHandlerUnion<HTMLElement, MouseEvent>
              | undefined,
          );
          ctx.setOpen(false);
        },
      })}
    />
  );
}

const Popover = Object.assign(PopoverRoot, {
  Anchor: PopoverAnchor,
  CloseButton: PopoverCloseButton,
  Content: PopoverContent,
  Description: PopoverDescription,
  Title: PopoverTitle,
  Trigger: PopoverTrigger,
});

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger, useAnchorTrigger };
