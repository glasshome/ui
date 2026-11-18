import { type Accessor, createContext, createSignal, onCleanup, useContext } from "solid-js";
import { createDismiss } from "./behavior/dismiss.js";
import { effect } from "./behavior/solid.js";
import { focusWithoutTracking } from "./behavior/focus-scope.js";
import { registerLayer } from "./behavior/layer-stack.js";

/** True for a node inside a shadow root, where page-level layer logic sees only the root's host. */
export const inShadowRoot = (node: Node | undefined): boolean =>
  typeof ShadowRoot !== "undefined" && node?.getRootNode() instanceof ShadowRoot;

export const ReportCovered = createContext<(covered: Accessor<boolean>) => void>();

/**
 * For a Kobalte root that can be modal: true while one of its layers sits under an owned modal.
 * Kobalte steps aside only for its own layers, so a modal Kobalte layer would hide the owned modal,
 * block its pointer events and pull its focus back; the root drops `modal` while covered.
 */
export function createCoveredRoot(): {
  covered: Accessor<boolean>;
  report: (covered: Accessor<boolean>) => void;
} {
  const [reporters, setReporters] = createSignal<readonly Accessor<boolean>[]>([]);
  return {
    covered: () => reporters().some((covered) => covered()),
    report: (covered) => {
      setReporters((list) => [...list, covered]);
      onCleanup(() => setReporters((list) => list.filter((other) => other !== covered)));
    },
  };
}

type OutsideEvent = { target: EventTarget | null; preventDefault(): void };
type AutoFocusEvent = { preventDefault(): void };

export interface LayerHandlers {
  onInteractOutside: (e: OutsideEvent) => void;
  onCloseAutoFocus: (e: AutoFocusEvent) => void;
  /** The shadow root's host while the layer is in one: what the page sees as the target of anything inside. */
  host: () => Element | undefined;
  /** An owned modal sits above the layer: the modal owns every press and focus until it closes. */
  covered: Accessor<boolean>;
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
  consumer: {
    onInteractOutside?: (e: never) => void;
    onCloseAutoFocus?: (e: never) => void;
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
    kind: !options.dismiss ? "tooltip" : options.tree ? "menu" : "popover",
    escape: () => false,
    readsOwnEscape: true,
    dismiss: options.dismiss,
    trigger: options.trigger,
  });
  effect(options.open, (open) => {
    if (open) dismissedIn = undefined;
  });
  const covered = () => options.open() && handle.above().some((layer) => layer.kind === "modal");
  useContext(ReportCovered)?.(covered);
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
    covered,
    onInteractOutside: (e) => {
      const host = shadowHost();
      if (covered() || (host && e.target === host)) {
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
  };
}
