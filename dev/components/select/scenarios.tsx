import { createSignal } from "solid-js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const FRUIT = ["Apple", "Banana", "Cherry", "Elderberry"];
const MANY = Array.from({ length: 60 }, (_, i) => `Option ${i + 1}`);

const Picker = (props: { options: string[]; label: string }) => {
  const [value, setValue] = createSignal<string | null>(null);
  return (
    <Select
      value={value()}
      onChange={setValue}
      options={props.options}
      placeholder="Pick one"
      itemComponent={(item) => <SelectItem item={item.item}>{item.item.rawValue}</SelectItem>}
    >
      <SelectTrigger aria-label={props.label} class="w-48">
        <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
};

export const Fruit = () => <Picker options={FRUIT} label="Fruit" />;
export const FRUIT_TRIGGER = { role: "button", name: "Fruit Pick one" };
const TRIGGER = FRUIT_TRIGGER;

export default defineScenarios({
  component: "Select",
  scenarios: [
    { id: "closed", title: "Closed, nothing picked", render: Fruit },
    { id: "open", title: "Open", render: Fruit, steps: [{ press: TRIGGER }] },
    {
      id: "pick",
      title: "Pick an option",
      render: Fruit,
      steps: [{ press: TRIGGER }, { press: { role: "option", name: "Cherry" } }],
      keyboard: [
        { key: "Tab" },
        { key: "Enter" },
        { key: "ArrowDown" },
        { key: "ArrowDown" },
        { key: "Enter" },
      ],
    },
    {
      id: "long-list",
      title: "Sixty options, jump to the last",
      render: () => <Picker options={MANY} label="Fruit" />,
      steps: [{ press: TRIGGER }, { key: "End" }, { key: "Enter" }],
    },
    {
      id: "dismiss",
      title: "Escape closes and returns focus",
      render: Fruit,
      steps: [{ press: TRIGGER }, { key: "Escape" }],
    },
    {
      id: "in-sheet",
      title: "Inside a bottom sheet",
      render: Fruit,
      within: "sheet",
      steps: [{ press: TRIGGER }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Fruit,
      within: "shadow-root",
      steps: [{ press: TRIGGER }],
    },
  ],
});
