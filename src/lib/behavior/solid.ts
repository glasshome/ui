import { createEffect, type JSX, mergeProps, onCleanup, splitProps, untrack } from "solid-js";

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

/** Solid's handler prop is a union: a plain function, or the bound
 *  `[handler, data]` form that calls `handler(data, event)`. A wrapper that
 *  only checks for a function silently drops the bound one. */
export function callEventHandler<T, E extends Event>(
  event: E & { currentTarget: T; target: Element },
  handler: JSX.EventHandlerUnion<T, E> | undefined,
): void {
  if (!handler) return;
  if (typeof handler === "function") handler(event);
  else handler[0](handler[1], event);
}
