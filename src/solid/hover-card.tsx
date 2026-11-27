import {
  type Accessor,
  type Component,
  createContext,
  createSignal,
  onCleanup,
  omit,
  untrack,
  createEffect,
  merge,
} from "solid-js";
import { useRequired } from "../lib/context.js";
import { type ComponentProps, type JSX, type ValidComponent } from "@solidjs/web";
import { Layer } from "../lib/behavior/layer.js";
import type { Align, Side } from "../lib/anchor-placement.js";
import { createAnchored } from "../lib/behavior/anchored.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { createDismiss } from "../lib/behavior/dismiss.js";
import { registerLayer } from "../lib/behavior/layer-stack.js";
import { createSlot } from "../lib/behavior/slot.js";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { createPresence } from "../lib/behavior/presence.js";
import { MOTION_EXIT_MS, OVERLAY_MOTION } from "../lib/motion-classes.js";
import { FLOATING_PANEL } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";
import { usePortalMount } from "./portal-mount.js";
import { forwardRef } from "../lib/behavior/solid.js";

type Placement = Side | `${Side}-${Exclude<Align, "center">}`;

interface HoverCardProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  placement?: Placement;
  gutter?: number;
  children?: JSX.Element;
}

interface HoverCardContextValue {
  open: Accessor<boolean>;
  trigger: Accessor<HTMLElement | undefined>;
  setTrigger: (el: HTMLElement | undefined) => void;
  releaseTrigger: (el: HTMLElement) => void;
  card: Accessor<HTMLElement | undefined>;
  setCard: (el: HTMLElement | undefined) => void;
  side: Accessor<Side>;
  align: Accessor<Align>;
  gutter: Accessor<number>;
  show: () => void;
  hide: (delayed: boolean) => void;
  hold: () => void;
}

const HoverCardContext = createContext<HoverCardContextValue>();

const useHoverCard = (): HoverCardContextValue => {
  const ctx = useRequired(HoverCardContext, "HoverCard parts", "HoverCard");
  return ctx;
};

const OPEN_DELAY_MS = 700;
const CLOSE_DELAY_MS = 300;

const ORIGIN_BY_SIDE =
  "data-[side=bottom]:origin-top data-[side=top]:origin-bottom data-[side=left]:origin-right data-[side=right]:origin-left";

const HoverCardRoot: Component<HoverCardProps> = (props) => {
  const [open, setOpen] = createControllableSignal<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (next) => props.onOpenChange?.(next),
  });
  const [trigger, setTrigger, releaseTrigger] = createSlot<HTMLElement>();
  const [card, setCard] = createSignal<HTMLElement>();
  const placement = () => (props.placement ?? "bottom").split("-") as [Side, Align?];
  let timer: ReturnType<typeof setTimeout> | undefined;
  const hold = () => clearTimeout(timer);
  const schedule = (next: boolean, delay: number) => {
    hold();
    if (delay <= 0) setOpen(next);
    else timer = setTimeout(() => setOpen(next), delay);
  };
  onCleanup(hold);

  const value: HoverCardContextValue = {
    open,
    trigger,
    setTrigger,
    releaseTrigger,
    card,
    setCard: (el) => setCard(el),
    side: () => placement()[0],
    align: () => placement()[1] ?? "center",
    gutter: () => props.gutter ?? 0,
    show: () => {
      if (untrack(open)) hold();
      else schedule(true, props.openDelay ?? OPEN_DELAY_MS);
    },
    hide: (delayed) => schedule(false, delayed ? (props.closeDelay ?? CLOSE_DELAY_MS) : 0),
    hold,
  };
  return <HoverCardContext value={value}>{props.children}</HoverCardContext>;
};

type HoverCardTriggerProps<T extends ValidComponent> = { as?: T } & Omit<ComponentProps<T>, "as">;

