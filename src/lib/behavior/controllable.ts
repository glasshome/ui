import { createSignal, untrack, type Accessor } from "solid-js";

export interface ControllableOptions<T> {
  value: Accessor<T | undefined>;
  defaultValue: Accessor<T>;
  onChange?: (next: T) => void;
  equals?: (a: T, b: T) => boolean;
}

export function createControllableSignal<T>(
  options: ControllableOptions<T>,
): [Accessor<T>, (next: T) => void] {
  // Boxed: a signal given a function would take it as a derivation.
  let written = untrack(options.defaultValue);
  const [stored, setStored] = createSignal({ value: written });
  const get = (): T => options.value() ?? stored().value;
  const set = (next: T) => {
    const same = options.equals ?? Object.is;
    // The stored signal lags until flush; two sets in one tick compare against the last one.
    if (same(next, untrack(options.value) ?? written)) return;
    written = next;
    setStored({ value: next });
    options.onChange?.(next);
  };
  return [get, set];
}
