import { type Accessor, createSignal } from "solid-js";

/* Tailwind's `sm` edge, so the JS branch (dialog → bottom sheet, picker →
 * sheet, toast position) flips where the `sm:` utilities flip. */
export const MOBILE_BREAKPOINT = 640;

const shared = new Map<number, Accessor<boolean>>();

/** One reading and one listener per breakpoint for the page: a width read can force layout, so thirty dialogs mounting read it once. */
export function createIsMobile(
  breakpoint: number = MOBILE_BREAKPOINT,
): Accessor<boolean | undefined> {
  if (typeof window === "undefined") return () => undefined;
  let isMobile = shared.get(breakpoint);
  if (!isMobile) {
    const [value, setValue] = createSignal(window.innerWidth < breakpoint);
    window
      .matchMedia?.(`(max-width: ${breakpoint - 1}px)`)
      .addEventListener("change", () => setValue(window.innerWidth < breakpoint));
    isMobile = value;
    shared.set(breakpoint, isMobile);
  }
  return isMobile;
}
