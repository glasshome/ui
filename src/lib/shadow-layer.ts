import type { Accessor } from "solid-js";
import { createDismiss } from "./behavior/dismiss.js";
import { effect } from "./behavior/solid.js";
import {
  createFocusScope,
  focusWithoutTracking,
  type InitialFocus,
} from "./behavior/focus-scope.js";
import { registerLayer } from "./behavior/layer-stack.js";

/** True for a node inside a shadow root, where page-level layer logic sees only the root's host. */
export const inShadowRoot = (node: Node | undefined): boolean =>
  typeof ShadowRoot !== "undefined" && node?.getRootNode() instanceof ShadowRoot;

type OutsideEvent = { target: EventTarget | null; preventDefault(): void };
type AutoFocusEvent = { preventDefault(): void };

export interface LayerHandlers {
  onInteractOutside: (e: OutsideEvent) => void;
  onCloseAutoFocus: (e: AutoFocusEvent) => void;
  onOpenAutoFocus: (e: AutoFocusEvent) => void;
  /** The shadow root's host while the layer is in one: what the page sees as the target of anything inside. */
  host: () => Element | undefined;
}

interface ShadowLayerOptions {
  content: Accessor<HTMLElement | undefined>;
  open: Accessor<boolean>;
  /** Absent for layers that close on pointer leave (tooltips, hover cards): they never join the stack. */
  dismiss?: () => void;
  /** A press on it is the trigger's own toggle, never an outside press. */
  trigger?: Accessor<Element | undefined>;
  /** Menus: any press outside the layer and the layers above it dismisses it, newest or not, as Kobalte's menus do. */
  tree?: boolean;
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
  let dismissedIn: ShadowRoot | undefined;
  const handle = registerLayer({
    element: options.content,
    open: options.open,
    kind: !options.dismiss
      ? "tooltip"
      : options.trapsFocus
        ? "modal"
        : options.tree
          ? "menu"
          : "popover",
    escape: () => false,
    dismiss: options.dismiss,
    trigger: options.trigger,
  });
  createFocusScope({
    container: options.content,
    active: () =>
      !!options.trapsFocus &&
      !!options.dismiss &&
      options.open() &&
      inShadowRoot(options.content()),
    trapped: () => true,
    initialFocus: options.initialFocus ?? "first",
  });
  effect(options.open, (open) => {
    if (open) dismissedIn = undefined;
  });
  createDismiss({
    layer: handle,
    outsidePress: () => !!options.dismiss && inShadowRoot(options.content()),
    onDismiss: () => {
      const root = options.content()?.getRootNode();
      dismissedIn = root instanceof ShadowRoot ? root : undefined;
      options.dismiss?.();
      // The caller refused the close (a controlled `open`): the next close is not this one.
      if (options.open()) dismissedIn = undefined;
    },
  });
  const shadowHost = () => {
    const root = options.content()?.getRootNode();
    return typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot ? root.host : undefined;
  };
  return {
    host: shadowHost,
    onInteractOutside: (e) => {
      const host = shadowHost();
      if (host && e.target === host) {
        e.preventDefault();
        return;
      }
      options.consumer.onInteractOutside?.(e as never);
    },
    onCloseAutoFocus: (e) => {
      const root = dismissedIn;
      dismissedIn = undefined;
      if (root) {
        // Dismissed by a press elsewhere in the root: focus stays where that press put it, even
        // for the Kobalte layers that focus their trigger past preventDefault.
        e.preventDefault();
        const kept = root.activeElement;
        queueMicrotask(() => {
          if (kept instanceof HTMLElement && kept.isConnected && root.activeElement !== kept) {
            focusWithoutTracking(kept);
          }
        });
      }
      options.consumer.onCloseAutoFocus?.(e as never);
    },
    onOpenAutoFocus: (e) => {
      if (options.trapsFocus && shadowHost()) e.preventDefault();
      options.consumer.onOpenAutoFocus?.(e as never);
    },
  };
}