function HoverCardTrigger<T extends ValidComponent = "a">(
  props: HoverCardTriggerProps<T>,
): JSX.Element {
  const ctx = useHoverCard();
  const rest = omit(props as HoverCardTriggerProps<ValidComponent>, "as", "ref");
  const [own, setOwn] = createSignal<HTMLElement>();
  const nativeLink = () => props.as === undefined || props.as === "a";

  onCleanup(() => {
    const el = untrack(own);
    if (el) ctx.releaseTrigger(el);
  });

  createEffect(own, (el) => {
    if (!el) return;
    let touched = false;
    const mouseLike = (e: PointerEvent) => e.pointerType !== "touch";
    const enter = (e: PointerEvent) => mouseLike(e) && ctx.show();
    const leave = (e: PointerEvent) => mouseLike(e) && ctx.hide(true);
    const down = (e: PointerEvent) => {
      touched = !mouseLike(e);
    };
    const focus = () => {
      if (!touched) ctx.show();
    };
    const blur = (e: FocusEvent) => {
      touched = false;
      const next = e.relatedTarget;
      if (next instanceof Node && untrack(ctx.card)?.contains(next)) return;
      ctx.hide(true);
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", down);
    el.addEventListener("focus", focus);
    el.addEventListener("blur", blur);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("focus", focus);
      el.removeEventListener("blur", blur);
    };
  });

  return (
    <Polymorphic
      {...merge(
        {
          "data-slot": "hover-card-trigger",
          get role() {
            return nativeLink() ? undefined : "link";
          },
          get tabIndex() {
            return nativeLink() ? undefined : 0;
          },
        },
        rest,
        {
          as: props.as,
          defaultAs: "a" as ValidComponent,
          ref: (el: HTMLElement) => {
            setOwn(el);
            ctx.setTrigger(el);
            forwardRef(() => props.ref, el);
          },
          get "data-expanded"() {
            return ctx.open() ? "" : undefined;
          },
          get "data-closed"() {
            return ctx.open() ? undefined : "";
          },
        },
      )}
    />
  );
}

interface HoverCardContentProps extends ComponentProps<"div"> {}

const HoverCardContent: Component<HoverCardContentProps> = (props) => {
  const ctx = useHoverCard();
  const others = omit(props, "class", "ref");
  const presence = createPresence({
    present: ctx.open,
    element: ctx.card,
    exitMs: MOTION_EXIT_MS.overlay,
  });

  const layer = registerLayer({
    element: ctx.card,
    open: ctx.open,
    kind: "popover",
    escape: () => true,
    dismiss: () => ctx.hide(false),
    trigger: ctx.trigger,
  });
  createDismiss({ layer, escapeFrom: "document", onDismiss: () => ctx.hide(false) });
  createAnchored({
    anchor: ctx.trigger,
    floating: ctx.card,
    open: ctx.open,
    side: ctx.side,
    align: ctx.align,
    offset: ctx.gutter,
  });

  const portalMount = usePortalMount();
  const Card: Component = () => {
    onCleanup(() => ctx.setCard(undefined));
    return (
      <div
        {...others}
        ref={(el) => {
          ctx.setCard(el);
          forwardRef(() => props.ref, el);
        }}
        data-slot="hover-card-content"
        data-expanded={ctx.open() ? "" : undefined}
        data-closed={ctx.open() ? undefined : ""}
        onPointerEnter={ctx.hold}
        onPointerLeave={() => ctx.hide(true)}
        class={cn(FLOATING_PANEL, OVERLAY_MOTION, ORIGIN_BY_SIDE, "w-64 p-4", props.class)}
      />
    );
  };

  return (
    <Layer mount={portalMount} when={presence.mounted()}>
      <Card />
    </Layer>
  );
};

const HoverCard = Object.assign(HoverCardRoot, {
  Trigger: HoverCardTrigger,
  Content: HoverCardContent,
});

export { HoverCard, HoverCardContent, HoverCardTrigger };
