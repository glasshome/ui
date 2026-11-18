import { type Accessor, createSignal, onCleanup, untrack } from "solid-js";
import type { Align, Side } from "../anchor-placement.js";
import { type AnchorLike, createAnchored } from "./anchored.js";
import { createCollection } from "./collection.js";
import { createDismiss } from "./dismiss.js";
import { focusWithoutTracking } from "./focus-scope.js";
import { registerLayer } from "./layer-stack.js";
import { effect } from "./solid.js";

const MENU_ITEMS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
export const SUBMENU_OPEN_DELAY_MS = 100;
export const POINTER_GRACE_MS = 300;

/** Where focus goes as a menu opens: an item, the panel itself, or nowhere (a submenu opened by hover). */
export type MenuFocus = "first" | "last" | "content" | "none";

type Dir = "ltr" | "rtl";
type Point = { x: number; y: number };

export interface MenuItemEntry {
  disabled: Accessor<boolean>;
  closeOnSelect: Accessor<boolean>;
  onSelect: () => void;
  submenu?: Menu;
}

export interface MenuOptions {
  open: Accessor<boolean>;
  onOpenChange: (open: boolean) => void;
  parent?: Menu;
  /** What the menu sits beside, given its trigger; unset, the trigger itself, as a submenu always does. */
  anchor?: (trigger: HTMLElement | undefined) => AnchorLike | undefined;
  /** The panel covers its anchor from the anchor's top edge, as createAnchored's coverAnchor. */
  coverAnchor?: boolean;
  side?: Accessor<Side>;
  align?: Accessor<Align>;
  offset?: number;
  dir?: Accessor<Dir>;
  /** A press on the trigger counts as outside: a context menu's trigger is the area it opens over. */
  triggerIsArea?: boolean;
}

export interface Menu {
  parent: Menu | undefined;
  open: Accessor<boolean>;
  dir: Accessor<Dir>;
  content: Accessor<HTMLElement | undefined>;
  setContent: (el: HTMLElement | undefined) => void;
  trigger: Accessor<HTMLElement | undefined>;
  setTrigger: (el: HTMLElement | undefined) => void;
  highlighted: Accessor<string | undefined>;
  tabIndex: (key: string) => 0 | -1;
  show: (focus: MenuFocus) => void;
  /** Closes this menu and its submenus; with `returnFocus`, focus held inside goes back to the trigger. */
  hide: (returnFocus: boolean) => void;
  /** Closes every menu from the root down, as choosing an item does. */
  closeTree: () => void;
  register: (key: string, entry: MenuItemEntry) => void;
  holdsFocus: () => boolean;
  unhighlight: () => void;
  /** A submenu joins its parent, so focus inside it counts as inside the tree. */
  adopt: (child: Menu) => void;
}

export interface MenuButton {
  onPointerDown: (event: PointerEvent) => void;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

const isDisabled = (el: Element) =>
  el.getAttribute("aria-disabled") === "true" || el.hasAttribute("data-disabled");

const activeIn = (el: Element): Element | null =>
  (el.getRootNode() as Document | ShadowRoot).activeElement;

function inside(point: Point, polygon: Point[]): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (!a || !b) continue;
    const crosses =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) hit = !hit;
  }
  return hit;
}

/** The pointer's exit point fanned out to the submenu's whole panel. */
function graceArea(exit: Point, panel: DOMRect, side: "left" | "right"): Point[] {
  const toRight = side === "right";
  const near = toRight ? panel.left : panel.right;
  const far = toRight ? panel.right : panel.left;
  return [
    { x: exit.x + (toRight ? -5 : 5), y: exit.y },
    { x: near, y: panel.top },
    { x: far, y: panel.top },
    { x: far, y: panel.bottom },
    { x: near, y: panel.bottom },
  ];
}

