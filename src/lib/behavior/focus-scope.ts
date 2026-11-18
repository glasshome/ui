import { type Accessor, onCleanup, untrack } from "solid-js";
import { layerStack } from "./layer-stack";
import { effect } from "./solid";

export const CANDIDATES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

const MARKED_LAYER = "[data-kb-top-layer]";

function within(ancestor: Element | undefined, node: Node): boolean {
  const hosted = typeof ShadowRoot !== "undefined";
  for (
    let n: Node | null = node;
    n;
    n = hosted && n instanceof ShadowRoot ? n.host : n.parentNode
  ) {
    if (n === ancestor) return true;
  }
  return false;
}

export type InitialFocus = "container" | "first" | ((container: HTMLElement) => HTMLElement | null);

export interface FocusScopeOptions {
  container: Accessor<HTMLElement | undefined>;
  active: Accessor<boolean>;
  trapped: Accessor<boolean>;
  initialFocus?: InitialFocus;
}

export interface FocusScope {
  skipRestore(): void;
  untrap(): void;
}

type FocusRoot = Document | ShadowRoot;

const activeOf = (el: Element): Element | null => (el.getRootNode() as FocusRoot).activeElement;

export function focusWithoutTracking(
  el: HTMLElement | null | undefined,
  options?: { preventScroll?: boolean },
): boolean {
  if (!el) return false;
  untrack(() => el.focus({ preventScroll: options?.preventScroll ?? true }));
  return activeOf(el) === el;
}

// Scopes in activation order: a later one sits above the earlier ones.
const activeScopes: HTMLElement[] = [];

function firstThatTakesFocus(candidates: Iterable<HTMLElement>): boolean {
  for (const candidate of candidates) if (focusWithoutTracking(candidate)) return true;
  return false;
}

function initialTarget(container: HTMLElement, initial: InitialFocus): HTMLElement | null {
  if (initial === "container") return container;
  if (initial !== "first") return initial(container);
  return null;
}

// A deactivation restores after a microtask, so a scope that activates in the same tick can inherit the target.
let pendingRestore: { target: Element | null } | undefined;

// Tab stops beside the container: the browser's own order reaches them, so focus wraps without leaving the page and without hearing the key.
function edge(container: HTMLElement, onFocus: () => void): HTMLSpanElement {
  const span = container.ownerDocument.createElement("span");
  span.tabIndex = 0;
  span.setAttribute("aria-hidden", "true");
  Object.assign(span.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  });
  span.addEventListener("focus", onFocus);
  return span;
}

export function createFocusScope(options: FocusScopeOptions): FocusScope {
  let skipNext = false;
  let held:
    | { container: HTMLElement; trapped: boolean; release: () => void; untrap: () => void }
    | undefined;
  onCleanup(() => held?.release());

  const activate = (
    container: HTMLElement,
    trapped: boolean,
  ): { release: () => void; untrap: () => void } => {
    skipNext = false;
    const previous = pendingRestore ? pendingRestore.target : activeOf(container);
    pendingRestore = undefined;
    activeScopes.push(container);

    const initial = options.initialFocus ?? "container";
    const chosen = initialTarget(container, initial);
    if (chosen) focusWithoutTracking(chosen);
    else if (!firstThatTakesFocus(container.querySelectorAll<HTMLElement>(CANDIDATES))) {
      focusWithoutTracking(container);
    }

    let tab: { shift: boolean } | null = null;
    let trapping = true;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") tab = { shift: event.shiftKey };
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Tab") tab = null;
    };
    const isAbove = (node: Node) => {
      if (node instanceof Element && node.closest(MARKED_LAYER) !== null) return true;
      const layers = layerStack.layers();
      const mine = layers.findIndex((layer) => layer.element() === container);
      return mine >= 0 && layers.slice(mine + 1).some((above) => within(above.element(), node));
    };
    const toCandidate = (backward: boolean) => {
      const candidates = Array.from(container.querySelectorAll<HTMLElement>(CANDIDATES));
      if (backward) candidates.reverse();
      if (!firstThatTakesFocus(candidates)) focusWithoutTracking(container);
    };
    const before = edge(container, () => toCandidate(true));
    const after = edge(container, () => toCandidate(false));
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next === before || next === after) return;
      if (next instanceof Node && (container.contains(next) || isAbove(next))) return;
      if (next !== null) {
        toCandidate(tab?.shift ?? false);
        return;
      }
      // Chromium fires focusout while removing the focused node; refocusing then strands keys on a detached node.
      const pressed = tab;
      queueMicrotask(() => {
        const current = activeOf(container);
        if (trapping && container.isConnected && !(current && container.contains(current))) {
          if (pressed) toCandidate(pressed.shift);
          else focusWithoutTracking(container);
        }
      });
    };
    if (trapped) {
      container.addEventListener("keydown", onKeyDown);
      container.addEventListener("keyup", onKeyUp);
      container.addEventListener("focusout", onFocusOut);
      container.before(before);
      container.after(after);
    }

    const untrap = () => {
      trapping = false;
      before.remove();
      after.remove();
      container.removeEventListener("keydown", onKeyDown);
      container.removeEventListener("keyup", onKeyUp);
      container.removeEventListener("focusout", onFocusOut);
    };

    const release = () => {
      untrap();
      activeScopes.splice(activeScopes.indexOf(container), 1);
      if (skipNext) return;
      const pending = { target: previous };
      pendingRestore = pending;
      queueMicrotask(() => {
        if (pendingRestore !== pending) return;
        pendingRestore = undefined;
        const current = activeOf(container);
        const tookOver = activeScopes.some((scope) => current && scope.contains(current));
        if (!tookOver && previous instanceof HTMLElement && previous.isConnected) {
          focusWithoutTracking(previous);
        }
      });
    };
    return { release, untrap };
  };

  effect(
    () => [options.container(), options.active(), options.trapped()] as const,
    ([container, active, trapped]) => {
      const wanted = container && active ? container : undefined;
      if (held && held.container === wanted && held.trapped === trapped) return;
      held?.release();
      held = wanted ? { container: wanted, trapped, ...activate(wanted, trapped) } : undefined;
    },
  );
  return {
    skipRestore() {
      skipNext = true;
    },
    untrap() {
      held?.untrap();
    },
  };
}
