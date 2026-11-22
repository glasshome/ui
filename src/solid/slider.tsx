import type { Component } from "solid-js";
import { createMemo, createSignal, For } from "solid-js";
import { focusWithoutTracking } from "../lib/behavior/focus-scope.js";
import { alongTrack, createDrag, createRange } from "../lib/behavior/range.js";
import { FIELD_CHROME, FOCUS_RING } from "../lib/input-classes.js";
import { readingDirection } from "../lib/format.js";
import { THUMB_CLASS, THUMB_RAIL_BLEED, THUMB_RAIL_PAD } from "../lib/thumb-classes.js";
import { cn } from "../lib/utils.js";
import { useUiFormat } from "./locale.js";

interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange?: (values: number[]) => void;
  onChangeEnd?: (values: number[]) => void;
  class?: string;
  trackClass?: string;
  thumbClass?: string;
  /** Per-thumb background color, index-matched to value[]. Color only; the thumb keeps its material. */
  thumbColors?: string[];
  /**
   * Fill tint. A single color swaps --glass-tone; a pair runs a horizontal
   * two-tone wash via the glass tone-2 knobs. The fill stays the one glass
   * material either way.
   */
  fillTone?: string | [string, string];
  /** Value-positioned tick annotations on the track (e.g. a current-temperature reading). */
  markers?: number[];
  minStepsBetweenThumbs?: number;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

const rtl = readingDirection === "rtl";
const START = rtl ? "right" : "left";
const END = rtl ? "left" : "right";
// `translate` (not `transform`) sits outside the hover scale, so a scaled thumb stays centred on its value.
const THUMB_SHIFT = rtl ? "50% 0" : "-50% 0";

const Slider: Component<SliderProps> = (props) => {
  const format = useUiFormat();
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 100;
  const disabled = () => props.disabled ?? false;
  const range = createRange({
    values: () => props.value,
    defaultValues: () => props.defaultValue ?? [min()],
    min,
    max,
    step: () => props.step ?? 1,
    minStepsBetween: () => props.minStepsBetweenThumbs ?? 0,
    disabled,
    onChange: (values) => props.onChange?.(values),
    onChangeEnd: (values) => props.onChangeEnd?.(values),
  });
  const indices = createMemo(() => range.values().map((_, i) => i), [], {
    equals: (a, b) => a.length === b.length,
  });
  const percents = () => range.values().map((v) => range.fraction(v) * 100);
  const [thumbs, setThumbs] = createSignal<HTMLElement[]>([]);
  let active = 0;
  let grab = 0;

  const drag = createDrag({
    disabled,
    start: (e, rect) => {
      const onThumb = (e.target as Element).closest('[data-slot="slider-thumb"]') !== null;
      const at = alongTrack(e, rect);
      const raw = min() + at * (max() - min());
      active = range.closestThumb(raw);
      if (onThumb) {
        grab = at - range.fraction(range.values()[active] ?? 0);
      } else {
        grab = 0;
        range.setThumb(active, raw);
      }
      focusWithoutTracking(thumbs()[active]);
    },
    move: (e, rect) => range.setThumb(active, range.valueAt(alongTrack(e, rect) - grab)),
    end: range.dragEnd,
  });

  const markerPct = (v: number) => {
    const span = max() - min();
    return span === 0 ? 0 : ((v - min()) / span) * 100;
  };

  const disabledMark = () => (disabled() ? "" : undefined);

  return (
    <div
      role="group"
      data-slot="slider"
      data-orientation="horizontal"
      data-disabled={disabledMark()}
      class={cn(
        // The rail wears the shared toggle/rail chrome, so it reads as an empty
        // well in both themes (a field's light-theme fill rises to the card).
        "relative flex w-full touch-none items-center rounded-xl select-none",
        THUMB_RAIL_PAD,
        FIELD_CHROME,
        disabled() && "cursor-not-allowed opacity-50",
        props.class,
      )}
    >
      <div
        data-slot="slider-track"
        data-orientation="horizontal"
        data-disabled={disabledMark()}
        class={cn(
          "relative h-7 w-full",
          disabled() ? "cursor-not-allowed" : "cursor-pointer",
          props.trackClass,
        )}
        on:pointerdown={drag.onPointerDown}
        on:pointermove={drag.onPointerMove}
        on:pointerup={drag.onPointerUp}
        on:pointercancel={drag.onPointerCancel}
      >
        <div
          data-slot="slider-fill"
          data-orientation="horizontal"
          data-disabled={disabledMark()}
          class={cn(
            // The fill sits sunk inside the recessed rail: the tinted-surface
            // outer drop shadow would read as a halo leaking out of the groove.
            "glass glass-tint absolute inset-y-0 rounded-xl [--glass-drop:0%] [--glass-wash:90%]",
            THUMB_RAIL_BLEED,
            Array.isArray(props.fillTone) && "glass-edge-gradient",
          )}
          style={{
            [START]: `${percents().length > 1 ? Math.min(...percents()) : 0}%`,
            [END]: `${100 - Math.max(...percents())}%`,
            ...(Array.isArray(props.fillTone)
              ? {
                  "--glass-tone": props.fillTone[0],
                  "--glass-tone-2": props.fillTone[1],
                  "--glass-wash-2": "var(--glass-wash)",
                  "--glass-wash-angle": "90deg",
                }
              : { "--glass-tone": props.fillTone ?? "var(--material-accent)" }),
          }}
        />
        <For each={props.markers ?? []}>
          {(marker) => (
            <span
              data-slot="slider-marker"
              class="pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${markerPct(marker)}%`,
                background: "color-mix(in oklab, var(--foreground) 60%, transparent)",
              }}
            />
          )}
        </For>
        <For each={indices()}>
          {(index) => (
            <span
              ref={(el) => setThumbs((all) => Object.assign(all.slice(), { [index]: el }))}
              role="slider"
              data-slot="slider-thumb"
              data-orientation="horizontal"
              data-disabled={disabledMark()}
              tabIndex={disabled() ? undefined : 0}
              aria-label={props["aria-label"]}
              aria-labelledby={props["aria-labelledby"]}
              aria-valuemin={min()}
              aria-valuemax={max()}
              aria-valuenow={range.values()[index]}
              aria-valuetext={format.number(range.values()[index] ?? 0)}
              aria-orientation="horizontal"
              aria-disabled={disabled() || undefined}
              class={cn(
                THUMB_CLASS,
                FOCUS_RING,
                "absolute top-0 transition-transform duration-(--duration-expand) ease-out hover:scale-125 active:scale-110",
                disabled() && "cursor-not-allowed",
                props.thumbClass,
              )}
              style={{
                [START]: `calc(${percents()[index] ?? 0}%)`,
                translate: THUMB_SHIFT,
                "touch-action": "none",
                background: props.thumbColors?.[index] ?? "var(--material-control-knob)",
              }}
              on:keydown={(e) => range.keyDown(e, index)}
              onBlur={range.blur}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export { Slider };
