import { createSignal, For, onCleanup, onSettled, untrack } from "solid-js";
import { type JSX } from "@solidjs/web";
import { createCollection } from "../../../src/lib/behavior/collection";
import { defineScenarios } from "../../harness/types";

export interface Room {
  key: string;
  label: string;
  disabled?: boolean;
}

export const ROOMS: Room[] = [
  { key: "attic", label: "Attic", disabled: true },
  { key: "hall", label: "Hall" },
  { key: "kitchen", label: "Kitchen" },
  { key: "lounge", label: "Lounge", disabled: true },
  { key: "office", label: "Office" },
  { key: "yard", label: "Yard", disabled: true },
];

const TYPEAHEAD: Room[] = ["Bath", "Bedroom", "Cellar", "Den", "Dining", "Dressing"].map(
  (label) => ({ key: label.toLowerCase(), label }),
);

const LONG: Room[] = Array.from({ length: 40 }, (_, i) => ({
  key: `room-${i + 1}`,
  label: `Room ${i + 1}`,
}));

export function Toolbar(props: {
  rooms: Room[];
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  loop?: boolean;
  focus?: "roving" | "virtual";
  disabledFocusable?: boolean;
  style?: JSX.CSSProperties;
}) {
  const [root, setRoot] = createSignal<HTMLElement>();
  const virtual = () => props.focus === "virtual";
  const collection = createCollection({
    root,
    itemSelector: "[data-key]",
    orientation: () => props.orientation ?? "vertical",
    focus: untrack(() => props.focus) ?? "roving",
    loop: () => props.loop ?? false,
    dir: () => props.dir ?? "ltr",
    disabledFocusable: untrack(() => props.disabledFocusable),
  });
  return (
    <div
      ref={setRoot}
      role="toolbar"
      aria-label="Rooms"
      aria-orientation={props.orientation ?? "vertical"}
      aria-activedescendant={virtual() ? `room-${collection.highlighted() ?? ""}` : undefined}
      tabindex={virtual() ? 0 : undefined}
      dir={props.dir}
      data-highlighted-key={collection.highlighted()}
      style={{
        display: "flex",
        "flex-direction": (props.orientation ?? "vertical") === "vertical" ? "column" : "row",
        gap: "4px",
        ...props.style,
      }}
      onKeyDown={collection.onKeyDown}
    >
      <For each={props.rooms}>
        {(room) => {
          onSettled(() => {
            collection.refresh();
          });
          onCleanup(() => collection.refresh());
          return (
            <button
              type="button"
              id={`room-${room.key}`}
              data-key={room.key}
              aria-disabled={room.disabled ? "true" : undefined}
              tabindex={virtual() ? -1 : collection.tabIndex(room.key)}
              data-highlighted={collection.highlighted() === room.key ? "" : undefined}
              onClick={() => !room.disabled && collection.highlight(room.key, "pointer")}
              onFocus={() => collection.highlight(room.key, "pointer")}
            >
              {room.label}
            </button>
          );
        }}
      </For>
    </div>
  );
}

const Edited = (props: { edit: (rooms: Room[]) => Room[]; label: string }) => {
  const [rooms, setRooms] = createSignal(ROOMS.filter((r) => !r.disabled));
  return (
    <>
      <button type="button" onClick={() => setRooms(props.edit(rooms()))}>
        {props.label}
      </button>
      <Toolbar rooms={rooms()} />
    </>
  );
};

const insertMiddle = (rooms: Room[]) => [
  ...rooms.slice(0, 1),
  { key: "garage", label: "Garage" },
  ...rooms.slice(1),
];

const press = (name: string) => ({ press: { role: "button", name } });

export default defineScenarios({
  component: "collection",
  kind: "block",
  scenarios: [
    {
      id: "vertical",
      title: "Arrows move down a column and skip disabled rooms",
      render: () => (
        <>
          <Toolbar rooms={ROOMS} />
          <button type="button">After</button>
        </>
      ),
      steps: [press("Hall"), { key: "ArrowDown" }, { key: "ArrowDown" }, { key: "Home" }],
      keyboard: [{ key: "Tab" }, { key: "ArrowDown" }, { key: "ArrowDown" }, { key: "Home" }],
    },
    {
      id: "horizontal-rtl",
      title: "In a right-to-left row, Left moves on and the ends wrap",
      render: () => <Toolbar rooms={ROOMS} orientation="horizontal" dir="rtl" loop />,
      steps: [press("Office"), { key: "ArrowLeft" }, { key: "ArrowRight" }],
    },
    {
      id: "typeahead",
      title: "Typing jumps to the room whose name starts with it",
      render: () => <Toolbar rooms={TYPEAHEAD} />,
      steps: [press("Bath"), { type: "d" }, { type: "i" }],
    },
    {
      id: "inserted-middle",
      title: "A room added in the middle is reached in its place",
      render: () => <Edited edit={insertMiddle} label="Add a garage" />,
      steps: [press("Add a garage"), press("Hall"), { key: "ArrowDown" }],
    },
    {
      id: "reordered",
      title: "Re-sorted rooms are walked in their new order",
      render: () => <Edited edit={(rooms) => [...rooms].reverse()} label="Reverse" />,
      steps: [press("Reverse"), press("Kitchen"), { key: "ArrowDown" }, { key: "Home" }],
    },
    {
      id: "removed-highlighted",
      title: "Removing the room that held the tab stop hands it to another",
      render: () => (
        <Edited
          edit={(rooms) => rooms.filter((r) => r.key !== "kitchen")}
          label="Remove the kitchen"
        />
      ),
      steps: [press("Kitchen"), press("Remove the kitchen")],
    },
    {
      id: "long-list",
      title: "A keyboard move scrolls the room into the list's view",
      render: () => <Toolbar rooms={LONG} style={{ height: "160px", "overflow-y": "auto" }} />,
      steps: [press("Room 1"), { key: "End" }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: () => <Toolbar rooms={ROOMS} />,
      within: "shadow-root",
      steps: [press("Hall"), { key: "ArrowDown" }],
    },
  ],
});
