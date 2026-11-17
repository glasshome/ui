import { createEffect, mergeProps, onCleanup, splitProps, untrack } from "solid-js";

export function effect<T>(compute: () => T, apply: (value: T) => (() => void) | void): void {
  createEffect(() => {
    const value = compute();
    const cleanup = untrack(() => apply(value));
    if (cleanup) onCleanup(cleanup);
  });
}

export const merge = mergeProps;

export function omit<T extends object, K extends keyof T>(
  props: T,
  ...keys: K[]
): { [P in keyof T as Exclude<P, K>]: T[P] } {
  return splitProps(props, keys)[1];
}
