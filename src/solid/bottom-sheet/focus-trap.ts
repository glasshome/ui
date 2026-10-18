import { untrack } from "solid-js";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type InitialFocus = "container" | "first" | ((root: HTMLElement) => HTMLElement | null);

interface TrapHandle {
  release: () => void;
}

export function trapFocus(root: HTMLElement, initial: InitialFocus = "container"): TrapHandle {
  // Inside a shadow root the document's active element is the root's host; the root knows which node has focus.
  const scope = root.getRootNode() as Document | ShadowRoot;
  const previouslyFocused = (scope.activeElement as HTMLElement | null) ?? null;

  // focus() runs focus and blur handlers synchronously; a caller's effect must not track their reads.
  untrack(() => {
    const focusTarget: HTMLElement | null =
      initial === "container"
        ? root
        : initial === "first"
          ? (root.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? root)
          : initial(root);
    focusTarget?.focus({ preventScroll: true });
  });

  const onKeyDown = (event: Event) => {
    const e = event as KeyboardEvent;
    if (e.key !== "Tab") return;
    const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
    );
    if (focusable.length === 0) {
      e.preventDefault();
      root.focus({ preventScroll: true });
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = scope.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      if (active === first || active === root || !root.contains(active)) {
        e.preventDefault();
        last?.focus({ preventScroll: true });
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first?.focus({ preventScroll: true });
      }
    }
  };

  scope.addEventListener("keydown", onKeyDown);

  return {
    release() {
      scope.removeEventListener("keydown", onKeyDown);
      untrack(() => previouslyFocused?.focus?.({ preventScroll: true }));
    },
  };
}
