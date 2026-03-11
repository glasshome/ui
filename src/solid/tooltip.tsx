import { Tooltip as TooltipPrimitive } from "@kobalte/core/tooltip";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Tooltip = TooltipPrimitive;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent: Component<ComponentProps<typeof TooltipPrimitive.Content>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        class={cn(
          "fade-in-0 zoom-in-95 data-[closed]:fade-out-0 data-[closed]:zoom-out-95 z-50 animate-in overflow-hidden rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-xs data-[closed]:animate-out",
          local.class,
        )}
        {...others}
      />
    </TooltipPrimitive.Portal>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent };
