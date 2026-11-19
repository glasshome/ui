import {
  type ComponentProps,
  createContext,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  Show,
  splitProps,
  useContext,
} from "solid-js";
import { effect } from "../lib/behavior/solid.js";
import { cn } from "../lib/utils.js";

/** The attribute (without `data-`) that marks the active item: Kobalte's, or the caller's own. */
export type SelectionMarker = "pressed" | "selected" | "highlighted" | "lit";

interface SelectionContextValue {
  marker: SelectionMarker;
  report: (item: HTMLElement, active: boolean) => void;
  watchMarker: () => void;
}

const SelectionContext = createContext<SelectionContextValue>();

/**
 * The glass behind an item while it is the active one. Render it as the first child of every
 * item inside a `SelectionScope`; CSS shows the one whose item carries the scope's marker, so
 * layout keeps it in place and nothing measures it at rest. Renders nothing outside a scope.
 * Pass `active` when the item knows it carries the marker; without it the scope watches the
 * marker attribute instead, which costs a MutationObserver.
 */
export function SelectionHighlight(props: { active?: boolean }) {
  const scope = useContext(SelectionContext);
  let span: HTMLSpanElement | undefined;
  const [item, setItem] = createSignal<HTMLElement>();
  onMount(() => setItem(span?.parentElement ?? undefined));
  if (scope && props.active === undefined) scope.watchMarker();
  effect(
    () => [item(), props.active] as const,
    ([item, active]) => {
      if (!scope || !item || active === undefined) return;
      scope.report(item, active);
      return () => {
        if (active) scope.report(item, false);
      };
    },
  );
  return (
    <Show when={scope}>
      {(on) => (
        <span
          ref={span}
          data-selection-highlight=""
          data-on={on().marker}
          data-sliding-indicator=""
          aria-hidden="true"
          class="glass glass-tint"
        />
      )}
    </Show>
  );
}

// Kobalte clears a menu row's highlight on pointerleave and sets the next on pointermove.
const GAP_MS = 100;
// Squash-and-stretch as a pixel budget per axis, so a big item does not deform more.
const STRETCH_PX = 6;
const SQUASH_PX = 6;
const DEFORM_MAX = 0.14;

/** Centre and size in the scope's own content pixels. */
type Box = { x: number; y: number; width: number; height: number };

/** The root's place on screen and its scale, which a transformed ancestor sets. */
function frameOf(root: HTMLElement) {
  const outer = root.getBoundingClientRect();
  const width = root.offsetWidth;
  const height = root.offsetHeight;
  return {
    outer,
    sx: width > 0 ? outer.width / width : 1,
    sy: height > 0 ? outer.height / height : 1,
  };
}

function boxIn(
  root: HTMLElement,
  rect: DOMRect,
  size: { width: number; height: number },
  frame = frameOf(root),
): Box {
  const { outer, sx, sy } = frame;
  return {
    x: (rect.left + rect.width / 2 - outer.left) / sx - root.clientLeft + root.scrollLeft,
    y: (rect.top + rect.height / 2 - outer.top) / sy - root.clientTop + root.scrollTop,
    width: size.width,
    height: size.height,
  };
}

function itemBox(root: HTMLElement, item: HTMLElement): Box | undefined {
  if (!item.isConnected) return undefined;
  const size = { width: item.offsetWidth, height: item.offsetHeight };
  const box = boxIn(root, item.getBoundingClientRect(), size);
  return box.width > 0 && box.height > 0 ? box : undefined;
}

/** Whether the box shows inside the root's scrollport; a highlight never flies in from out of sight. */
function inSight(root: HTMLElement, box: Box): boolean {
  const top = root.scrollTop;
  const left = root.scrollLeft;
  return (
    box.y + box.height / 2 > top &&
    box.y - box.height / 2 < top + root.clientHeight &&
    box.x + box.width / 2 > left &&
    box.x - box.width / 2 < left + root.clientWidth
  );
}

