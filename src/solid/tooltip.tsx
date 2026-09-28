import { Tooltip as TooltipPrimitive } from "@kobalte/core/tooltip";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { OVERLAY_MOTION } from "../lib/motion-classes.js";
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
  const [local, others] = splitProps(props, ["class"]);
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
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
