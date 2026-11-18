import { type Accessor, createSignal, createUniqueId, onCleanup } from "solid-js";
import { type Collection, createCollection } from "./behavior/collection.js";
import { focusWithoutTracking, trackFocus } from "./behavior/focus-scope.js";
import { effect } from "./behavior/solid.js";

type Orientation = "horizontal" | "vertical";

export interface ToggleSet {
  id: Accessor<string>;
  orientation: Accessor<Orientation>;
  isPressed: (value: string) => boolean;
  toggle: (value: string) => void;
  collection: Collection;
  /** Changes as items mount and unmount. */
  members: Accessor<number>;
  joined: (delta: 1 | -1) => void;
}

/** The shared core of a row of toggles: which are pressed, what a press does, and the roving focus between them. */
export function createToggleSet(options: {
  root: Accessor<HTMLElement | undefined>;
  itemSelector: string;
  values: Accessor<readonly string[]>;
  setValues: (next: string[]) => void;
  multiple: Accessor<boolean>;
  orientation?: Accessor<Orientation>;
  id?: Accessor<string | undefined>;
  disabledFocusable?: boolean;
}): ToggleSet {
  const orientation = options.orientation ?? (() => "horizontal" as const);
  const fallbackId = `group-${createUniqueId()}`;
  const [members, setMembers] = createSignal(0);
  const collection = createCollection({
    root: options.root,
    itemSelector: options.itemSelector,
    orientation,
    focus: "roving",
    loop: () => true,
    dir: () => (options.root()?.closest("[dir]")?.getAttribute("dir") === "rtl" ? "rtl" : "ltr"),
    preferred: options.values,
    disabledFocusable: options.disabledFocusable,
  });
  return {
    id: () => options.id?.() ?? fallbackId,
    orientation,
    isPressed: (value) => options.values().includes(value),
    toggle: (value) => {
      const current = options.values();
      const pressed = current.includes(value);
      if (options.multiple()) {
        options.setValues(pressed ? current.filter((v) => v !== value) : [...current, value]);
      } else options.setValues(pressed ? [] : [value]);
    },
    collection,
    members,
    joined: (delta) => setMembers((n) => n + delta),
  };
}

/** One toggle in a set: its ref, its pressed and roving-focus attributes, and its press, bound on the element so it works inside a closed shadow root. */
export function createToggleItem(
  set: ToggleSet,
  item: { value: Accessor<string>; disabled: Accessor<boolean>; locked?: Accessor<boolean> },
) {
  const id = `${set.id()}-item-${createUniqueId()}`;
  const [el, setEl] = createSignal<HTMLElement>();
  effect(item.disabled, () => set.collection.refresh());
  onCleanup(() => set.collection.refresh());
  const pressed = () => set.isPressed(item.value());

  effect(el, (node) => {
    if (!node) return;
    set.joined(1);
    let mousePressed = false;
    const focused = trackFocus(node);
    const choose = () => {
      if (item.disabled() || item.locked?.()) return;
      set.toggle(item.value());
      set.collection.highlight(item.value(), "pointer");
    };
    // A mouse toggles on press, so focus lands on an item already toggled and is announced so.
    const pointerdown = (event: PointerEvent) => {
      mousePressed = event.pointerType === "mouse" && event.button === 0;
      if (mousePressed) choose();
    };
    const click = (event: MouseEvent) => {
      // WebKit leaves a clicked button unfocused.
      if (!item.disabled() && !focused.has()) focusWithoutTracking(node);
      if (event.detail === 0 || !mousePressed) choose();
      mousePressed = false;
    };
    const focus = () => set.collection.highlight(item.value(), "pointer");
    node.addEventListener("pointerdown", pointerdown);
    node.addEventListener("click", click);
    node.addEventListener("focus", focus);
    return () => {
      set.joined(-1);
      focused.stop();
      node.removeEventListener("pointerdown", pointerdown);
      node.removeEventListener("click", click);
      node.removeEventListener("focus", focus);
    };
  });

  return {
    ref: setEl,
    pressed,
    props: {
      id,
      get tabIndex() {
        return set.collection.tabIndex(item.value());
      },
      get disabled() {
        return item.disabled();
      },
      get "aria-pressed"() {
        return pressed();
      },
      get "data-pressed"() {
        return pressed() ? "" : undefined;
      },
      get "data-disabled"() {
        return item.disabled() ? "" : undefined;
      },
      get "data-key"() {
        return item.value();
      },
      get "data-orientation"() {
        return set.orientation();
      },
    },
  };
}
