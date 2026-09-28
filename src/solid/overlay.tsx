import { type Component, type ComponentProps, splitProps } from "solid-js";
import { OVERLAY_MOTION } from "../lib/motion-classes.js";
import { FLOATING_PANEL } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";

/* The floating glass panel material, for custom floating surfaces that are not
 * a Popover/Menu primitive. Radius and motion come from FLOATING_PANEL/
 * OVERLAY_MOTION; caller owns padding and positioning. */
const Overlay: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div data-slot="overlay" class={cn(FLOATING_PANEL, OVERLAY_MOTION, local.class)} {...others} />
  );
};

export { Overlay };
