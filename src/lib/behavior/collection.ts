import { type Accessor, createSignal, onCleanup } from "solid-js";
import { focusWithoutTracking } from "./focus-scope";
import { effect } from "./solid";

export const TYPEAHEAD_MS = 1000;

type Orientation = "horizontal" | "vertical";
type HighlightBy = "keyboard" | "pointer";

export interface CollectionOptions {
  root: Accessor<HTMLElement | undefined>;
  itemSelector: string;
  orientation: Accessor<Orientation>;
  focus: "roving" | "virtual";
  loop?: Accessor<boolean>;
  dir?: Accessor<"ltr" | "rtl">;
  /** Keys that hold the tab stop while focus is outside, first present wins (a selected tab). */
  preferred?: Accessor<readonly string[]>;
  /** APG's focusable when disabled: an `aria-disabled` item stays in the arrow order and can hold the tab stop. */
  disabledFocusable?: boolean;
}

export interface Collection {
  highlighted: Accessor<string | undefined>;
  highlight: (key: string, by: HighlightBy) => void;
  tabIndex: (key: string) => 0 | -1;
  onKeyDown: (event: KeyboardEvent) => void;
  /** Items call this as they mount, unmount or change disabled, so the tab stop always sits on a present, enabled item. */
  refresh: () => void;
}

const isDisabled = (el: HTMLElement) =>
  el.getAttribute("aria-disabled") === "true" ||
  el.hasAttribute("data-disabled") ||
  el.matches(":disabled");

const keyOf = (el: HTMLElement) => el.dataset.key ?? "";

function focusIsWithin(root: HTMLElement): boolean {
  const active = (root.getRootNode() as Document | ShadowRoot).activeElement;
  return !!active && root.contains(active);
}

function step(
  items: HTMLElement[],
  from: number,
  by: number,
  loop: boolean,
): HTMLElement | undefined {
  if (from < 0) return by > 0 ? items[0] : items.at(-1);
  const next = from + by;
  if (loop) return items[(next + items.length) % items.length];
  return items[Math.max(0, Math.min(items.length - 1, next))];
}

function forwardKeys(orientation: Orientation, rtl: boolean): { next: string; prev: string } {
  if (orientation === "vertical") return { next: "ArrowDown", prev: "ArrowUp" };
  return rtl
    ? { next: "ArrowLeft", prev: "ArrowRight" }
    : { next: "ArrowRight", prev: "ArrowLeft" };
}

const textOf = (el: HTMLElement) => (el.textContent ?? "").trim().toLowerCase();

function matchText(items: HTMLElement[], from: number, buffer: string): HTMLElement | undefined {
  const first = buffer.charAt(0);
  const cycling = buffer.length > 1 && buffer === first.repeat(buffer.length);
  const search = cycling ? first : buffer;
  const start = cycling || buffer.length === 1 ? from + 1 : Math.max(from, 0);
  for (let i = 0; i < items.length; i++) {
    const item = items[(start + i) % items.length];
    if (item && textOf(item).startsWith(search)) return item;
  }
  return undefined;
}

export function createCollection(options: CollectionOptions): Collection {
  const [own, setOwn] = createSignal<string>();
  const highlighted = () => own() ?? options.preferred?.()[0];
  const skipped = options.disabledFocusable
    ? (el: HTMLElement) => el.matches(":disabled")
    : isDisabled;
  const enabledItems = (root: HTMLElement) =>
    [...root.querySelectorAll<HTMLElement>(options.itemSelector)].filter((el) => !skipped(el));

  function placeStop(root: HTMLElement | undefined, preferred: readonly string[]) {
    if (!root || focusIsWithin(root)) return;
    const items = enabledItems(root);
    const stop =
      items.find((el) => preferred.includes(keyOf(el))) ??
      items.find((el) => keyOf(el) === own()) ??
      items[0];
    setOwn(stop ? keyOf(stop) : undefined);
  }

  let disposed = false;
  let queued = false;
  onCleanup(() => (disposed = true));

  // A microtask, so an unmounting item has left the DOM and a burst of changes places the stop once.
  function refresh() {
    if (options.focus !== "roving" || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (!disposed) placeStop(options.root(), options.preferred?.() ?? []);
    });
  }

  if (options.focus === "roving") {
    effect(
      () => [options.root(), options.preferred?.() ?? []] as const,
      ([root, preferred]) => placeStop(root, preferred),
    );
    effect(options.root, (root) => {
      if (!root) return;
      const leave = (event: FocusEvent) => {
        if (!(event.relatedTarget instanceof Node && root.contains(event.relatedTarget))) refresh();
      };
      root.addEventListener("focusout", leave);
      return () => root.removeEventListener("focusout", leave);
    });
  }

  let buffer = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));

  function moveTo(el: HTMLElement | undefined) {
    if (!el) return;
    setOwn(keyOf(el));
    if (options.focus === "roving") focusWithoutTracking(el);
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function highlight(key: string, by: HighlightBy) {
    if (by === "pointer") return void setOwn(key);
    const root = options.root();
    const el = root
      ? [...root.querySelectorAll<HTMLElement>(options.itemSelector)].find((i) => keyOf(i) === key)
      : undefined;
    if (el) moveTo(el);
    else setOwn(key);
  }

  function typeahead(event: KeyboardEvent, items: HTMLElement[], current: number): boolean {
    const char = event.key;
    if (char.length !== 1 || (char === " " && buffer === "")) return false;
    buffer += char.toLowerCase();
    clearTimeout(timer);
    timer = setTimeout(() => (buffer = ""), TYPEAHEAD_MS);
    moveTo(matchText(items, current, buffer));
    return true;
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const root = options.root();
    if (!root) return;
    const items = enabledItems(root);
    const key = highlighted();
    const target = event.target instanceof Element ? event.target : null;
    let current = items.findIndex((el) => keyOf(el) === key);
    if (current < 0 && target) current = items.findIndex((el) => el.contains(target));
    const { next, prev } = forwardKeys(options.orientation(), options.dir?.() === "rtl");
    const loop = options.loop?.() ?? false;
    const destinations: Record<string, () => HTMLElement | undefined> = {
      [next]: () => step(items, current, 1, loop),
      [prev]: () => step(items, current, -1, loop),
      Home: () => items[0],
      End: () => items.at(-1),
    };
    const destination = destinations[event.key];
    if (destination) moveTo(destination());
    else if (!typeahead(event, items, current)) return;
    event.preventDefault();
  }

  return {
    highlighted,
    highlight,
    tabIndex: (key) => (options.focus === "roving" && key === highlighted() ? 0 : -1),
    onKeyDown,
    refresh,
  };
}
