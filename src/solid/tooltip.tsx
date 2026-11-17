import {
  type Accessor,
  type Component,
  type ComponentProps,
  createContext,
  createSignal,
  createUniqueId,
  type JSX,
  onCleanup,
  Show,
  splitProps,
  untrack,
  useContext,
  type ValidComponent,
} from "solid-js";
import { Portal } from "solid-js/web";
import { createAnchored } from "../lib/behavior/anchored.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { createDismiss } from "../lib/behavior/dismiss.js";
import { registerLayer } from "../lib/behavior/layer-stack.js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { createPresence } from "../lib/behavior/presence.js";
import { effect, merge } from "../lib/behavior/solid.js";
import type { Align, Side } from "../lib/anchor-placement.js";
import { MOTION_EXIT_MS, OVERLAY_MOTION } from "../lib/motion-classes.js";
import { FLOATING_PANEL } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";
import { usePortalMount } from "./portal-mount.js";

type Placement = Side | `${Side}-${Exclude<Align, "center">}`;

interface TooltipRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: Placement;
  gutter?: number;
  openDelay?: number;
  closeDelay?: number;
  children?: JSX.Element;
  /** @deprecated Ignored. */
  id?: string;
  /** @deprecated Ignored. */
  disabled?: boolean;
  /** @deprecated Ignored. */
  skipDelayDuration?: number;
  /** @deprecated Ignored. */
  triggerOnFocusOnly?: boolean;
  /** @deprecated Ignored. */
  ignoreSafeArea?: boolean;
  /** @deprecated Ignored. */
  forceMount?: boolean;
  /** @deprecated Ignored. */
  getAnchorRect?: (anchor?: HTMLElement) => unknown;
  /** @deprecated Ignored. */
  shift?: number;
  /** @deprecated Ignored. */
  flip?: boolean | string;
  /** @deprecated Ignored. */
  slide?: boolean;
  /** @deprecated Ignored. */
  overlap?: boolean;
  /** @deprecated Ignored. */
  sameWidth?: boolean;
  /** @deprecated Ignored. */
  fitViewport?: boolean;
  /** @deprecated Ignored. */
  hideWhenDetached?: boolean;
  /** @deprecated Ignored. */
  detachedPadding?: number;
  /** @deprecated Ignored. */
  arrowPadding?: number;
  /** @deprecated Ignored. */
  overflowPadding?: number;
}

interface TooltipContentProps extends ComponentProps<"div"> {
  /** @deprecated Ignored. */
  forceMount?: boolean;
  /** @deprecated Ignored. */
  onEscapeKeyDown?: (event: Event) => void;
  /** @deprecated Ignored. */
  onPointerDownOutside?: (event: Event) => void;
  /** @deprecated Ignored. */
  onFocusOutside?: (event: Event) => void;
  /** @deprecated Ignored. */
  onInteractOutside?: (event: Event) => void;
}

interface TooltipContextValue {
  id: string;
  open: Accessor<boolean>;
  trigger: Accessor<HTMLElement | undefined>;
  setTrigger: (el: HTMLElement | undefined) => void;
  side: Accessor<Side>;
  align: Accessor<Align>;
  gutter: number;
  show: (delayed: boolean) => void;
  hide: (delayed: boolean) => void;
  hold: () => void;
}

const TooltipContext = createContext<TooltipContextValue>();

const useTooltip = (): TooltipContextValue => {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error("Tooltip parts render inside a Tooltip");
  return ctx;
};

const OPEN_DELAY_MS = 700;
const CLOSE_DELAY_MS = 100;

const ORIGIN_BY_SIDE =
  "data-[side=bottom]:origin-top data-[side=top]:origin-bottom data-[side=left]:origin-right data-[side=right]:origin-left";

const TooltipRoot: Component<TooltipRootProps> = (props) => {
  const [open, setOpen] = createControllableSignal<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (next) => props.onOpenChange?.(next),
  });
  const [trigger, setTrigger] = createSignal<HTMLElement>();
  const placement = () => (props.placement ?? "bottom").split("-") as [Side, Align?];
  let timer: ReturnType<typeof setTimeout> | undefined;
  const hold = () => clearTimeout(timer);
  const schedule = (next: boolean, delay: number) => {
    hold();
    if (delay <= 0) setOpen(next);
    else timer = setTimeout(() => setOpen(next), delay);
  };
  onCleanup(hold);

  const value: TooltipContextValue = {
    id: createUniqueId(),
    open,
    trigger,
    setTrigger,
    side: () => placement()[0],
    align: () => placement()[1] ?? "center",
    gutter: untrack(() => props.gutter ?? 6),
    show: (delayed) => schedule(true, delayed ? (props.openDelay ?? OPEN_DELAY_MS) : 0),
    hide: (delayed) => schedule(false, delayed ? (props.closeDelay ?? CLOSE_DELAY_MS) : 0),
    hold,
  };
  return <TooltipContext.Provider value={value}>{props.children}</TooltipContext.Provider>;
};

