import type { Accessor } from "solid-js";
import { type Layer, type LayerHandle, layerStack } from "./layer-stack";
import { effect } from "./solid";

export type DismissReason = "escape" | "outside-press" | "focus-outside";

export interface DismissOptions {
  layer: LayerHandle;
  /** `event` is the keydown for `escape`, the pointerdown for `outside-press` and the focusin for `focus-outside`. */
  onDismiss: (reason: DismissReason, event: KeyboardEvent | PointerEvent | FocusEvent) => void;
  outsidePress?: Accessor<boolean>;
  /** Off unless asked: a non-modal layer closes when focus lands outside it. */
  focusOutside?: Accessor<boolean>;
  escapeFrom?: "layer" | "document";
}

const SHADOW_ROOT_NODE = 11;

function rootOf(element: HTMLElement): Document | ShadowRoot {
  const root = typeof element.getRootNode === "function" ? element.getRootNode() : document;
  return root.nodeType === SHADOW_ROOT_NODE ? (root as ShadowRoot) : document;
}

const takesKeys = (entry: Layer): boolean => entry.element() !== undefined;

// A layer in a shadow root tops its own root: layers newer in other roots never shield it.
function topsItsRoot(layer: LayerHandle, mine: Layer): boolean {
  if (layer.isTop()) return true;
  const root = mine.element()?.getRootNode();
  if (root?.nodeType !== SHADOW_ROOT_NODE) return false;
  return !layer
    .above()
    .some((other) => other.kind !== "tooltip" && other.element()?.getRootNode() === root);
}

function isOutside(layer: LayerHandle, event: Event): boolean {
  const mine = layer.layer();
  if (!mine || (mine.kind !== "menu" && !topsItsRoot(layer, mine))) return false;
  const full = event.composedPath();
  const listener = event.currentTarget;
  const end = listener === document || !listener ? -1 : full.indexOf(listener);
  return !layer.containsPath(end >= 0 ? full.slice(0, end) : full);
}

function listenersFor(element: HTMLElement) {
  const root = rootOf(element);
  const host = root === document ? undefined : (root as ShadowRoot).host;
  return { host, targets: host ? [root, document] : [root] };
}

function createFocusOutside(options: DismissOptions) {
  const { layer } = options;
  effect(
    () => [layer.layer()?.element(), options.focusOutside?.() ?? false] as const,
    ([element, enabled]) => {
      if (!element || !enabled) return;
      const { host, targets } = listenersFor(element);
      const onFocus = (event: FocusEvent) => {
        if (event.currentTarget === document && host && event.target === host) return;
        if (isOutside(layer, event)) options.onDismiss("focus-outside", event);
      };
      const listener = onFocus as EventListener;
      // After the tick that opened it: focus moved by the opening itself is never outside.
      const timer = setTimeout(() => {
        for (const target of targets) target.addEventListener("focusin", listener, true);
      }, 0);
      return () => {
        clearTimeout(timer);
        for (const target of targets) target.removeEventListener("focusin", listener, true);
      };
    },
  );
}

function createOutsidePress(options: DismissOptions) {
  const { layer } = options;
  effect(
    () => [layer.layer()?.element(), options.outsidePress?.() ?? true] as const,
    ([element, enabled]) => {
      if (!element || !enabled) return;
      const { host, targets } = listenersFor(element);
      const outside = (event: Event): boolean => isOutside(layer, event);

      let pending: { target: EventTarget; click: (e: Event) => void } | undefined;
      const dropPending = () => {
        if (pending) pending.target.removeEventListener("click", pending.click);
        pending = undefined;
      };
      const onDown = (event: PointerEvent) => {
        if (event.currentTarget === document && host && event.target === host) return;
        dropPending();
        if (!outside(event)) return;
        const target = event.currentTarget;
        if (event.pointerType === "touch" && target) {
          const click = (e: Event) => {
            pending = undefined;
            if (outside(e)) options.onDismiss("outside-press", event);
          };
          pending = { target, click };
          target.addEventListener("click", click, { once: true });
        } else {
          options.onDismiss("outside-press", event);
        }
      };

      const listener = onDown as EventListener;
      const timer = setTimeout(() => {
        for (const target of targets) target.addEventListener("pointerdown", listener, true);
      }, 0);
      return () => {
        clearTimeout(timer);
        for (const target of targets) target.removeEventListener("pointerdown", listener, true);
        dropPending();
      };
    },
  );
}

function createTooltipEscape(options: DismissOptions) {
  const { layer } = options;
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.isComposing) return;
    const mine = layer.layer();
    if (!mine || !mine.escape() || !takesKeys(mine)) return;
    const stack = layerStack.layers();
    if (stack.slice(stack.indexOf(mine) + 1).some((entry) => entry.kind !== "tooltip")) return;
    options.onDismiss("escape", event);
  };
  document.addEventListener("keydown", onKey, true);
  return () => document.removeEventListener("keydown", onKey, true);
}

const escapeHandlers = new WeakMap<Layer, (event: KeyboardEvent) => void>();
const claimedKeys = new WeakSet<Event>();

function createEscape(options: DismissOptions) {
  const { layer } = options;
  effect(
    () =>
      [
        layer.layer(),
        layer.layer()?.element(),
        layer.layer()?.kind === "tooltip" ? "tooltip" : (options.escapeFrom ?? "layer"),
      ] as const,
    ([entry, element, from]) => {
      if (!entry || !element) return;
      if (from === "tooltip") return createTooltipEscape(options);
      escapeHandlers.set(entry, (event) => options.onDismiss("escape", event));
      // The root element, so the key is taken before any document listener hears it.
      const target = from === "document" ? document.documentElement : element;
      const onKey = (event: KeyboardEvent) => {
        if (event.key !== "Escape" || event.isComposing || claimedKeys.has(event)) return;
        const mine = layer.layer();
        if (!mine || !takesKeys(mine)) return;
        const stack = layerStack.layers().slice(layerStack.layers().indexOf(mine));
        const claims = stack.findLast(
          (other) =>
            other.kind !== "tooltip" &&
            takesKeys(other) &&
            (other.escape() || other.kind === "modal"),
        );
        if (!claims) return;
        claimedKeys.add(event);
        event.stopPropagation();
        if (claims.escape()) {
          const handler = escapeHandlers.get(claims);
          if (handler) handler(event);
          else claims.dismiss?.();
        }
        event.preventDefault();
      };
      target.addEventListener("keydown", onKey as EventListener);
      return () => {
        target.removeEventListener("keydown", onKey as EventListener);
        escapeHandlers.delete(entry);
      };
    },
  );
}

export function createDismiss(options: DismissOptions): void {
  createOutsidePress(options);
  createFocusOutside(options);
  createEscape(options);
}
