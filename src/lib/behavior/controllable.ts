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
  const [stored, setStored] = createSignal<T>(untrack(options.defaultValue), { equals: false });
  const get = (): T => options.value() ?? stored();
  const set = (next: T) => {
    const same = options.equals ?? Object.is;
    if (same(next, untrack(get))) return;
    setStored(() => next);
    options.onChange?.(next);
  };
  return [get, set];
}
