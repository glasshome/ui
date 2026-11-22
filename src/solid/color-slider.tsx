import type { Component } from "solid-js";
import { createMemo, createSignal } from "solid-js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { focusWithoutTracking } from "../lib/behavior/focus-scope.js";
import { alongTrack, createDrag, createRange } from "../lib/behavior/range.js";
import {
  type Color,
  type ColorChannel,
  colorIntlTranslations,
  parseColor,
} from "../lib/color/index.js";
import { FOCUS_RING } from "../lib/input-classes.js";
import { readingDirection, type UiFormat } from "../lib/format.js";
import type { UiText } from "../lib/text.js";
import { THUMB_CLASS, THUMB_COLOR_RING, THUMB_RAIL_PAD } from "../lib/thumb-classes.js";
import { cn } from "../lib/utils.js";
import { useUiFormat, useUiText } from "./locale.js";

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

const rtl = readingDirection === "rtl";
const START = rtl ? "right" : "left";
const THUMB_SHIFT = rtl ? "translateX(50%)" : "translateX(-50%)";
const RED = parseColor("hsl(0, 100%, 50%)");

const valueText = (
  color: Color,
  channel: ColorChannel,
  text: UiText,
  format: UiFormat,
  names: ReturnType<typeof colorIntlTranslations>,
) => {
  const value = color.formatChannelValue(channel, format);
  if (channel === "alpha") return value;
  if (channel === "hue") {
    const hue = parseColor(`hsl(${color.getChannelValue("hue")}, 100%, 50%)`);
    return text("ui.color.value-named", { value, name: hue.getHueName(names) });
  }
  const name = color.withChannelValue("alpha", 1).getColorName(names, format);
  return text("ui.color.value-named", { value, name });
};

const ColorSlider: Component<ColorSliderProps> = (props) => {
  const disabled = () => props.disabled ?? false;
  const text = useUiText();
  const format = useUiFormat();
  const names = createMemo(() => colorIntlTranslations(text));
  const [color, setColor] = createControllableSignal({
    value: () => props.value,
    defaultValue: () => props.defaultValue ?? RED,
    onChange: (next) => props.onChange?.(next),
  });
  const channelRange = () => color().getChannelRange(props.channel);
  const range = createRange({
    values: () => [color().getChannelValue(props.channel)],
    defaultValues: () => [color().getChannelValue(props.channel)],
    min: () => channelRange().minValue,
    max: () => channelRange().maxValue,
    step: () => channelRange().step,
    disabled,
    onChange: ([v = 0]) => setColor(color().withChannelValue(props.channel, v)),
    onChangeEnd: ([v = 0]) => props.onChangeEnd?.(color().withChannelValue(props.channel, v)),
  });
  const percent = () => range.fraction(range.values()[0] ?? 0) * 100;
  const [thumb, setThumb] = createSignal<HTMLElement>();
  let grab = 0;

  const drag = createDrag({
    disabled,
    start: (e, rect) => {
      const at = alongTrack(e, rect);
      if (thumb()?.contains(e.target as Node)) {
        grab = at - percent() / 100;
      } else {
        const { minValue, maxValue } = channelRange();
        grab = 0;
        range.setThumb(0, minValue + at * (maxValue - minValue));
      }
      focusWithoutTracking(thumb());
    },
    move: (e, rect) => range.setThumb(0, range.valueAt(alongTrack(e, rect) - grab)),
    end: range.dragEnd,
  });

  // The channel gradient runs under the whole root, thumb padding included, so the ends show no bare strip.
  const gradient = () => {
    const c = color();
    const channel = props.channel;
    if (channel === "hue") {
      const stops = [0, 60, 120, 180, 240, 300, 360]
        .map((h) => c.withChannelValue("hue", h).toString("css"))
        .join(", ");
      return `linear-gradient(to right, ${stops})`;
    }
    const { minValue, maxValue } = c.getChannelRange(channel);
    const start = c.withChannelValue(channel, minValue).toString("css");
    const end = c.withChannelValue(channel, maxValue).toString("css");
    if (channel === "lightness") {
      const middle = c.withChannelValue(channel, (maxValue - minValue) / 2).toString("css");
      return `linear-gradient(to right, ${start}, ${middle}, ${end})`;
    }
    return `linear-gradient(to right, ${start}, ${end})`;
  };

  const disabledMark = () => (disabled() ? "" : undefined);

  return (
    <div
      role="group"
      data-slot="color-slider"
      data-orientation="horizontal"
      data-disabled={disabledMark()}
      class={cn(
        "relative flex w-full touch-none items-center rounded-xl select-none",
        THUMB_RAIL_PAD,
        disabled() && "cursor-not-allowed opacity-50",
        props.class,
      )}
      style={{ background: gradient() }}
    >
      <div
        data-slot="color-slider-track"
        data-orientation="horizontal"
        data-disabled={disabledMark()}
        class={cn("relative h-7 w-full", disabled() ? "cursor-not-allowed" : "cursor-pointer")}
        style={{ "forced-color-adjust": "none" }}
        on:pointerdown={drag.onPointerDown}
        on:pointermove={drag.onPointerMove}
        on:pointerup={drag.onPointerUp}
        on:pointercancel={drag.onPointerCancel}
      >
        <span
          ref={setThumb}
          role="slider"
          data-slot="color-slider-thumb"
          data-orientation="horizontal"
          data-disabled={disabledMark()}
          tabIndex={disabled() ? undefined : 0}
          aria-label={props["aria-label"] ?? props.channel}
          aria-valuemin={channelRange().minValue}
          aria-valuemax={channelRange().maxValue}
          aria-valuenow={range.values()[0]}
          aria-valuetext={valueText(color(), props.channel, text, format, names())}
          aria-orientation="horizontal"
          aria-disabled={disabled() || undefined}
          class={cn(
            THUMB_CLASS,
            FOCUS_RING,
            THUMB_COLOR_RING,
            "absolute top-0",
            disabled() && "cursor-not-allowed",
          )}
          style={{
            [START]: `calc(${percent()}%)`,
            transform: THUMB_SHIFT,
            "touch-action": "none",
            "forced-color-adjust": "none",
            background: color().toString("css"),
          }}
          on:keydown={(e) => range.keyDown(e, 0)}
          onBlur={range.blur}
        />
      </div>
    </div>
  );
};

export { ColorSlider };
