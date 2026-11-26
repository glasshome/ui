import { type Accessor, createSignal } from "solid-js";

/** A value one part holds at a time; a part's release clears it only while that part still holds it. */
export function createSlot<T>(): [
  Accessor<T | undefined>,
  (next: T | undefined) => void,
  (held: T) => void,
] {
  // The signal lags until flush; ownership answers from the last write.
  let written: T | undefined;
  const [value, setValue] = createSignal<T | undefined>();
  const set = (next: T | undefined) => {
    written = next;
    setValue(() => next);
  };
  const release = (held: T) => {
    if (written === held) set(undefined);
  };
  return [value, set, release];
}
