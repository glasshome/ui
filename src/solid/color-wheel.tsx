import { type Component } from "solid-js";
import { createMemo, createSignal } from "solid-js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { focusWithoutTracking } from "../lib/behavior/focus-scope.js";
import {
  createDrag,
  DRAG_CLAIM,
  RANGE_CLAIM,
  type RangeKey,
  rangeKeyOf,
} from "../lib/behavior/range.js";
import { type Color, colorIntlTranslations, parseColor } from "../lib/color/index.js";
import { FOCUS_RING } from "../lib/input-classes.js";
import { THUMB_CLASS, THUMB_COLOR_RING, THUMB_SIZE } from "../lib/thumb-classes.js";
import { cn } from "../lib/utils.js";
import { useUiFormat, useUiText } from "./locale.js";

interface ColorWheelProps {
  value?: Color;
  defaultValue?: Color;
  onChange?: (value: Color) => void;
  onChangeEnd?: (value: Color) => void;
  /** Wheel diameter in px */
  size?: number;
  /** Ring thickness, 0-100 relative to the radius */
  thickness?: number;
  disabled?: boolean;
  class?: string;
  "aria-label"?: string;
}

const RED = parseColor("hsl(0, 100%, 50%)");
const PAGE = 15;
const RING = `conic-gradient(from 90deg, ${Array.from({ length: 13 }, (_, i) => `hsl(${i * 30} 100% 50%)`).join(", ")})`;

const mod = (n: number, m: number) => ((n % m) + m) % m;
const roundToStep = (value: number, step: number) => Math.round(value / step) * step;
const roundDown = (v: number) => (Math.floor(v) === v ? v - 1 : Math.floor(v));
const angleOf = (x: number, y: number) => mod((Math.atan2(y, x) * 180) / Math.PI, 360);

const ColorWheel: Component<ColorWheelProps> = (props) => {
  const size = () => props.size ?? 200;
  // A percentage of the radius sized to the px thumb; past 100 the mask radius goes negative.
  const thickness = () =>
    props.thickness ?? Math.min(100, Math.ceil((THUMB_SIZE / (size() / 2)) * 100));
  const disabled = () => props.disabled ?? false;
  const text = useUiText();
  const format = useUiFormat();
  const names = createMemo(() => colorIntlTranslations(text));
  const [value, setValue] = createControllableSignal({
    value: () => props.value,
    defaultValue: () => props.defaultValue ?? RED,
    onChange: (next) => props.onChange?.(next),
  });
  const color = createMemo(() => {
    const v = value();
    const space = v.getColorSpace();
    return space === "hsl" || space === "hsb" ? v : v.toFormat("hsl");
  });
  const hue = () => color().getChannelValue("hue");
  const outerRadius = () => size() / 2;
  const thumbRadius = () => ((139.75 - (thickness() / 100) * 70) * outerRadius()) / 140;
  const [thumb, setThumb] = createSignal<HTMLElement>();
  let keyed = false;

  const setHue = (next: number) => {
    if (disabled()) return;
    const turned = roundToStep(mod(next > 360 ? 0 : next, 360), 1);
    if (hue() !== turned) setValue(color().withChannelValue("hue", turned));
  };
  const increment = (by: number) => {
    const step = Math.max(by, 1);
    const next = hue() + step;
    setHue(roundToStep(mod(next >= 360 ? 0 : next, 360), step));
  };
  const decrement = (by: number) => {
    const step = Math.max(by, 1);
    if (hue() === 0) setHue(roundDown(360 / step) * step);
    else setHue(roundToStep(mod(hue() - step, 360), step));
  };
  const ACTIONS: Record<RangeKey, () => void> = {
    decrease: () => decrement(1),
    increase: () => increment(1),
    pageDown: () => decrement(PAGE),
    pageUp: () => increment(PAGE),
    first: () => setHue(0),
    last: () => setHue(360),
  };

  const pointerHue = (e: PointerEvent, rect: DOMRect) =>
    angleOf(e.clientX - rect.left - rect.width / 2, e.clientY - rect.top - rect.height / 2);

  const drag = createDrag({
    disabled,
    start: (e, rect) => {
      focusWithoutTracking(thumb());
      setHue(pointerHue(e, rect));
    },
    move: (e, rect) => setHue(pointerHue(e, rect)),
    end: () => props.onChangeEnd?.(color()),
  });

  const onKeyDown = (e: KeyboardEvent) => {
    const key = rangeKeyOf(e);
    if (!key || disabled()) return;
    e.preventDefault();
    e.stopPropagation();
    keyed = true;
    ACTIONS[key]();
  };
  const onBlur = () => {
    if (!keyed) return;
    keyed = false;
    props.onChangeEnd?.(color());
  };

  const disabledMark = () => (disabled() ? "" : undefined);
  const place = () => {
    const a = (hue() * Math.PI) / 180;
    return {
      x: outerRadius() + thumbRadius() * Math.cos(a),
      y: outerRadius() + thumbRadius() * Math.sin(a),
    };
  };

  return (
    <div
      role="group"
      data-slot="color-wheel"
      data-disabled={disabledMark()}
      class={cn(
        "relative touch-none select-none",
        disabled() && "cursor-not-allowed opacity-50",
        props.class,
      )}
      style={{ width: `${size()}px`, height: `${size()}px` }}
    >
      <div
        data-slot="color-wheel-track"
        data-disabled={disabledMark()}
        class={cn("h-full w-full", disabled() ? "cursor-not-allowed" : "cursor-pointer")}
        style={{
          "touch-action": "none",
          "forced-color-adjust": "none",
          background: RING,
          "clip-path": "circle(50%)",
          mask: `radial-gradient(#0000 ${70 - (thickness() / 100) * 70}%, #000 ${70.5 - (thickness() / 100) * 70}%)`,
        }}
        data-claim={disabled() ? undefined : DRAG_CLAIM}
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onPointerCancel={drag.onPointerCancel}
      >
        {/* Always a circle: the thumb rides a circular track, theme corner radius looks broken there. */}
        <span
          ref={setThumb}
          role="slider"
          data-slot="color-wheel-thumb"
          data-disabled={disabledMark()}
          tabindex={disabled() ? undefined : 0}
          aria-label={props["aria-label"] ?? text("ui.color-wheel.label")}
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={hue()}
          aria-valuetext={text("ui.color.value-named", {
            value: color().formatChannelValue("hue", format),
            name: color().getHueName(names()),
          })}
          aria-disabled={disabled() ? "true" : undefined}
          class={cn(THUMB_CLASS, FOCUS_RING, THUMB_COLOR_RING, "rounded-full")}
          style={{
            position: "absolute",
            left: `${place().x}px`,
            top: `${place().y}px`,
            transform: "translate(-50%, -50%)",
            "forced-color-adjust": "none",
            "touch-action": "none",
            background: color().toString("css"),
          }}
          data-claim={disabled() ? undefined : RANGE_CLAIM}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
};

export { ColorWheel };
