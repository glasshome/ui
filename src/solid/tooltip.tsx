import { Tooltip as TooltipPrimitive } from "@kobalte/core/tooltip";
import { usePortalMount } from "./portal-mount.js";
import { type Component, type ComponentProps, createSignal, splitProps } from "solid-js";
import { OVERLAY_MOTION } from "../lib/motion-classes.js";
import { shadowLayer } from "../lib/shadow-layer.js";
import { FLOATING_PANEL } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";

/* Kobalte takes the popper options on the root, not on the content, so the
 * gutter that keeps the panel off its trigger has to default here. */
const TooltipRoot: Component<ComponentProps<typeof TooltipPrimitive>> = (props) => (
  <TooltipPrimitive gutter={6} {...props} />
);

/* Object.assign, not a bare wrapper: Kobalte ships Tooltip as a callable
 * namespace and Tooltip.Trigger/.Content/.Portal/.Arrow are part of the
 * published surface. */
const Tooltip = Object.assign(TooltipRoot, TooltipPrimitive);

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent: Component<ComponentProps<typeof TooltipPrimitive.Content>> = (props) => {
  const [local, others] = splitProps(props, ["class", "ref", "onInteractOutside"]);
  const [panel, setPanel] = createSignal<HTMLElement>();
  // A tooltip closes as the pointer leaves; inside a shadow root it only must not close on its own presses.
  const { onInteractOutside } = shadowLayer({ content: panel, open: () => true, consumer: local });
  return (
    <TooltipPrimitive.Portal mount={usePortalMount()}>
      <TooltipPrimitive.Content
        ref={(el: HTMLElement) => {
          setPanel(el);
          if (typeof local.ref === "function") local.ref(el);
        }}
        onInteractOutside={onInteractOutside}
        data-slot="tooltip-content"
        class={cn(
          FLOATING_PANEL,
          OVERLAY_MOTION,
          "overflow-hidden px-3 py-1.5 text-xs",
          local.class,
        )}
        {...others}
      />
    </TooltipPrimitive.Portal>
  );
};

export { Tooltip, TooltipContent, TooltipTrigger };
