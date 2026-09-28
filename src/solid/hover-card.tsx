import { HoverCard as HoverCardPrimitive } from "@kobalte/core/hover-card";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { OVERLAY_MOTION } from "../lib/motion-classes.js";
import { FLOATING_PANEL } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";

const HoverCard = HoverCardPrimitive;

const HoverCardTrigger: Component<ComponentProps<typeof HoverCardPrimitive.Trigger>> = (props) => {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
};

const HoverCardContent: Component<ComponentProps<typeof HoverCardPrimitive.Content>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        class={cn(FLOATING_PANEL, OVERLAY_MOTION, "w-64 p-4", local.class)}
        {...rest}
      />
    </HoverCardPrimitive.Portal>
  );
};

export { HoverCard, HoverCardContent, HoverCardTrigger };
