import { createSignal } from "solid-js";
import { effect } from "../../../src/lib/behavior/solid";
import { defineScenarios } from "../../harness/types";

const Toggle = () => {
  const [button, setButton] = createSignal<HTMLButtonElement>();
  const [on, setOn] = createSignal(false);
  effect(
    () => [button(), on()] as const,
    ([el, value]) => {
      el?.setAttribute("aria-pressed", String(value));
    },
  );
  return (
    <button ref={setButton} type="button" onClick={() => setOn(!on())}>
      Toggle
    </button>
  );
};

export default defineScenarios({
  component: "solid",
  kind: "block",
  scenarios: [
    {
      id: "effect-attribute",
      title: "An effect writes the pressed state",
      render: () => <Toggle />,
      steps: [{ press: { role: "button", name: "Toggle" } }],
    },
  ],
});
