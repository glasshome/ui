import { type Accessor, createEffect, onCleanup } from "solid-js";
import { type InitialFocus, trapFocus } from "../solid/bottom-sheet/focus-trap.js";

/** True for a node inside a shadow root, where page-level layer logic sees only the root's host. */
export const inShadowRoot = (node: Node | undefined): boolean =>
  typeof ShadowRoot !== "undefined" && node?.getRootNode() instanceof ShadowRoot;

/** Layers open in each shadow root, oldest first: only the newest dismisses on a press, as Kobalte's own stack does. */
const stacks = new WeakMap<ShadowRoot, Element[]>();

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
  createEffect(() => {
    const el = options.content();
    const dismiss = options.dismiss;
    if (options.open()) dismissedIn = undefined;
    if (!el || !dismiss || !options.open() || !inShadowRoot(el)) return;
    const root = el.getRootNode() as ShadowRoot;
    const stack = stacks.get(root) ?? [];
    stacks.set(root, stack);
    stack.push(el);
    const inside = (e: Event) => {
      const path = e.composedPath();
      const trigger = options.trigger?.();
      if (path.includes(el) || (trigger && path.includes(trigger))) return true;
      return stack.slice(stack.indexOf(el) + 1).some((above) => path.includes(above));
    };
    const dismisses = (e: Event) => (options.tree || stack[stack.length - 1] === el) && !inside(e);
    const close = () => {
      dismissedIn = root;
      dismiss();
      // The caller refused the close (a controlled `open`): the next close is not this one.
      if (options.open()) dismissedIn = undefined;
    };
    let pendingClick: ((e: Event) => void) | undefined;
    const dropPendingClick = () => {
      if (pendingClick) root.removeEventListener("click", pendingClick);
      pendingClick = undefined;
    };
    const onDown = (e: Event) => {
      dropPendingClick();
      if (!dismisses(e)) return;
      // A touch dismisses on its own click, judged again then: a scroll never clicks.
      if ((e as PointerEvent).pointerType === "touch") {
        pendingClick = (click) => {
          pendingClick = undefined;
          if (dismisses(click)) close();
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
      dropPendingClick();
      stack.splice(stack.indexOf(el), 1);
    });
  });
  const shadowHost = () => {
    const root = options.content()?.getRootNode();
    return typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot ? root.host : undefined;
  };
  return {
    host: shadowHost,
    onInteractOutside: (e) => {
      const host = shadowHost();
      if (host && e.target === host) e.preventDefault();
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
            kept.focus();
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
