import type { Accessor } from "solid-js";
import { type Layer, type LayerHandle, layerStack } from "./layer-stack";
import { effect } from "./solid";

export type DismissReason = "escape" | "outside-press";

export interface DismissOptions {
  layer: LayerHandle;
  /** `event` is the keydown for `escape` and the pointerdown for `outside-press`. */
  onDismiss: (reason: DismissReason, event: KeyboardEvent | PointerEvent) => void;
  outsidePress?: Accessor<boolean>;
  escapeFrom?: "layer" | "document";
}

const SHADOW_ROOT_NODE = 11;

function rootOf(element: HTMLElement): Document | ShadowRoot {
  const root = typeof element.getRootNode === "function" ? element.getRootNode() : document;
  return root.nodeType === SHADOW_ROOT_NODE ? (root as ShadowRoot) : document;
}

const takesKeys = (entry: Layer): boolean => entry.element() !== undefined;

function createOutsidePress(options: DismissOptions) {
  const { layer } = options;
  effect(
    () => [layer.layer()?.element(), options.outsidePress?.() ?? true] as const,
    ([element, enabled]) => {
      if (!element || !enabled) return;
      const root = rootOf(element);
      const host = root === document ? undefined : (root as ShadowRoot).host;
      const targets = host ? [root, document] : [root];

      const outside = (event: Event): boolean => {
        const mine = layer.layer();
        if (!mine || (mine.kind !== "menu" && !layer.isTop())) return false;
        const full = event.composedPath();
        const listener = event.currentTarget;
        const end = listener === document || !listener ? -1 : full.indexOf(listener);
        return !layer.containsPath(end >= 0 ? full.slice(0, end) : full);
      };

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

function createEscape(options: DismissOptions) {
  const { layer } = options;
  effect(
    () =>
      [
        layer.layer()?.element(),
        layer.layer()?.kind === "tooltip" ? "tooltip" : (options.escapeFrom ?? "layer"),
      ] as const,
    ([element, from]) => {
      if (!element) return;
      if (from === "tooltip") return createTooltipEscape(options);
      const target = from === "document" ? document : element;
      const onKey = (event: KeyboardEvent) => {
        if (event.key !== "Escape" || event.isComposing) return;
        const mine = layer.layer();
        if (!mine || !takesKeys(mine)) return;
        const stack = layerStack.layers();
        const claims = stack
          .slice(stack.indexOf(mine))
          .findLast(
            (entry) =>
              entry.kind !== "tooltip" &&
              takesKeys(entry) &&
              (entry.escape() || (entry.kind === "modal" && !entry.readsOwnEscape)),
          );
        if (!claims) return;
        event.stopPropagation();
        if (claims === mine && claims.escape()) options.onDismiss("escape", event);
        else if (claims.escape()) claims.dismiss?.();
        event.preventDefault();
      };
      target.addEventListener("keydown", onKey as EventListener);
      return () => target.removeEventListener("keydown", onKey as EventListener);
    },
  );
}

export function createDismiss(options: DismissOptions): void {
  createOutsidePress(options);
  createEscape(options);
}
