import { type Accessor, onCleanup, untrack } from "solid-js";
import { layerStack } from "./layer-stack.js";
import { effect } from "./solid.js";

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

const DOCUMENT_NODE = 9;
const SHADOW_ROOT_NODE = 11;

const outermostHost = (root: ShadowRoot): Element => {
  let host = root.host;
  for (let up = host.getRootNode(); up.nodeType === SHADOW_ROOT_NODE; up = host.getRootNode())
    host = (up as ShadowRoot).host;
  return host;
};

function readFocus(root: Node): Element | null {
  if (root.nodeType === DOCUMENT_NODE) return (root as Document).activeElement;
  const host = outermostHost(root as ShadowRoot);
  // A shadow root holds focus only while the document's focus sits on its outermost host.
  return host.ownerDocument.activeElement === host ? (root as ShadowRoot).activeElement : null;
}

const focusByRoot = new WeakMap<Node, { at: Element | null }>();

/** The focused element in the node's own root, kept from focusin and focusout, which a sealed widget receives without asking the page. */
export function focusedIn(node: Node): Element | null {
  const root = node.getRootNode();
  if (root.nodeType !== DOCUMENT_NODE && root.nodeType !== SHADOW_ROOT_NODE) return null;
  let tracked = focusByRoot.get(root);
  if (!tracked) {
    // One read when the listeners attach; a focus move runs its events inside the call that makes it.
    const seen = { at: readFocus(root) };
    root.addEventListener(
      "focusin",
      (e) => {
        seen.at = e.target instanceof Element ? e.target : null;
      },
      true,
    );
    root.addEventListener("focusout", () => (seen.at = null), true);
    focusByRoot.set(root, seen);
    tracked = seen;
  }
  const at = tracked.at;
  if (!at?.isConnected || at.getRootNode() !== root) return null;
  return at === at.ownerDocument.body ? null : at;
}

export const activeOf = focusedIn;

/** Whether focus sits on nothing, or still inside `el`, so a closing panel may hand it back. */
export function focusFell(el: Element): boolean {
  const inner = focusedIn(el);
  if (inner) return el.contains(inner);
  const root = el.getRootNode();
  if (root.nodeType === DOCUMENT_NODE) return true;
  // A panel already taken out of the page answers from the page's own focus.
  if (root.nodeType !== SHADOW_ROOT_NODE) return !focusedIn(el.ownerDocument);
  const host = outermostHost(root as ShadowRoot);
  const page = focusedIn(host);
  return !page || page === host;
}

/** Whether `el` holds focus, from its own focus and blur events, which a sealed widget receives without asking the page. */
export function trackFocus(el: Element): { has: () => boolean; stop: () => void } {
  let has = false;
  const on = () => (has = true);
  const off = () => (has = false);
  el.addEventListener("focus", on);
  el.addEventListener("blur", off);
  return {
    has: () => has,
    stop: () => {
      el.removeEventListener("focus", on);
      el.removeEventListener("blur", off);
    },
  };
}

export function focusWithoutTracking(
  el: HTMLElement | null | undefined,
  options?: { preventScroll?: boolean },
): boolean {
  if (!el) return false;
  untrack(() => el.focus({ preventScroll: options?.preventScroll ?? true }));
  return focusedIn(el) === el;
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
    const previous = pendingRestore ? pendingRestore.target : focusedIn(container);
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
        const current = focusedIn(container);
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
        const current = focusedIn(container);
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
