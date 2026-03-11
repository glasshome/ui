import { Slider as KSlider } from "@kobalte/core/slider";
import type { Component } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "../lib/utils";

const THUMB_SIZE = 28;
const HALF_THUMB = THUMB_SIZE / 2;

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
    "aria-label",
    "aria-labelledby",
  ]);

  return (
    <KSlider
      value={local.value}
      defaultValue={local.defaultValue}
      minValue={local.min ?? 0}
      maxValue={local.max ?? 100}
      step={local.step ?? 1}
      disabled={local.disabled}
      onChange={local.onChange}
      onChangeEnd={local.onChangeEnd}
      class={cn(
        "relative flex w-full touch-none select-none items-center",
        local.disabled && "cursor-not-allowed opacity-50",
        local.class,
      )}
    >
      <KSlider.Track
        class={cn("relative w-full rounded-[var(--radius-xl)]", local.trackClass)}
        style={{
          height: `${THUMB_SIZE}px`,
          margin: `0 ${HALF_THUMB}px`,
          background: "color-mix(in oklch, var(--primary) 30%, transparent)",
          cursor: local.disabled ? "not-allowed" : "pointer",
        }}
      >
        <KSlider.Fill
          style={{
            position: "absolute",
            top: "0",
            bottom: "0",
            left: `${-HALF_THUMB}px`,
            "margin-right": `${-HALF_THUMB}px`,
            "border-radius": "var(--radius-xl)",
            background: "var(--primary)",
          }}
        />
        <KSlider.Thumb
          class={cn(
            "absolute top-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            local.disabled && "cursor-not-allowed",
            local.thumbClass,
          )}
          aria-label={local["aria-label"]}
          aria-labelledby={local["aria-labelledby"]}
          style={{
            width: `${THUMB_SIZE}px`,
            height: `${THUMB_SIZE}px`,
            "border-radius": "var(--radius-xl)",
            background: "var(--background)",
            border: "2px solid var(--primary)",
            "box-shadow": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        >
          <KSlider.Input />
        </KSlider.Thumb>
      </KSlider.Track>
    </KSlider>
  );
};

export { Slider };
