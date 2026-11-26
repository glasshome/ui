import { type Component, omit, Show } from "solid-js";
import { type ComponentProps, type JSX } from "@solidjs/web";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { DOCK_SLOT_SHAPE } from "../lib/dock-slot-classes.js";
import { DOCK_ARRIVE_MOTION, PRESS_DIP } from "../lib/motion-classes.js";
import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";
import { useUiText } from "./locale.js";
import { SelectionHighlight } from "./selection.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.js";

export interface DockIconButtonProps extends ComponentProps<"button"> {
  icon: Component<{ class?: string }> | JSX.Element;
  label: string;
  isActive?: boolean;
  /** Wears the selection highlight: the active item, or the one a drag would land on. */
  lit?: boolean;
  badge?: number;
  /** Plays the arrival glow once. */
  arrived?: boolean;
}

export const DockIconButton: Component<DockIconButtonProps> = (props) => {
  const text = useUiText();
  // Kobalte's button root narrows `type`; Solid's ComponentProps<"button"> also
  // admits "menu", so it is split off rather than spread.
  const rest = omit(props, "icon", "label", "class", "isActive", "badge", "type", "lit", "arrived");
  const isElement = () => typeof props.icon !== "function";

  const icon = (
    <div
      data-slot="dock-item-icon"
      class={cn(
        "flex items-center justify-center transition-colors duration-(--duration-state)",
        props.lit ? "text-primary" : "text-foreground group-hover:text-primary/80",
      )}
    >
      {isElement() ? (
        (props.icon as JSX.Element)
      ) : (
        <Polymorphic
          defaultAs={props.icon as Component<{ class?: string }>}
          class="h-5 w-5 sm:h-6 sm:w-6"
        />
      )}
    </div>
  );

  return (
    <Tooltip openDelay={150} placement="top">
      <TooltipTrigger
        type="button"
        data-slot="dock-item"
        class={cn(
          "group relative isolate transition-transform duration-(--duration-micro)",
          DOCK_SLOT_SHAPE,
          PRESS_DIP,
          props.class,
        )}
        aria-label={props.label}
        aria-current={props.isActive ? "page" : undefined}
        data-lit={props.lit ? "" : undefined}
        data-arrived={props.arrived ? "" : undefined}
        {...rest}
      >
        <SelectionHighlight active={props.lit ?? false} />
        <Show when={props.arrived}>
          <span data-slot="dock-item-arrival" aria-hidden="true" class={DOCK_ARRIVE_MOTION} />
        </Show>
        {icon}
        <Show when={typeof props.badge === "number" && props.badge > 0}>
          {/* Inside the item box: an overhanging badge inflates the bar's
           * scrollWidth and trips the overflow-to-scroll check below. */}
          <Badge
            role="status"
            tone="var(--primary)"
            class="absolute top-0 right-0 h-4 min-w-4 justify-center px-1 pt-0.5 pb-0 font-mono text-[9px] leading-none font-medium tabular-nums"
            aria-label={text("ui.dock.pending", { count: props.badge ?? 0 })}
          >
            {props.badge != null && props.badge > 9 ? "9+" : props.badge}
          </Badge>
        </Show>
      </TooltipTrigger>
      <TooltipContent class="hidden sm:block">{props.label}</TooltipContent>
    </Tooltip>
  );
};
