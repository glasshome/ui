import { ColorSlider as KColorSlider } from "@kobalte/core/color-slider";
import type { Color, ColorChannel } from "@kobalte/core/colors";
import type { Component } from "solid-js";
import { splitProps } from "solid-js";
import { FOCUS_RING } from "../lib/input-classes.js";
import { THUMB_CLASS, THUMB_COLOR_RING, THUMB_RAIL_PAD } from "../lib/thumb-classes.js";
import { cn } from "../lib/utils.js";

interface ColorSliderProps {
  value?: Color;
  defaultValue?: Color;
  channel: ColorChannel;
  onChange?: (value: Color) => void;
  onChangeEnd?: (value: Color) => void;
  disabled?: boolean;
  class?: string;
  "aria-label"?: string;
}

const ColorSlider: Component<ColorSliderProps> = (props) => {
  const [local] = splitProps(props, [
    "value",
    "defaultValue",
    "channel",
    "onChange",
    "onChangeEnd",
    "disabled",
    "class",
    "aria-label",
  ]);

  // Kobalte paints the channel gradient on the (half-thumb padded) track, which
  // leaves naked strips at the ends, so we rebuild it on the full-width root.
  const gradient = () => {
    const color = local.value ?? local.defaultValue;
    if (!color) return undefined;
    const channel = local.channel;
    if (channel === "hue") {
      const stops = [0, 60, 120, 180, 240, 300, 360]
        .map((h) => color.withChannelValue("hue", h).toString("css"))
        .join(", ");
      return `linear-gradient(to right, ${stops})`;
    }
    const { minValue, maxValue } = color.getChannelRange(channel);
    const start = color.withChannelValue(channel, minValue).toString("css");
    const end = color.withChannelValue(channel, maxValue).toString("css");
    if (channel === "lightness") {
      const middle = color.withChannelValue(channel, (maxValue - minValue) / 2).toString("css");
      return `linear-gradient(to right, ${start}, ${middle}, ${end})`;
    }
    return `linear-gradient(to right, ${start}, ${end})`;
  };

  return (
    <KColorSlider
      value={local.value}
      defaultValue={local.defaultValue}
      channel={local.channel}
      onChange={local.onChange}
      onChangeEnd={local.onChangeEnd}
      disabled={local.disabled}
      data-slot="color-slider"
      class={cn(
        "relative flex w-full touch-none items-center rounded-xl select-none",
        THUMB_RAIL_PAD,
        local.disabled && "cursor-not-allowed opacity-50",
        local.class,
      )}
      style={{ background: gradient() }}
    >
      <KColorSlider.Track
        data-slot="color-slider-track"
        class={cn("relative h-7 w-full", local.disabled ? "cursor-not-allowed" : "cursor-pointer")}
        // Kobalte paints the channel gradient as an inline background here, which
        // no class can beat; clearing it inline is what keeps the root's
        // full-width gradient the only one.
        style={{ background: "none" }}
      >
        <KColorSlider.Thumb
          data-slot="color-slider-thumb"
          class={cn(
            THUMB_CLASS,
            FOCUS_RING,
            THUMB_COLOR_RING,
            "absolute top-0",
            local.disabled && "cursor-not-allowed",
          )}
          aria-label={local["aria-label"] ?? local.channel}
          style={{ background: "var(--kb-color-current)" }}
        >
          <KColorSlider.Input />
        </KColorSlider.Thumb>
      </KColorSlider.Track>
    </KColorSlider>
  );
};

export { ColorSlider };
