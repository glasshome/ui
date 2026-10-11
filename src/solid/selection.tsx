import {
  type ComponentProps,
  createContext,
  type JSX,
  onCleanup,
  onMount,
  Show,
  splitProps,
  useContext,
} from "solid-js";
import { cn } from "../lib/utils.js";

/** The attribute (without `data-`) that marks the active item: Kobalte's, or the caller's own. */
export type SelectionMarker = "pressed" | "selected" | "highlighted" | "lit";

const SelectionContext = createContext<SelectionMarker>();

/**
 * The glass behind an item while it is the active one. Render it as the first child of every
 * item inside a `SelectionScope`; CSS shows the one whose item carries the scope's marker, so
 * layout keeps it in place and nothing measures it at rest. Renders nothing outside a scope.
 */
export function SelectionHighlight() {
  const marker = useContext(SelectionContext);
  return (
    <Show when={marker}>
      {(on) => (
        <span
          data-selection-highlight=""
          data-on={on()}
          data-sliding-indicator=""
          aria-hidden="true"
          class="glass glass-tint"
        />
      )}
    </Show>
  );
}

const DEFAULT_DURATION_MS = 220;
// Kobalte clears a menu row's highlight on pointerleave and sets the next on pointermove.
const GAP_MS = 100;
// Squash-and-stretch as a pixel budget per axis, so a big item does not deform more.
const STRETCH_PX = 6;
const SQUASH_PX = 6;
const DEFORM_MAX = 0.14;

/** Centre and size in the scope's own content pixels. */
type Box = { x: number; y: number; width: number; height: number };

function durationMs(root: HTMLElement): number {
  const raw = getComputedStyle(root).getPropertyValue("--duration-slide").trim();
  if (!raw) return DEFAULT_DURATION_MS;
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return DEFAULT_DURATION_MS;
  return raw.endsWith("ms") ? value : value * 1000;
}

function boxIn(root: HTMLElement, el: Element, size: { width: number; height: number }): Box {
  const outer = root.getBoundingClientRect();
  const sx = root.offsetWidth > 0 ? outer.width / root.offsetWidth : 1;
  const sy = root.offsetHeight > 0 ? outer.height / root.offsetHeight : 1;
  const rect = el.getBoundingClientRect();
  return {
    x: (rect.left + rect.width / 2 - outer.left) / sx - root.clientLeft + root.scrollLeft,
    y: (rect.top + rect.height / 2 - outer.top) / sy - root.clientTop + root.scrollTop,
    width: size.width,
    height: size.height,
  };
}

function itemBox(root: HTMLElement, item: HTMLElement): Box | undefined {
  if (!item.isConnected) return undefined;
  const box = boxIn(root, item, { width: item.offsetWidth, height: item.offsetHeight });
  return box.width > 0 && box.height > 0 ? box : undefined;
}

function flyerBox(root: HTMLElement, flyer: HTMLElement): Box {
  const outer = root.getBoundingClientRect();
  const sx = root.offsetWidth > 0 ? outer.width / root.offsetWidth : 1;
  const sy = root.offsetHeight > 0 ? outer.height / root.offsetHeight : 1;
  const rect = flyer.getBoundingClientRect();
  return boxIn(root, flyer, { width: rect.width / sx, height: rect.height / sy });
}

function highlightOf(item: Element): Element | null {
  return item.querySelector(":scope > [data-selection-highlight]");
}

function activeIn(root: HTMLElement, attribute: string): HTMLElement | undefined {
  let active: HTMLElement | undefined;
  for (const el of root.querySelectorAll<HTMLElement>(`[${attribute}]`)) {
    if (el.closest("[data-selection-scope]") === root && highlightOf(el)) active = el;
  }
  return active;
}

function writeStyle(el: HTMLElement, name: string, value: string) {
  if (el.style.getPropertyValue(name) !== value) el.style.setProperty(name, value);
}

