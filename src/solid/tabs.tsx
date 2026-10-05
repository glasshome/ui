import { Tabs as TabsPrimitive } from "@kobalte/core/tabs";
import { type Component, type ComponentProps, onCleanup, onMount, splitProps } from "solid-js";
import { TRACK_SURFACE } from "../lib/card-classes.js";
import { PRESS_DIP, SETTLE_MOTION } from "../lib/motion-classes.js";
import { SCROLL_TRACK_FADE, trackScroll } from "../lib/scroll-track.js";
import { SEGMENT_ITEM } from "../lib/segment-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { SlidingIndicator } from "./sliding-indicator.js";

/** `split`: the root is `display: contents`, so a host (a modal panel) lays the
 *  list and the content out in its own regions while the tab state still spans
 *  them. */
type TabsLayout = "stack" | "split";

const TABS_LAYOUT: Record<TabsLayout, string> = {
  stack: "flex flex-col gap-2",
  split: "contents",
};

type TabsProps = ComponentProps<typeof TabsPrimitive> & { layout?: TabsLayout };

const Tabs: Component<TabsProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "layout"]);
  return (
    <TabsPrimitive
      data-slot="tabs"
      data-layout={local.layout ?? "stack"}
      class={cn(TABS_LAYOUT[local.layout ?? "stack"], local.class)}
      {...others}
    />
  );
};

const TabsList: Component<ComponentProps<typeof TabsPrimitive.List>> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  let listRef: HTMLDivElement | undefined;
  onMount(() => {
    if (listRef) onCleanup(trackScroll(listRef, "[data-selected]", "data-selected"));
  });
  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      class={cn(
        `scrollbar-hide inline-flex h-9 w-full items-center overflow-x-auto rounded-lg has-[[data-slot=tabs-trigger-icon]]:h-auto ${TRACK_SURFACE} ${SCROLL_TRACK_FADE} text-muted-foreground p-1`,
        local.class,
      )}
      {...others}
    >
      {/* w-max so triggers keep their natural width and the track scrolls;
			    w-full alone squeezed them past the rounded edge, unreachable. */}
      <SlidingIndicator
        activeSelector="[data-selected]"
        indicatorClass="rounded-md"
        class="flex h-full w-max min-w-full items-center gap-1"
      >
        {local.children}
      </SlidingIndicator>
    </TabsPrimitive.List>
  );
};

/** `icon` stacks a glyph over the word, so a tab row reads apart from the toggle groups under it. */
const TabsTrigger: Component<ComponentProps<typeof TabsPrimitive.Trigger> & { icon?: string }> = (
  props,
) => {
  const [local, others] = splitProps(props, ["class", "icon", "children"]);
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      class={cn(
        SEGMENT_ITEM,
        PRESS_DIP,
        "hover:text-(--material-accent)/80 data-[selected]:text-(--material-accent)",
        local.icon && "h-auto flex-1 flex-col gap-1 py-2 text-xs",
        local.class,
      )}
      {...others}
    >
      {local.icon && (
        <Icon
          data-slot="tabs-trigger-icon"
          icon={local.icon}
          width={18}
          height={18}
          aria-hidden="true"
        />
      )}
      {local.children}
    </TabsPrimitive.Trigger>
  );
};

const TabsContent: Component<ComponentProps<typeof TabsPrimitive.Content>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      class={cn(
        SETTLE_MOTION,
        "focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
        local.class,
      )}
      {...others}
    />
  );
};

export { Tabs, TabsContent, TabsList, TabsTrigger };
