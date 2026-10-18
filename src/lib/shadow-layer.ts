import { type Accessor, createEffect, onCleanup } from "solid-js";
import { type InitialFocus, trapFocus } from "../solid/bottom-sheet/focus-trap.js";

/** True for a node inside a shadow root, where page-level layer logic sees only the root's host. */
export const inShadowRoot = (node: Node | undefined): boolean =>
  typeof ShadowRoot !== "undefined" && node?.getRootNode() instanceof ShadowRoot;

/** Layers open inside shadow roots, oldest first: only the newest dismisses on a press, as Kobalte's own stack does. */
const stack: Element[] = [];

type OutsideEvent = { target: EventTarget | null; preventDefault(): void };
type AutoFocusEvent = { preventDefault(): void };

export interface LayerHandlers {
  onInteractOutside: (e: OutsideEvent) => void;
  onCloseAutoFocus: (e: AutoFocusEvent) => void;
  onOpenAutoFocus: (e: AutoFocusEvent) => void;
}

interface ShadowLayerOptions {
  content: Accessor<HTMLElement | undefined>;
  open: Accessor<boolean>;
  /** Absent for layers that close on pointer leave (tooltips, hover cards): they never join the stack. */
  dismiss?: () => void;
  /** The layer keeps Tab inside itself (dialogs); its initial focus is then ui's, not Kobalte's. */
  trapsFocus?: boolean;
  initialFocus?: InitialFocus;
  consumer: {
    onInteractOutside?: (e: never) => void;
    onCloseAutoFocus?: (e: never) => void;
    onOpenAutoFocus?: (e: never) => void;
  };
}

/**
 * Kobalte decides "outside" from the page, where a press or focus inside a shadow root is one on
 * the root's host, so a layer portaled into a shadow root would dismiss on every press inside it.
 * The handlers ignore those; while the layer is open in a shadow root, a press elsewhere in that
 * root dismisses the newest layer from a listener on the root itself. Outside a shadow root the
 * handlers only pass the consumer's own through.
 */
export function shadowLayer(options: ShadowLayerOptions): LayerHandlers {
  let dismissedHere = false;
  createEffect(() => {
    const el = options.content();
    const dismiss = options.dismiss;
    if (!el || !dismiss || !options.open() || !inShadowRoot(el)) return;
    const root = el.getRootNode() as ShadowRoot;
    stack.push(el);
    let pendingClick: (() => void) | undefined;
    const onDown = (e: Event) => {
      if (stack[stack.length - 1] !== el || e.composedPath().includes(el)) return;
      const close = () => {
        dismissedHere = true;
        dismiss();
      };
      // A touch dismisses on its click, so a scroll that starts outside never closes the layer.
      if ((e as PointerEvent).pointerType === "touch") {
        if (pendingClick) root.removeEventListener("click", pendingClick);
        pendingClick = () => {
          pendingClick = undefined;
          close();
        };
        root.addEventListener("click", pendingClick, { once: true });
      } else {
        close();
      }
    };
    // Listening only after the opening press has finished, as Kobalte's own layers do.
    const timer = setTimeout(() => root.addEventListener("pointerdown", onDown, true), 0);
    if (options.trapsFocus) {
      const trap = trapFocus(el, options.initialFocus ?? "first");
      onCleanup(() => trap.release());
    }
    onCleanup(() => {
      clearTimeout(timer);
      root.removeEventListener("pointerdown", onDown, true);
      if (pendingClick) root.removeEventListener("click", pendingClick);
      stack.splice(stack.indexOf(el), 1);
    });
  });
  const shadowHost = () => {
    const root = options.content()?.getRootNode();
    return typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot ? root.host : undefined;
  };
  return {
    onInteractOutside: (e) => {
      const host = shadowHost();
      if (host && e.target === host) e.preventDefault();
      options.consumer.onInteractOutside?.(e as never);
    },
    onCloseAutoFocus: (e) => {
      // Dismissed by a press elsewhere in the root: focus stays where that press put it.
      if (dismissedHere) e.preventDefault();
      dismissedHere = false;
      options.consumer.onCloseAutoFocus?.(e as never);
    },
    onOpenAutoFocus: (e) => {
      if (options.trapsFocus && shadowHost()) e.preventDefault();
      options.consumer.onOpenAutoFocus?.(e as never);
    },
  };
}
