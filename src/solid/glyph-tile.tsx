import {
  createContext,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  Show,
  useContext,
} from "solid-js";
import { FIELD_CHROME } from "../lib/input-classes.js";
import { SCROLL_TRACK_FADE, trackScroll } from "../lib/scroll-track.js";
import { createToggleItem, createToggleSet, type ToggleSet } from "../lib/toggle-set.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";

const GlyphContext = createContext<ToggleSet>();

/** Tiles that scroll sideways below `sm` and wrap from `sm` up. Tapping the picked tile again clears the pick. */
export function GlyphTileGroup(props: {
  value: string | null;
  onChange: (value: string | null) => void;
  "aria-label": string;
  class?: string;
  children: JSX.Element;
}) {
  const [root, setRoot] = createSignal<HTMLDivElement>();
  const set = createToggleSet({
    root,
    itemSelector: '[data-slot="glyph-tile"][data-key]',
    values: () => (props.value === null ? [] : [props.value]),
    setValues: (next) => props.onChange(next[0] ?? null),
    multiple: () => false,
  });
  onMount(() => {
    const group = root();
    if (group) onCleanup(trackScroll(group, "[data-pressed]", "data-pressed"));
  });
  return (
    <GlyphContext.Provider value={set}>
      <div
        ref={setRoot}
        role="group"
        id={set.id()}
        data-orientation={set.orientation()}
        data-slot="glyph-tile-group"
        aria-label={props["aria-label"]}
        class={cn(
          `flex snap-x snap-proximity [scrollbar-width:none] gap-2 overflow-x-auto overscroll-x-contain py-0.5 [&::-webkit-scrollbar]:hidden ${SCROLL_TRACK_FADE} sm:flex-wrap sm:overflow-visible`,
          props.class,
        )}
        on:keydown={(event) => set.collection.onKeyDown(event)}
      >
        {props.children}
      </div>
    </GlyphContext.Provider>
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
  const set = useContext(GlyphContext);
  if (!set) throw new Error("GlyphTile renders inside a GlyphTileGroup");
  const item = createToggleItem(set, { value: () => props.value, disabled: () => false });
  return (
    <button
      ref={item.ref}
      type="button"
      {...item.props}
      data-slot="glyph-tile"
      class={cn(
        FIELD_CHROME,
        "transition-glass group/glyph-tile focus-visible:ring-ring/50 relative flex h-17 w-22 shrink-0 touch-manipulation snap-start flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-xs font-medium duration-(--duration-expand) outline-none focus-visible:ring-[3px] active:scale-[0.97] data-[pressed]:[--glass-base:color-mix(in_oklab,var(--primary)_16%,var(--input))] data-[pressed]:[--glass-edge:var(--primary)]",
        props.class,
      )}
    >
      <span
        aria-hidden="true"
        data-slot="glyph-tile-ring"
        class="ring-primary transition-glass pointer-events-none absolute inset-0 rounded-[inherit] ring-inset group-data-[pressed]/glyph-tile:ring-2"
      />
      <Icon icon={props.icon} width={22} height={22} class="text-foreground shrink-0" />
      <span data-slot="glyph-tile-label" class="text-foreground max-w-full truncate">
        {props.label}
      </span>
      <Show when={props.badge}>
        {(badge) => (
          <span
            data-slot="glyph-tile-badge"
            class="bg-primary text-primary-foreground absolute top-1 right-1 z-10 hidden size-[18px] items-center justify-center rounded-full group-data-[pressed]/glyph-tile:flex"
          >
            <Icon icon={badge()} width={12} height={12} />
          </span>
        )}
      </Show>
    </button>
  );
}