function flyerBox(root: HTMLElement, flyer: HTMLElement): Box {
  const frame = frameOf(root);
  const rect = flyer.getBoundingClientRect();
  return boxIn(root, rect, { width: rect.width / frame.sx, height: rect.height / frame.sy }, frame);
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

/** The corner and tone the flyer takes from its target, without asking the page for a style. */
function lookOf(item: HTMLElement, radius: string | undefined) {
  if (radius === undefined) {
    const look = getComputedStyle(item);
    return {
      radius: look.borderRadius,
      tone: look.getPropertyValue("--selection-tone").trim(),
    };
  }
  return { radius, tone: item.style.getPropertyValue("--selection-tone").trim() };
}

/**
 * One flight at a time, run by CSS keyframes on the token duration; every way a flight ends goes
 * through `settle`. Each flight flips the phase, so a new flight restarts the keyframes.
 */
function createFlight(root: HTMLElement, flyer: HTMLElement, radius: () => string | undefined) {
  let phase: "a" | "b" = "b";
  let landing: Element | undefined;

  const settle = () => {
    landing?.removeAttribute("data-landing");
    landing = undefined;
    flyer.removeAttribute("data-flying");
  };

  const ended = (event: AnimationEvent) => {
    if (event.animationName === `selection-glide-${phase}`) settle();
  };
  flyer.addEventListener("animationend", ended);
  flyer.addEventListener("animationcancel", ended);

  const start = (from: Box, item: HTMLElement) => {
    const target = highlightOf(item);
    const to = itemBox(root, item);
    if (!target || !to) return settle();

    const look = lookOf(item, radius());
    const left = to.x - to.width / 2;
    const top = to.y - to.height / 2;
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

    writeStyle(flyer, "width", `${to.width}px`);
    writeStyle(flyer, "height", `${to.height}px`);
    writeStyle(flyer, "translate", `${left}px ${top}px`);
    writeStyle(flyer, "--selection-radius", look.radius);
    writeStyle(flyer, "--selection-tone", look.tone);
    writeStyle(flyer, "--selection-from", `${left + dx}px ${top + dy}px`);
    writeStyle(flyer, "--selection-scale-from", `${kx} ${ky}`);
    writeStyle(flyer, "--selection-scale-peak", `${peakX} ${peakY}`);

    landing?.removeAttribute("data-landing");
    landing = target;
    target.setAttribute("data-landing", "");
    phase = phase === "a" ? "b" : "a";
    flyer.setAttribute("data-flying", phase);
  };

  return { settle, start, flying: () => flyer.hasAttribute("data-flying") };
}

interface SelectionScopeProps extends Omit<ComponentProps<"div">, "style"> {
  marker: SelectionMarker;
  /** CSS colour for the highlight's glass. Default `var(--material-accent)`. */
  tone?: string;
  /**
   * The items' corner radius as CSS, which the flyer takes in flight. Without it the scope reads
   * each target's computed corner and tone per flight; that read goes in 2.0.0, where it is required.
   */
  radius?: string;
  style?: JSX.CSSProperties;
}

/**
 * Wraps items that each render a `SelectionHighlight`. When the marker moves to another item,
 * one flyer animates from the old item to the new one and hands off to its resting highlight.
 */
export function SelectionScope(props: SelectionScopeProps) {
  const [local, rest] = splitProps(props, [
    "marker",
    "tone",
    "radius",
    "class",
    "style",
    "children",
    "ref",
  ]);
  let root: HTMLDivElement | undefined;
  let flyer: HTMLSpanElement | undefined;
  const setRoot = (el: HTMLDivElement) => {
    root = el;
    const forwarded = local.ref;
    if (typeof forwarded === "function") forwarded(el);
  };

  let move: ((next: HTMLElement | undefined) => void) | undefined;
  let watching = false;
  let watch: (() => void) | undefined;
  const reported = new Set<HTMLElement>();
  let queued = false;
  // Decides after the task that changed the marker, which may still scroll the new item into view.
  const report = (item: HTMLElement, active: boolean) => {
    if (active) {
      reported.delete(item);
      reported.add(item);
    } else if (!reported.delete(item)) return;
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      move?.([...reported].at(-1));
    });
  };
  const watchMarker = () => {
    if (watching) return;
    watching = true;
    watch?.();
  };

  onMount(() => {
    const scope = root;
    const travel = flyer;
    if (!scope || !travel) return;
    const attribute = `data-${local.marker}`;
    const flight = createFlight(scope, travel, () => local.radius);
    let active = [...reported].at(-1) ?? activeIn(scope, attribute);
    let left: { item: HTMLElement; box: Box | undefined; at: number } | undefined;

    move = (next) => {
      if (next === active) return;
      const previous = active;
      active = next;
      if (!next) {
        if (previous) {
          const box = flight.flying() ? flyerBox(scope, travel) : undefined;
          left = { item: previous, box, at: performance.now() };
        }
        flight.settle();
        return;
      }
      const recent = left && performance.now() - left.at <= GAP_MS ? left : undefined;
      left = undefined;
      const from = flight.flying()
        ? flyerBox(scope, travel)
        : previous
          ? itemBox(scope, previous)
          : recent
            ? (recent.box ?? itemBox(scope, recent.item))
            : undefined;
      if (from && inSight(scope, from)) flight.start(from, next);
      else flight.settle();
    };

    let observer: MutationObserver | undefined;
    watch = () => {
      observer = new MutationObserver(() => move?.(activeIn(scope, attribute)));
      observer.observe(scope, { subtree: true, attributes: true, attributeFilter: [attribute] });
    };
    if (watching) watch();
    onCleanup(() => {
      observer?.disconnect();
      move = undefined;
      watch = undefined;
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
      <SelectionContext.Provider
        value={{
          get marker() {
            return local.marker;
          },
          report,
          watchMarker,
        }}
      >
        {local.children}
      </SelectionContext.Provider>
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
