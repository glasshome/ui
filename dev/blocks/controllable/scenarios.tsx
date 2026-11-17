import { createSignal } from "solid-js";
import { createControllableSignal } from "../../../src/lib/behavior/controllable";
import { defineScenarios } from "../../harness/types";

const Toggle = (props: { value?: boolean; onChange?: (next: boolean) => void }) => {
  const [on, setOn] = createControllableSignal<boolean>({
    value: () => props.value,
    defaultValue: () => false,
    onChange: (next) => props.onChange?.(next),
  });
  return (
    <button type="button" aria-pressed={on()} onClick={() => setOn(!on())}>
      Toggle
    </button>
  );
};

const Controlled = () => {
  const [value, setValue] = createSignal(false);
  return <Toggle value={value()} onChange={setValue} />;
};

export default defineScenarios({
  component: "controllable",
  kind: "block",
  scenarios: [
    {
      id: "uncontrolled",
      title: "An uncontrolled toggle keeps its own state",
      render: () => <Toggle />,
      steps: [{ press: { role: "button", name: "Toggle" } }],
    },
    {
      id: "controlled",
      title: "A controlled toggle follows its owner",
      render: () => <Controlled />,
      steps: [{ press: { role: "button", name: "Toggle" } }],
    },
  ],
});