type TooltipTriggerProps<T extends ValidComponent> = { as?: T } & Omit<ComponentProps<T>, "as">;

function TooltipTrigger<T extends ValidComponent = "button">(
  props: TooltipTriggerProps<T>,
): JSX.Element {
  const ctx = useTooltip();
  const [local, rest] = splitProps(props as TooltipTriggerProps<ValidComponent>, [
    "as",
    "ref",
    "aria-describedby",
  ]);
  let pressed = false;

  onCleanup(() => {
    ctx.setTrigger(undefined);
    ctx.hide(false);
  });

  effect(ctx.trigger, (el) => {
    if (!el) return;
    const mouseLike = (e: PointerEvent) => e.pointerType !== "touch";
    const enter = (e: PointerEvent) => mouseLike(e) && ctx.show(true);
    const leave = (e: PointerEvent) => mouseLike(e) && ctx.hide(true);
    const press = () => {
      pressed = true;
      ctx.hide(false);
    };
    const focus = () => {
      if (!pressed) ctx.show(false);
    };
    const blur = () => {
      pressed = false;
      ctx.hide(false);
    };
    const key = () => {
      pressed = false;
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", press);
    el.addEventListener("focus", focus);
    el.addEventListener("blur", blur);
    el.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", press);
      el.removeEventListener("focus", focus);
      el.removeEventListener("blur", blur);
      el.removeEventListener("keydown", key);
    };
  });

  return (
    <Polymorphic
      {...merge({ "data-slot": "tooltip-trigger" }, rest, {
        as: local.as,
        defaultAs: "button" as ValidComponent,
        ref: (el: HTMLElement) => {
          ctx.setTrigger(el);
          if (typeof local.ref === "function") local.ref(el);
        },
        get "aria-describedby"() {
          return (
            [local["aria-describedby"], ctx.open() ? ctx.id : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          );
        },
      })}
    />
  );
}

const TooltipContent: Component<TooltipContentProps> = (props) => {
  const ctx = useTooltip();
  const [local, others] = splitProps(props, [
    "class",
    "ref",
    "forceMount",
    "onEscapeKeyDown",
    "onPointerDownOutside",
    "onFocusOutside",
    "onInteractOutside",
  ]);
  const [panel, setPanel] = createSignal<HTMLElement>();
  const presence = createPresence({
    present: ctx.open,
    element: panel,
    exitMs: MOTION_EXIT_MS.overlay,
  });

  const layer = registerLayer({
    element: panel,
    open: presence.mounted,
    kind: "tooltip",
    escape: () => true,
    topLayer: "manual",
  });
  createDismiss({ layer, outsidePress: () => false, onDismiss: () => ctx.hide(false) });
  createAnchored({
    anchor: ctx.trigger,
    floating: panel,
    open: ctx.open,
    side: ctx.side,
    align: ctx.align,
    offset: ctx.gutter,
  });

  const Panel: Component = () => {
    onCleanup(() => setPanel(undefined));
    return (
      <div
        {...others}
        ref={(el) => {
          setPanel(el);
          if (typeof local.ref === "function") local.ref(el);
        }}
        id={ctx.id}
        role="tooltip"
        data-slot="tooltip-content"
        data-expanded={ctx.open() ? "" : undefined}
        data-closed={ctx.open() ? undefined : ""}
        on:pointerenter={ctx.hold}
        on:pointerleave={() => ctx.hide(true)}
        class={cn(
          FLOATING_PANEL,
          OVERLAY_MOTION,
          ORIGIN_BY_SIDE,
          "overflow-hidden px-3 py-1.5 text-xs",
          local.class,
        )}
      />
    );
  };

  return (
    <Show when={presence.mounted()}>
      <Portal mount={usePortalMount()}>
        <Panel />
      </Portal>
    </Show>
  );
};

/** @deprecated TooltipContent portals itself; this renders its children in place. */
const TooltipPortal: Component<{ children?: JSX.Element }> = (props) => <>{props.children}</>;

/** @deprecated Renders nothing. */
const TooltipArrow: Component = () => null;

const Tooltip = Object.assign(TooltipRoot, {
  Trigger: TooltipTrigger,
  Content: TooltipContent,
  Portal: TooltipPortal,
  Arrow: TooltipArrow,
});

export { Tooltip, TooltipContent, TooltipTrigger };
