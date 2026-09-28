import { createSignal, onCleanup, onMount } from "solid-js";

/* Tailwind's `sm` edge, so the JS branch (dialog → bottom sheet, picker →
 * sheet, toast position) flips where the `sm:` utilities flip. */
export const MOBILE_BREAKPOINT = 640;

export function createIsMobile(breakpoint: number = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = createSignal<boolean | undefined>(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : undefined,
  );

  onMount(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < breakpoint);
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < breakpoint);
    onCleanup(() => mql.removeEventListener("change", onChange));
  });

  return isMobile;
}
