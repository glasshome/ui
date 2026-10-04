import { Slider as KSlider } from "@kobalte/core/slider";
import type { Component } from "solid-js";
import { Index, splitProps } from "solid-js";
import { FIELD_CHROME, FOCUS_RING } from "../lib/input-classes.js";
import { THUMB_CLASS, THUMB_RAIL_BLEED, THUMB_RAIL_PAD } from "../lib/thumb-classes.js";
import { cn } from "../lib/utils.js";

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

const Slider: Component<SliderProps> = (props) => {
  const [local] = splitProps(props, [
    "value",
    "defaultValue",
    "min",
    "max",
    "step",
    "disabled",
    "onChange",
    "onChangeEnd",
    "class",
    "trackClass",
    "thumbClass",
    "thumbColors",
    "fillTone",
    "markers",
    "minStepsBetweenThumbs",
    "aria-label",
    "aria-labelledby",
  ]);

  const markerPct = (v: number) => {
    const min = local.min ?? 0;
    const max = local.max ?? 100;
    return max === min ? 0 : ((v - min) / (max - min)) * 100;
  };

  return (
    <KSlider
      value={local.value}
      defaultValue={local.defaultValue}
      minValue={local.min ?? 0}
      maxValue={local.max ?? 100}
      step={local.step ?? 1}
      minStepsBetweenThumbs={local.minStepsBetweenThumbs}
      disabled={local.disabled}
      onChange={local.onChange}
      onChangeEnd={local.onChangeEnd}
      data-slot="slider"
      class={cn(
        // The rail wears the shared toggle/rail chrome, so it reads as an empty
        // well in both themes (a field's light-theme fill rises to the card).
        "relative flex w-full touch-none items-center rounded-xl select-none",
        THUMB_RAIL_PAD,
        FIELD_CHROME,
        local.disabled && "cursor-not-allowed opacity-50",
        local.class,
      )}
    >
      <KSlider.Track
        data-slot="slider-track"
        class={cn(
          "relative h-7 w-full",
          local.disabled ? "cursor-not-allowed" : "cursor-pointer",
          local.trackClass,
        )}
      >
        <KSlider.Fill
          data-slot="slider-fill"
          class={cn(
            // The fill sits sunk inside the recessed rail: the tinted-surface
            // outer drop shadow would read as a halo leaking out of the groove.
            "glass glass-tint absolute inset-y-0 rounded-xl [--glass-drop:0%] [--glass-wash:90%]",
            THUMB_RAIL_BLEED,
            Array.isArray(local.fillTone) && "glass-edge-gradient",
          )}
          style={
            Array.isArray(local.fillTone)
              ? {
                  "--glass-tone": local.fillTone[0],
                  "--glass-tone-2": local.fillTone[1],
                  "--glass-wash-2": "var(--glass-wash)",
                  "--glass-wash-angle": "90deg",
                }
              : { "--glass-tone": local.fillTone ?? "var(--material-accent)" }
          }
        />
        <Index each={local.markers ?? []}>
          {(marker) => (
            <span
              data-slot="slider-marker"
              class="pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${markerPct(marker())}%`,
                background: "color-mix(in oklab, var(--foreground) 60%, transparent)",
              }}
            />
          )}
        </Index>
        <Index each={local.value ?? local.defaultValue ?? [0]}>
          {(_, thumbIndex) => (
            <KSlider.Thumb
              data-slot="slider-thumb"
              class={cn(
                THUMB_CLASS,
                FOCUS_RING,
                "absolute top-0 transition-transform duration-200 ease-out hover:scale-125 active:scale-110",
                local.disabled && "cursor-not-allowed",
                local.thumbClass,
              )}
              aria-label={local["aria-label"]}
              aria-labelledby={local["aria-labelledby"]}
              style={{
                background: local.thumbColors?.[thumbIndex] ?? "var(--material-control-knob)",
              }}
            >
              <KSlider.Input />
            </KSlider.Thumb>
          )}
        </Index>
      </KSlider.Track>
    </KSlider>
  );
};

export { Slider };
