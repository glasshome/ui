import { untrack } from "solid-js";
import type { JSX } from "@solidjs/web";

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

/** Hands the element to a forwarded `ref` prop, read once: a ref applies once per element. */
export function forwardRef<T>(read: () => unknown, el: T): void {
  const ref = untrack(read);
  if (typeof ref === "function") ref(el);
}
