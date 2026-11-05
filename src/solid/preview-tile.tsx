import type { JSX } from "solid-js";
import { children, onCleanup, onMount, Show } from "solid-js";
import { SCROLL_TRACK_FADE, trackScroll } from "../lib/scroll-track.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { isItemActivation, RadioGroup, RadioGroupItem } from "./radio-group.js";

const COLUMNS = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" } as const;

const SHAPE = { film: "aspect-video", wide: "aspect-[16/10]", tile: "aspect-[5/4]" } as const;

/* The face is the affordance: the radio control is suppressed and a ring on
 * the face carries the picked state, the focus ring rides the same edge.
 * Rings are drawn inside the face, above the picture: an outer ring is cut off where a scroll area clips the grid. */
const TILE_FACE =
  "relative w-full overflow-hidden rounded-lg border border-border/60 transition-glass duration-200 group-active/preview-tile:scale-[0.97] group-data-[checked]/preview-tile:border-transparent after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:ring-inset after:transition-glass group-data-[checked]/preview-tile:after:ring-2 group-data-[checked]/preview-tile:after:ring-primary group-has-[:focus-visible]/preview-tile:after:ring-[3px] group-has-[:focus-visible]/preview-tile:after:ring-ring/50";

const SM_COLUMNS = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" } as const;

/* A row of fixed-width tiles below `sm`, faded where it is clipped; a grid from `sm` up.
 * The caller bleeds the row to its container's edge with a negative margin and matching padding. */
const SCROLL_ROW = `relative flex flex-row overflow-x-auto overscroll-x-contain snap-x snap-proximity py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${SCROLL_TRACK_FADE} sm:grid sm:overflow-visible [&>*]:w-39 [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto`;

export function PreviewTileGroup(props: {
  value: string | null;
  onChange: (value: string) => void;
  "aria-label": string;
  columns?: keyof typeof COLUMNS;
  /** A row that scrolls sideways below `sm`, a grid of `columns` from `sm` up. */
  scroll?: boolean;
  class?: string;
  children: JSX.Element;
}) {
  let group: HTMLElement | undefined;
  onMount(() => {
    if (props.scroll && group) onCleanup(trackScroll(group, "[data-checked]", "data-checked"));
  });
  return (
    <RadioGroup
      ref={(el: HTMLElement) => {
        group = el;
      }}
      data-slot="preview-tile-group"
      class={cn(
        props.scroll
          ? `gap-2 ${SCROLL_ROW} ${SM_COLUMNS[props.columns ?? 2]} sm:gap-x-3 sm:gap-y-4`
          : `grid gap-2.5 ${COLUMNS[props.columns ?? 2]}`,
        props.class,
      )}
      value={props.value ?? ""}
      onChange={props.onChange}
      aria-label={props["aria-label"]}
    >
      {props.children}
    </RadioGroup>
  );
}

/** A button among the tiles that picks nothing: the way to a larger set. A glyph draws a dashed face; children draw a picture on a solid one. */
export function PreviewTileAction(props: {
  label: string;
  icon?: string;
  onClick?: () => void;
  shape?: keyof typeof SHAPE;
  class?: string;
  children?: JSX.Element;
}) {
  const picture = children(() => props.children);
  return (
    <button
      type="button"
      data-slot="preview-tile-action"
      onClick={() => props.onClick?.()}
      class={cn("group/preview-tile-action flex min-w-0 flex-col gap-1.5 text-start", props.class)}
    >
      <div
        data-slot="preview-tile-face"
        aria-hidden="true"
        class={cn(
          "border-border transition-glass after:transition-glass group-focus-visible/preview-tile-action:after:ring-ring/50 relative w-full overflow-hidden rounded-lg border duration-200 group-active/preview-tile-action:scale-[0.97] after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:ring-inset group-focus-visible/preview-tile-action:after:ring-[3px]",
          picture()
            ? "border-border/60 group-hover/preview-tile-action:border-border"
            : "text-muted-foreground group-hover/preview-tile-action:text-foreground grid place-items-center border-dashed",
          SHAPE[props.shape ?? "wide"],
        )}
      >
        <Show
          when={picture()}
          fallback={
            <Show when={props.icon}>{(icon) => <Icon icon={icon()} width={20} height={20} />}</Show>
          }
        >
          {picture()}
        </Show>
      </div>
      <span data-slot="preview-tile-caption" class="text-foreground truncate text-xs font-medium">
        {props.label}
      </span>
    </button>
  );
}

/** A choice shown as what it produces: a picture, a preview card, a shape. */
export function PreviewTile(props: {
  value: string;
  label: string;
  /** A quieter second line under the caption. */
  meta?: string;
  /** Off for pictures that name themselves; the label still reaches assistive tech. */
  caption?: boolean;
  icon?: string;
  /** Beside the caption, after the label: provenance like `SourceMarks`. */
  marks?: JSX.Element;
  shape?: keyof typeof SHAPE;
  /** An outline face with its content centred, for the choice that adds nothing. */
  dashed?: boolean;
  disabled?: boolean;
  class?: string;
  /** Fires on every click, including a re-pick of the checked tile. */
  onPick?: () => void;
  children: JSX.Element;
}) {
  return (
    <RadioGroupItem
      data-slot="preview-tile"
      value={props.value}
      disabled={props.disabled}
      showControl={false}
      onClick={(event: MouseEvent) =>
        !props.disabled && isItemActivation(event) && props.onPick?.()
      }
      class={cn(
        "group/preview-tile min-w-0 [&_[data-slot=radio-group-item-content]]:flex [&_[data-slot=radio-group-item-content]]:flex-col [&_[data-slot=radio-group-item-content]]:gap-1.5 [&_[data-slot=radio-group-item-label]]:min-w-0",
        props.class,
      )}
    >
      <div
        data-slot="preview-tile-face"
        aria-hidden="true"
        class={cn(
          TILE_FACE,
          SHAPE[props.shape ?? "wide"],
          props.dashed && "text-muted-foreground grid place-items-center border-dashed",
        )}
      >
        {props.children}
      </div>
      <Show when={props.caption ?? true} fallback={<span class="sr-only">{props.label}</span>}>
        <span
          data-slot="preview-tile-caption"
          class="text-foreground @container/source-marks flex min-w-0 items-center gap-1 text-xs font-medium"
        >
          <Show when={props.icon}>
            {(icon) => (
              <Icon icon={icon()} width={12} height={12} aria-hidden="true" class="shrink-0" />
            )}
          </Show>
          <span class="truncate">{props.label}</span>
          {props.marks}
        </span>
        <Show when={props.meta}>
          <span
            data-slot="preview-tile-meta"
            class="text-muted-foreground -mt-1 truncate text-[11px] leading-tight"
          >
            {props.meta}
          </span>
        </Show>
      </Show>
    </RadioGroupItem>
  );
}
