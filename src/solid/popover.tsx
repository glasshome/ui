import { Popover as PopoverPrimitive, usePopoverContext } from "@kobalte/core/popover";
import {
  type Component,
  type ComponentProps,
  createContext,
  splitProps,
  useContext,
} from "solid-js";
import { INPUT_SURFACE } from "../lib/input-classes.js";
import { Z_CLASS } from "../lib/layers.js";
import { FIELD_MOTION, MORPH_MOTION, STAGGER } from "../lib/motion-classes.js";
import { anchorToTriggerTop, FLOATING_PANEL } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";

type PopoverSurface = "overlay" | "field";

const PopoverSurfaceContext = createContext<() => PopoverSurface>(
  () => "overlay" as PopoverSurface,
);

/* The expanding field panel: opaque (the trigger sits underneath it), bound to
 * the anchor width and radius, and padded by whatever part needs padding, never
 * by the panel, so the panel edge and the trigger edge are one rectangle. */
const FIELD_PANEL = `${INPUT_SURFACE} ${FIELD_MOTION} relative ${Z_CLASS.overlay} w-[var(--kb-popper-anchor-width)] overflow-hidden rounded-md text-popover-foreground outline-hidden`;

const OVERLAY_PANEL = `${FLOATING_PANEL} ${MORPH_MOTION} ${STAGGER} w-72 p-4`;

type PopoverProps = ComponentProps<typeof PopoverPrimitive> & {
  /** "field" anchors the panel over the trigger's top edge, so the field reads
   *  as expanding into its panel instead of a box dropping in below it. */
  surface?: PopoverSurface;
};

const PopoverRoot: Component<PopoverProps> = (props) => {
  const [local, rest] = splitProps(props, ["surface", "gutter", "getAnchorRect"]);
  const surface = () => local.surface ?? "overlay";
  return (
    <PopoverSurfaceContext.Provider value={surface}>
      <PopoverPrimitive
        gutter={local.gutter ?? 0}
        getAnchorRect={local.getAnchorRect ?? anchorToTriggerTop}
        flip={false}
        overlap
        {...rest}
      />
    </PopoverSurfaceContext.Provider>
  );
};

/* Omit<T, never> keeps the statics and drops the call signature, so the
 * intersection has one call signature: ours, with `surface`. */
type PopoverStatics = Omit<typeof PopoverPrimitive, never>;

/* Kobalte hangs Anchor/Content/Portal/Title/Trigger/CloseButton/Arrow off the
 * root; carry them across so `Popover.Portal` keeps resolving for hosts that
 * reach past the wrapped parts. */
const Popover = Object.assign(PopoverRoot, PopoverPrimitive) as Component<PopoverProps> &
  PopoverStatics;

const PopoverTrigger: Component<ComponentProps<typeof PopoverPrimitive.Trigger>> = (props) => {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
};

type PopoverContentProps = ComponentProps<typeof PopoverPrimitive.Content> & {
  surface?: PopoverSurface;
};

const PopoverContent: Component<PopoverContentProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "surface"]);
  const fromRoot = useContext(PopoverSurfaceContext);
  const surface = () => local.surface ?? fromRoot();
  const popover = usePopoverContext();
  // The morph starts as the trigger's box (pill radius clamped to h/2). A
  // field picker has an Anchor, not a Trigger, and keeps its clip reveal.
  const writeMorphStart = (el: HTMLElement) => {
    const trigger = popover.triggerRef();
    if (!trigger || surface() === "field") return;
    const height = trigger.getBoundingClientRect().height;
    const radius = Math.min(
      Number.parseFloat(getComputedStyle(trigger).borderTopLeftRadius) || 0,
      height / 2,
    );
    el.style.setProperty("--morph-h", `${height}px`);
    el.style.setProperty("--morph-radius", `${radius}px`);
  };
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={writeMorphStart}
        data-slot="popover-content"
        data-surface={surface()}
        class={cn(surface() === "field" ? FIELD_PANEL : OVERLAY_PANEL, local.class)}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
};

const PopoverAnchor: Component<ComponentProps<typeof PopoverPrimitive.Anchor>> = (props) => {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
};

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
