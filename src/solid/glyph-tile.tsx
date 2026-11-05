import { ToggleGroup as ToggleGroupPrimitive } from "@kobalte/core/toggle-group";
import { type JSX, onCleanup, onMount, Show } from "solid-js";
import { FIELD_CHROME } from "../lib/input-classes.js";
import { SCROLL_TRACK_FADE, trackScroll } from "../lib/scroll-track.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";

/** Tiles that scroll sideways below `sm` and wrap from `sm` up. Tapping the picked tile again clears the pick. */
export function GlyphTileGroup(props: {
  value: string | null;
  onChange: (value: string | null) => void;
  "aria-label": string;
  class?: string;
  children: JSX.Element;
}) {
  let group: HTMLDivElement | undefined;
  onMount(() => {
    if (group) onCleanup(trackScroll(group, "[data-pressed]", "data-pressed"));
  });
  return (
    <ToggleGroupPrimitive
      ref={group}
      data-slot="glyph-tile-group"
      aria-label={props["aria-label"]}
      value={props.value}
      onChange={props.onChange}
      class={cn(
        `flex snap-x snap-proximity [scrollbar-width:none] gap-2 overflow-x-auto overscroll-x-contain py-0.5 [&::-webkit-scrollbar]:hidden ${SCROLL_TRACK_FADE} sm:flex-wrap sm:overflow-visible`,
        props.class,
      )}
    >
      {props.children}
    </ToggleGroupPrimitive>
  );
}

/** A glyph over a name: a room, a kind, a place. A `badge` icon marks it while picked. */
export function GlyphTile(props: {
  value: string;
  icon: string;
  label: string;
  /** Shown in the corner only while this tile is picked. */
  badge?: string;
  class?: string;
}) {
  return (
    <ToggleGroupPrimitive.Item
      value={props.value}
      data-slot="glyph-tile"
      class={cn(
        FIELD_CHROME,
        "transition-glass group/glyph-tile focus-visible:ring-ring/50 data-[pressed]:ring-primary relative flex h-17 w-19 shrink-0 touch-manipulation snap-start flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-xs font-medium duration-200 outline-none focus-visible:ring-[3px] active:scale-[0.97] data-[pressed]:ring-2 data-[pressed]:[--glass-edge:var(--primary)]",
        props.class,
      )}
    >
      <Icon icon={props.icon} width={22} height={22} class="text-foreground shrink-0" />
      <span data-slot="glyph-tile-label" class="text-foreground max-w-full truncate">
        {props.label}
      </span>
      <Show when={props.badge}>
        {(badge) => (
          <span
            data-slot="glyph-tile-badge"
            class="bg-primary text-primary-foreground absolute -top-1 -right-1 hidden size-5 items-center justify-center rounded-full group-data-[pressed]/glyph-tile:flex"
          >
            <Icon icon={badge()} width={12} height={12} />
          </span>
        )}
      </Show>
    </ToggleGroupPrimitive.Item>
  );
}