export function createMenu(options: MenuOptions): Menu {
  const parent = options.parent;
  const [content, setContent] = createSignal<HTMLElement>();
  const [trigger, setTrigger] = createSignal<HTMLElement>();
  const [active, setActive] = createSignal<string>();
  const entries = new Map<string, MenuItemEntry>();
  const children = new Set<Menu>();
  const dir = (): Dir =>
    options.dir?.() ??
    parent?.dir() ??
    (trigger()?.closest("[dir]")?.getAttribute("dir") === "rtl" ? "rtl" : "ltr");
  const open = () => options.open() && (parent?.open() ?? true);
  const restingFocus: MenuFocus = parent ? "none" : "content";
  let pending: MenuFocus = restingFocus;

  const collection = createCollection({
    root: content,
    itemSelector: MENU_ITEMS,
    orientation: () => "vertical",
    focus: "roving",
    loop: () => true,
    dir,
  });

  const enabledItems = (el: HTMLElement) =>
    [...el.querySelectorAll<HTMLElement>(MENU_ITEMS)].filter((item) => !isDisabled(item));

  const itemOf = (target: EventTarget | null): HTMLElement | undefined => {
    const el = content();
    if (!el || !(target instanceof Element)) return undefined;
    const item = target.closest<HTMLElement>(MENU_ITEMS);
    return item && el.contains(item) && entries.has(item.dataset.key ?? "") ? item : undefined;
  };
  const entryOf = (item: HTMLElement) => entries.get(item.dataset.key ?? "");

  function highlight(key: string) {
    setActive(key);
    collection.highlight(key, "pointer");
    for (const [other, entry] of entries) {
      if (other !== key && entry.submenu && untrack(entry.submenu.open)) entry.submenu.hide(false);
    }
  }

  function focusItem(item: HTMLElement) {
    focusWithoutTracking(item);
    const key = item.dataset.key;
    if (key) highlight(key);
  }

  function applyFocus(el: HTMLElement, focus: MenuFocus) {
    if (focus === "none") return;
    const items = enabledItems(el);
    const target = focus === "first" ? items[0] : focus === "last" ? items.at(-1) : undefined;
    if (target) focusItem(target);
    else focusWithoutTracking(el);
  }

  const holdsFocus = (): boolean => {
    const el = content();
    const focused = el ? activeIn(el) : null;
    if (el && focused && el.contains(focused)) return true;
    return [...children].some((child) => child.holdsFocus());
  };

  let openTimer: ReturnType<typeof setTimeout> | undefined;
  const cancelOpenTimer = () => {
    clearTimeout(openTimer);
    openTimer = undefined;
  };
  let grace: { area: Point[]; timer: ReturnType<typeof setTimeout> } | undefined;
  const clearGrace = () => {
    if (grace) clearTimeout(grace.timer);
    grace = undefined;
  };
  const inGrace = (event: PointerEvent) =>
    grace !== undefined && inside({ x: event.clientX, y: event.clientY }, grace.area);
  onCleanup(() => {
    cancelOpenTimer();
    clearGrace();
  });

  function show(focus: MenuFocus) {
    const el = content();
    if (untrack(open) && el) return applyFocus(el, focus);
    pending = focus;
    if (!untrack(options.open)) options.onOpenChange(true);
  }

  function hide(returnFocus: boolean) {
    const held = holdsFocus();
    cancelOpenTimer();
    clearGrace();
    if (untrack(options.open)) options.onOpenChange(false);
    if (returnFocus && held) focusWithoutTracking(trigger());
  }

  const menu: Menu = {
    parent,
    open,
    dir,
    content,
    setContent,
    trigger,
    setTrigger,
    highlighted: active,
    tabIndex: collection.tabIndex,
    show,
    hide,
    closeTree: () => (parent ? parent.closeTree() : hide(true)),
    register(key, entry) {
      entries.set(key, entry);
      collection.refresh();
      onCleanup(() => {
        if (entries.get(key) === entry) entries.delete(key);
        if (untrack(active) === key) setActive(undefined);
        collection.refresh();
      });
    },
    holdsFocus,
    unhighlight: () => {
      clearGrace();
      setActive(undefined);
    },
    adopt(child) {
      children.add(child);
      onCleanup(() => children.delete(child));
    },
  };

  if (parent) {
    parent.adopt(menu);
    effect(parent.open, (parentOpen) => {
      if (!parentOpen && untrack(options.open)) options.onOpenChange(false);
    });
  }

  effect(
    () => [open(), content()] as const,
    ([isOpen, el]) => {
      if (!isOpen || !el) return;
      const focus = pending;
      pending = restingFocus;
      applyFocus(el, focus);
    },
  );

  const layer = registerLayer({
    element: content,
    open,
    kind: "menu",
    escape: () => true,
    trigger: () => (options.triggerIsArea ? undefined : trigger()),
    dismiss: () => hide(true),
  });
  createDismiss({ layer, onDismiss: (reason) => hide(reason === "escape") });

  createAnchored({
    anchor: () => (options.anchor ? options.anchor(trigger()) : trigger()),
    floating: content,
    open,
    side: () => options.side?.() ?? (dir() === "rtl" ? "left" : "right"),
    align: () => options.align?.() ?? "start",
    offset: options.offset ?? 0,
    coverAnchor: options.coverAnchor,
  });

  function activate(item: HTMLElement, by: "pointer" | "keyboard") {
    const entry = entryOf(item);
    if (!entry || entry.disabled() || !untrack(open)) return;
    if (entry.submenu) return entry.submenu.show(by === "keyboard" ? "first" : "none");
    entry.onSelect();
    if (entry.closeOnSelect()) menu.closeTree();
  }

  function leaveItem(el: HTMLElement) {
    setActive(undefined);
    const focused = activeIn(el);
    if (focused && el.contains(focused)) focusWithoutTracking(el);
  }

  const openKeys = () => (dir() === "rtl" ? "ArrowLeft" : "ArrowRight");
  const closeKeys = () => (dir() === "rtl" ? "ArrowRight" : "ArrowLeft");

  effect(content, (el) => {
    if (!el) return;
    let pressedInside = false;
    let pointerPressed = false;
    const release = () => {
      pressedInside = false;
    };
    const onDown = () => {
      pressedInside = true;
      pointerPressed = true;
      window.addEventListener("pointerup", release, { once: true });
    };
    // Only a press that began inside the panel chooses: the press that opened it ends here too.
    const onUp = (event: PointerEvent) => {
      const pressed = pressedInside;
      pressedInside = false;
      const item = itemOf(event.target);
      if (pressed && item && event.button === 0) activate(item, "pointer");
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (inGrace(event)) return;
      clearGrace();
      const item = itemOf(event.target);
      const entry = item && entryOf(item);
      if (!item || !entry) return;
      if (entry.disabled()) return leaveItem(el);
      if (untrack(active) !== item.dataset.key || activeIn(item) !== item) focusItem(item);
      const sub = entry.submenu;
      if (sub && !untrack(sub.open) && openTimer === undefined) {
        openTimer = setTimeout(() => {
          openTimer = undefined;
          sub.show("none");
        }, SUBMENU_OPEN_DELAY_MS);
      }
    };
    const onOut = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const item = itemOf(event.target);
      if (!item || (event.relatedTarget instanceof Node && item.contains(event.relatedTarget)))
        return;
      cancelOpenTimer();
      const sub = entryOf(item)?.submenu;
      const panel = sub && untrack(sub.open) ? sub.content() : undefined;
      if (panel) {
        clearGrace();
        const side = panel.getAttribute("data-side") === "left" ? "left" : "right";
        grace = {
          area: graceArea(
            { x: event.clientX, y: event.clientY },
            panel.getBoundingClientRect(),
            side,
          ),
          timer: setTimeout(clearGrace, POINTER_GRACE_MS),
        };
        return;
      }
      if (!inGrace(event)) leaveItem(el);
    };
    const onEnter = () => parent?.unhighlight();
    // Enter on a link row also clicks it; that click is the same activation.
    let linkKeyed = false;
    // A click with no pointer press before it comes from assistive technology.
    const onClick = (event: MouseEvent) => {
      const skip = linkKeyed || pointerPressed;
      linkKeyed = false;
      pointerPressed = false;
      if (skip) return;
      const item = itemOf(event.target);
      if (item) activate(item, "keyboard");
    };
    const onFocusIn = (event: FocusEvent) => {
      const key = itemOf(event.target)?.dataset.key;
      if (key && untrack(active) !== key) highlight(key);
    };
    const onKey = (event: KeyboardEvent) => {
      if (!(event.target instanceof Node) || !el.contains(event.target)) return;
      if (event.key === "Tab") return event.preventDefault();
      const item = itemOf(event.target);
      const entry = item && entryOf(item);
      if (item && entry && !entry.disabled()) {
        if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
          if (event.key === " " || !item.matches("a[href]")) event.preventDefault();
          else linkKeyed = true;
          return activate(item, "keyboard");
        }
        if (event.key === openKeys() && entry.submenu) {
          event.preventDefault();
          return entry.submenu.show("first");
        }
      }
      if (parent && event.key === closeKeys()) {
        event.preventDefault();
        event.stopPropagation();
        return hide(true);
      }
      if (event.target === el) {
        const items = enabledItems(el);
        const ends: Record<string, HTMLElement | undefined> = {
          ArrowDown: items[0],
          Home: items[0],
          ArrowUp: items.at(-1),
          End: items.at(-1),
        };
        const target = ends[event.key];
        if (target) {
          event.preventDefault();
          return focusItem(target);
        }
      }
      collection.onKeyDown(event);
    };
    el.addEventListener("pointerdown", onDown, true);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerout", onOut);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("keydown", onKey);
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("pointerdown", onDown, true);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerout", onOut);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("click", onClick);
      window.removeEventListener("pointerup", release);
      setActive(undefined);
      // An outside press on nothing focusable leaves focus nowhere; it goes back to the trigger.
      if (!focusLost(el) || (parent && !untrack(parent.open))) return;
      focusWithoutTracking(trigger());
    };
  });

  return menu;
}

