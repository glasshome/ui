import { type Component, Show } from "solid-js";
import { VEIL_MOTION } from "../lib/motion-classes.js";
import { cn } from "../lib/utils.js";

/** Fills its positioned parent; no z-index, so it paints over earlier siblings: render it last. */
const StaleVeil: Component<{ shown: boolean; class?: string }> = (props) => (
  <Show when={props.shown}>
    <div
      data-slot="stale-veil"
      aria-hidden="true"
      class={cn(
        "bg-background/40 pointer-events-none absolute inset-0 rounded-[inherit]",
        VEIL_MOTION,
        props.class,
      )}
    />
  </Show>
);

export { StaleVeil };