/** One flight at a time; every way a flight ends goes through `settle`. */
function createFlight(root: HTMLElement, flyer: HTMLElement) {
  let generation = 0;
  let running: Animation[] = [];
  let landing: Element | undefined;

  const stop = () => {
    for (const animation of running) animation.cancel();
    running = [];
    landing?.removeAttribute("data-landing");
    landing = undefined;
  };

  const settle = (of = generation) => {
    if (of !== generation) return;
    stop();
    flyer.removeAttribute("data-flying");
  };

  const start = (from: Box, item: HTMLElement) => {
    generation += 1;
    const current = generation;
    stop();
    const target = highlightOf(item);
    const to = itemBox(root, item);
    const duration = durationMs(root);
    if (!target || !to || duration <= 0) return settle(current);

    const look = getComputedStyle(item);
    writeStyle(flyer, "width", `${to.width}px`);
    writeStyle(flyer, "height", `${to.height}px`);
    writeStyle(flyer, "left", `${to.x - to.width / 2}px`);
    writeStyle(flyer, "top", `${to.y - to.height / 2}px`);
    writeStyle(flyer, "border-radius", look.borderRadius);
    writeStyle(flyer, "--selection-tone", look.getPropertyValue("--selection-tone").trim());

    const dx = from.x - to.x;
    const dy = from.y - to.y;
    const kx = from.width / to.width;
    const ky = from.height / to.height;
    const alongX = Math.abs(dx) >= Math.abs(dy);
    let peakX = (kx + 1) / 2;
    let peakY = (ky + 1) / 2;
    if (Math.hypot(dx, dy) >= 1) {
      const stretch = 1 + Math.min(DEFORM_MAX, STRETCH_PX / (alongX ? to.width : to.height));
      const pinch = 1 - Math.min(DEFORM_MAX, SQUASH_PX / (alongX ? to.height : to.width));
      peakX *= alongX ? stretch : pinch;
      peakY *= alongX ? pinch : stretch;
    }

    landing = target;
    target.setAttribute("data-landing", "");
    flyer.setAttribute("data-flying", "");
    const timing: KeyframeAnimationOptions = { duration, easing: "ease-in-out" };
    running = [
      flyer.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0px 0px" }], timing),
      flyer.animate(
        [{ scale: `${kx} ${ky}` }, { scale: `${peakX} ${peakY}` }, { scale: "1 1" }],
        timing,
      ),
    ];
    const end = () => settle(current);
    Promise.all(running.map((animation) => animation.finished)).then(end, end);
  };

  return { settle, start, flying: () => flyer.hasAttribute("data-flying") };
}

interface SelectionScopeProps extends Omit<ComponentProps<"div">, "style"> {
  marker: SelectionMarker;
  /** CSS colour for the highlight's glass. Default `var(--material-accent)`. */
  tone?: string;
  style?: JSX.CSSProperties;
}

/**
 * Wraps items that each render a `SelectionHighlight`. When the marker moves to another item,
 * one flyer animates from the old item to the new one and hands off to its resting highlight.
 */
export function SelectionScope(props: SelectionScopeProps) {
  const [local, rest] = splitProps(props, ["marker", "tone", "class", "style", "children", "ref"]);
  let root: HTMLDivElement | undefined;
  let flyer: HTMLSpanElement | undefined;
  const setRoot = (el: HTMLDivElement) => {
    root = el;
    const forwarded = local.ref;
    if (typeof forwarded === "function") forwarded(el);
  };

  onMount(() => {
    const scope = root;
    const travel = flyer;
    if (!scope || !travel) return;
    const attribute = `data-${local.marker}`;
    const flight = createFlight(scope, travel);
    let active = activeIn(scope, attribute);
    let left: { item: HTMLElement; at: number } | undefined;

    const observer = new MutationObserver(() => {
      const next = activeIn(scope, attribute);
      if (next === active) return;
      const previous = active;
      active = next;
      if (!next) {
        if (previous) left = { item: previous, at: performance.now() };
        flight.settle();
        return;
      }
      const recent = left && performance.now() - left.at <= GAP_MS ? left.item : undefined;
      left = undefined;
      const source = previous ?? recent;
      const from = flight.flying()
        ? flyerBox(scope, travel)
        : source
          ? itemBox(scope, source)
          : undefined;
      if (from) flight.start(from, next);
      else flight.settle();
    });
    observer.observe(scope, { subtree: true, attributes: true, attributeFilter: [attribute] });
    onCleanup(() => {
      observer.disconnect();
      flight.settle();
    });
  });

  return (
    <div
      ref={setRoot}
      data-selection-scope=""
      class={cn("relative isolate", local.class)}
      style={local.tone ? { ...local.style, "--selection-tone": local.tone } : local.style}
      {...rest}
    >
      <SelectionContext.Provider value={local.marker}>{local.children}</SelectionContext.Provider>
      <span
        ref={flyer}
        data-selection-flyer=""
        data-sliding-indicator=""
        aria-hidden="true"
        class="glass glass-tint"
      />
    </div>
  );
}
