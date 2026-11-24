import { type Accessor, createMemo } from "solid-js";
import { readingDirection } from "../locale.js";
import { keepKeys } from "./claims.js";
import { createControllableSignal } from "./controllable.js";

function snapValueToStep(value: number, min: number, max: number, step: number): number {
  const remainder = (value - (Number.isNaN(min) ? 0 : min)) % step;
  let snapped =
    Math.abs(remainder) * 2 >= step
      ? value + Math.sign(remainder) * (step - Math.abs(remainder))
      : value - remainder;
  if (!Number.isNaN(min)) {
    if (snapped < min) snapped = min;
    else if (!Number.isNaN(max) && snapped > max)
      snapped = min + Math.floor((max - min) / step) * step;
  } else if (!Number.isNaN(max) && snapped > max) {
    snapped = Math.floor(max / step) * step;
  }
  const text = step.toString();
  const point = text.indexOf(".");
  const precision = point >= 0 ? text.length - point : 0;
  if (precision > 0) {
    const pow = 10 ** precision;
    snapped = Math.round(snapped * pow) / pow;
  }
  return snapped;
}

const pageSizeOf = (min: number, max: number, step: number): number => {
  const tenth = (max - min) / 10;
  return Math.max(snapValueToStep(tenth, 0, tenth + step, step), step);
};

export type RangeKey = "decrease" | "increase" | "pageDown" | "pageUp" | "first" | "last";

const LTR_KEYS: Record<string, RangeKey> = {
  ArrowLeft: "decrease",
  ArrowDown: "decrease",
  ArrowRight: "increase",
  ArrowUp: "increase",
  PageDown: "pageDown",
  PageUp: "pageUp",
  Home: "first",
  End: "last",
};

const RTL_KEYS: Record<string, RangeKey> = {
  ...LTR_KEYS,
  ArrowLeft: "increase",
  ArrowRight: "decrease",
};

const SHIFTED: Partial<Record<RangeKey, RangeKey>> = { decrease: "pageDown", increase: "pageUp" };

/** The claim a range's thumb makes on the keys it handles. */
export const RANGE_CLAIM = keepKeys(Object.keys(LTR_KEYS));

/** The claim a drag surface makes on the press that starts a drag. */
export const DRAG_CLAIM = "prevent:pointerdown";

export function rangeKeyOf(e: KeyboardEvent): RangeKey | undefined {
  const key = (readingDirection === "rtl" ? RTL_KEYS : LTR_KEYS)[e.key];
  if (!key) return undefined;
  return (e.shiftKey && SHIFTED[key]) || key;
}

export interface RangeOptions {
  values: Accessor<number[] | undefined>;
  defaultValues: Accessor<number[]>;
  min: Accessor<number>;
  max: Accessor<number>;
  step: Accessor<number>;
  minStepsBetween?: Accessor<number>;
  disabled: Accessor<boolean>;
  onChange?: (values: number[]) => void;
  onChangeEnd?: (values: number[]) => void;
}

export interface Range {
  values: Accessor<number[]>;
  fraction: (value: number) => number;
  valueAt: (fraction: number) => number;
  setThumb: (index: number, value: number) => void;
  closestThumb: (value: number) => number;
  keyDown: (e: KeyboardEvent, index: number) => void;
  blur: () => void;
  dragEnd: () => void;
}

const sameValues = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/** Thumbs on a stepped linear track that never cross; a key change ends on blur, a drag on release. */
export function createRange(options: RangeOptions): Range {
  const [values, setValues] = createControllableSignal({
    value: options.values,
    defaultValue: options.defaultValues,
    onChange: (next) => options.onChange?.(next),
    equals: sameValues,
  });
  const gap = () => (options.minStepsBetween?.() ?? 0) * options.step();
  const pageSize = createMemo(() => pageSizeOf(options.min(), options.max(), options.step()));
  let keyed = false;

  const bounds = (index: number): [number, number] => {
    const all = values();
    const below = all[index - 1];
    const above = all[index + 1];
    return [
      below === undefined ? options.min() : below + gap(),
      above === undefined ? options.max() : above - gap(),
    ];
  };

  const setThumb = (index: number, value: number) => {
    if (options.disabled()) return;
    const [low, high] = bounds(index);
    const next = values().slice();
    next[index] = snapValueToStep(value, low, high, options.step());
    setValues(next);
  };

  const nudge = (index: number, by: number) => {
    const current = values()[index];
    if (current === undefined) return;
    setThumb(index, snapValueToStep(current + by, options.min(), options.max(), options.step()));
  };

  const fraction = (value: number) => {
    const span = options.max() - options.min();
    return span === 0 ? 0 : (value - options.min()) / span;
  };

  const valueAt = (at: number) => {
    const min = options.min();
    const max = options.max();
    const step = options.step();
    const raw = at * (max - min) + min;
    return Math.min(max, Math.max(min, Math.round((raw - min) / step) * step + min));
  };

  const closestThumb = (value: number) => {
    const distances = values().map((v) => Math.abs(v - value));
    const closest = Math.min(...distances);
    const first = distances.indexOf(closest);
    return value < (values()[first] ?? 0) ? first : distances.lastIndexOf(closest);
  };

  const ACTIONS: Record<RangeKey, (index: number) => void> = {
    decrease: (i) => nudge(i, -options.step()),
    increase: (i) => nudge(i, options.step()),
    pageDown: (i) => nudge(i, -pageSize()),
    pageUp: (i) => nudge(i, pageSize()),
    first: (i) => setThumb(i, bounds(i)[0]),
    last: (i) => setThumb(i, bounds(i)[1]),
  };

  const keyDown = (e: KeyboardEvent, index: number) => {
    const key = rangeKeyOf(e);
    if (!key || options.disabled()) return;
    e.preventDefault();
    e.stopPropagation();
    keyed = true;
    ACTIONS[key](index);
  };

  const blur = () => {
    if (!keyed) return;
    keyed = false;
    options.onChangeEnd?.(values());
  };

  const dragEnd = () => options.onChangeEnd?.(values());

  return { values, fraction, valueAt, setThumb, closestThumb, keyDown, blur, dragEnd };
}

export const alongTrack = (e: PointerEvent, rect: DOMRect): number =>
  (readingDirection === "rtl" ? rect.right - e.clientX : e.clientX - rect.left) / rect.width;

type Pointer = PointerEvent & { currentTarget: HTMLElement };

export interface DragOptions {
  disabled: Accessor<boolean>;
  start: (e: PointerEvent, rect: DOMRect) => void;
  move: (e: PointerEvent, rect: DOMRect) => void;
  end: () => void;
}

/** One primary-pointer drag at a time, captured on the pressed element, its rect read once per drag. */
export function createDrag(options: DragOptions) {
  let pointer: number | undefined;
  let rect: DOMRect | undefined;

  const finish = (e: Pointer) => {
    if (e.pointerId !== pointer) return;
    pointer = undefined;
    rect = undefined;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    options.end();
  };

  return {
    onPointerDown: (e: Pointer) => {
      if (options.disabled() || e.button !== 0 || pointer !== undefined) return;
      e.preventDefault();
      pointer = e.pointerId;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      rect = e.currentTarget.getBoundingClientRect();
      options.start(e, rect);
    },
    onPointerMove: (e: Pointer) => {
      if (e.pointerId === pointer && rect) options.move(e, rect);
    },
    onPointerUp: finish,
    onPointerCancel: finish,
  };
}
