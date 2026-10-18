import { type Accessor, createEffect, onCleanup } from "solid-js";
import { trapFocus } from "../solid/bottom-sheet/focus-trap.js";

/** True for a node inside a shadow root, where page-level layer logic sees only the root's host. */
export const inShadowRoot = (node: Node | undefined): boolean =>
  node?.getRootNode() instanceof ShadowRoot;

/**
 * Kobalte's modal focus scope contains focus from the document, where every focus inside a shadow
 * root lands on the root's host, so a modal in a shadow root would pull focus back on every move.
 * There the dialog is not modal to Kobalte, and this keeps Tab inside it from the root instead.
 */
export function shadowFocus(content: Accessor<HTMLElement | undefined>): void {
  createEffect(() => {
    const el = content();
    if (!el || !inShadowRoot(el)) return;
    const trap = trapFocus(el, "first");
    onCleanup(() => trap.release());
  });
}

const NESTED_LAYER =
  '[data-kb-top-layer], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"]';

type OutsideEvent = { target: EventTarget | null; preventDefault(): void };

/**
 * Kobalte decides "outside" from the page, where a press or focus inside a shadow root is one on
 * the root's host, so a layer portaled into a shadow root would dismiss on every press inside it.
 * The returned handler (for the layer's `onInteractOutside`) ignores those; while the layer is in a
 * shadow root, a press elsewhere in that root dismisses it from a listener on the root itself.
 */
export function shadowLayer(
  content: Accessor<Element | undefined>,
  dismiss: () => void,
  onInteractOutside?: (e: never) => void,
): (e: OutsideEvent) => void {
  createEffect(() => {
    const el = content();
    const root = el?.getRootNode();
    if (!el || !(root instanceof ShadowRoot)) return;
    const onDown = (e: Event) => {
      const origin = e.composedPath()[0];
      if (!(origin instanceof Element) || el.contains(origin) || origin.closest(NESTED_LAYER)) {
        return;
      }
      dismiss();
    };
    // Listening only after the opening press has finished, as Kobalte's own layers do.
    const timer = setTimeout(() => root.addEventListener("pointerdown", onDown, true), 0);
    onCleanup(() => {
      clearTimeout(timer);
      root.removeEventListener("pointerdown", onDown, true);
    });
  });
  return (e) => {
    const root = content()?.getRootNode();
    if (root instanceof ShadowRoot && e.target === root.host) e.preventDefault();
    onInteractOutside?.(e as never);
  };
}
