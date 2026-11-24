import { type Accessor, createSignal, onCleanup } from "solid-js";
import { claimKeys, createClaim } from "./claims.js";
import { focusedIn, focusWithoutTracking } from "./focus-scope.js";
import { effect } from "./solid.js";

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
  /** False when the root holds more than its items (an accordion's panels): each item claims the keys itself. */
  claimsKeys?: boolean;
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

const textOf = (el: HTMLElement) => el.textContent ?? "";

function matchText(texts: readonly string[], from: number, buffer: string): number {
  const first = buffer.charAt(0);
  const cycling = buffer.length > 1 && buffer === first.repeat(buffer.length);
  const search = cycling ? first : buffer;
  const start = cycling || buffer.length === 1 ? from + 1 : Math.max(from, 0);
  for (let i = 0; i < texts.length; i++) {
    const index = (start + i) % texts.length;
    if ((texts[index] ?? "").trim().toLowerCase().startsWith(search)) return index;
  }
  return -1;
}

export interface Typeahead {
  /** The index in `texts` the key leads to: -1 when nothing matches, `undefined` when the key types nothing. */
  match: (event: KeyboardEvent, texts: readonly string[], from: number) => number | undefined;
}

/** The typing buffer alone, for a list whose items are not in the DOM (a closed Select's trigger). */
export function createTypeahead(): Typeahead {
  let buffer = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));
  return {
    match(event, texts, from) {
      const char = event.key;
      if (char.length !== 1 || (char === " " && buffer === "")) return undefined;
      buffer += char.toLowerCase();
      clearTimeout(timer);
      timer = setTimeout(() => (buffer = ""), TYPEAHEAD_MS);
      return matchText(texts, from, buffer);
    },
  };
}

export function createCollection(options: CollectionOptions): Collection {
  const [own, setOwn] = createSignal<string>();
  const highlighted = () => own() ?? options.preferred?.()[0];
  const skipped = options.disabledFocusable
    ? (el: HTMLElement) => el.matches(":disabled")
    : isDisabled;
  const enabledItems = (root: HTMLElement) =>
    [...root.querySelectorAll<HTMLElement>(options.itemSelector)].filter((el) => !skipped(el));

  const focusIsWithin = (root: HTMLElement) => {
    const focused = focusedIn(root);
    return !!focused && root.contains(focused);
  };

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
    effect(options.root, (root) => {
      if (!root) return;
      // An item focused before the collection mounts (autofocus) keeps the stop.
      const current = focusedIn(root);
      const item = current?.closest<HTMLElement>(options.itemSelector);
      if (item && root.contains(item)) setOwn(keyOf(item));
      const leave = (event: FocusEvent) => {
        const next = event.relatedTarget;
        if (next instanceof Element && root.contains(next)) return;
        refresh();
      };
      root.addEventListener("focusout", leave);
      return () => root.removeEventListener("focusout", leave);
    });
    effect(
      () => [options.root(), options.preferred?.() ?? []] as const,
      ([root, preferred]) => placeStop(root, preferred),
    );
  }

  if (options.claimsKeys !== false) {
    createClaim(options.root, () => {
      const { next, prev } = forwardKeys(options.orientation(), options.dir?.() === "rtl");
      return claimKeys([next, prev, "Home", "End"]);
    });
  }

  const typer = createTypeahead();

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
    const index = typer.match(event, items.map(textOf), current);
    if (index === undefined) return false;
    moveTo(items[index]);
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