function focusLost(el: HTMLElement): boolean {
  const doc = el.ownerDocument;
  const focused = doc.activeElement;
  if (!focused || focused === doc.body) return true;
  const inner = activeIn(el);
  return inner !== null && el.contains(inner);
}

/** The APG menu button: a mouse press toggles, a finger toggles on its click, Enter, Space and ArrowDown open on the first item, ArrowUp on the last. */
export function createMenuButton(menu: Menu, disabled: Accessor<boolean>): MenuButton {
  let pointerType = "";
  const keepFocus = (event: Event) => event.preventDefault();
  const toggle = () => (untrack(menu.open) ? menu.hide(true) : menu.show("content"));
  const keys: Record<string, MenuFocus> = {
    Enter: "first",
    " ": "first",
    ArrowDown: "first",
    ArrowUp: "last",
  };
  return {
    onPointerDown(event) {
      pointerType = event.pointerType;
      if (disabled() || event.pointerType === "touch" || event.button !== 0) return;
      // The press's mousedown would focus the trigger after the menu took focus.
      if (!untrack(menu.open))
        event.currentTarget?.addEventListener("mousedown", keepFocus, { once: true });
      toggle();
    },
    // A click with no pointer press before it comes from assistive technology.
    onClick() {
      if (!disabled() && (pointerType === "touch" || pointerType === "")) toggle();
      pointerType = "";
    },
    onKeyDown(event) {
      pointerType = "";
      const focus = keys[event.key];
      if (disabled() || !focus) return;
      event.preventDefault();
      event.stopPropagation();
      menu.show(focus);
    },
  };
}
