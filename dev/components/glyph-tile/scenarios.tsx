import { createSignal } from "solid-js";
import { GlyphTile, GlyphTileGroup } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const ROOMS = [
  { name: "Garage", icon: "lucide:car" },
  { name: "Kitchen", icon: "lucide:cooking-pot" },
  { name: "Bedroom", icon: "lucide:bed" },
  { name: "Office", icon: "lucide:monitor" },
];

const Rooms = () => {
  const [value, setValue] = createSignal<string | null>("Kitchen");
  return (
    <GlyphTileGroup aria-label="Room" value={value()} onChange={setValue} class="w-96">
      {ROOMS.map((room) => (
        <GlyphTile value={room.name} icon={room.icon} label={room.name} badge="lucide:check" />
      ))}
    </GlyphTileGroup>
  );
};

const tile = (name: string) => ({ press: { role: "button", name } });

export default defineScenarios({
  component: "GlyphTile",
  scenarios: [
    { id: "default", title: "Four rooms, Kitchen picked", render: Rooms },
    {
      id: "press",
      title: "A press moves the pick, a second press clears it",
      render: Rooms,
      steps: [tile("Office"), tile("Office")],
      keyboard: [{ key: "Tab" }, { key: "End" }, { key: "Enter" }, { key: " " }],
    },
    {
      id: "keyboard-nav",
      title: "Arrow keys move between rooms without picking",
      render: Rooms,
      steps: [tile("Garage"), { key: "ArrowRight" }, { key: "ArrowLeft" }, { key: "ArrowLeft" }],
      keyboard: [
        { key: "Tab" },
        { key: "Home" },
        { key: "Enter" },
        { key: "ArrowRight" },
        { key: "ArrowLeft" },
        { key: "ArrowLeft" },
      ],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Rooms,
      within: "shadow-root",
      steps: [tile("Office")],
    },
  ],
});
