import { createSignal } from "solid-js";
import { FaceToggle, FaceToggleGroup } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Faces = () => {
  const [value, setValue] = createSignal<string[]>([]);
  return (
    <FaceToggleGroup
      aria-label="Who sees it"
      value={value()}
      onChange={setValue}
      lockedIds={["maya"]}
    >
      <FaceToggle id="maya" name="Maya" kind="person" />
      <FaceToggle id="leo" name="Leo" kind="person" />
      <FaceToggle id="tablet" name="Kitchen tablet" kind="screen" />
    </FaceToggleGroup>
  );
};

const face = (name: string) => ({ press: { role: "button", name } });

export default defineScenarios({
  component: "FaceToggle",
  scenarios: [
    { id: "default", title: "Maya always sees it, Leo and the tablet are off", render: Faces },
    {
      id: "press",
      title: "Each press turns one face on, leaving the others",
      render: Faces,
      steps: [face("Leo"), face("Kitchen tablet")],
      keyboard: [
        { key: "Tab" },
        { key: "ArrowRight" },
        { key: " " },
        { key: "ArrowRight" },
        { key: "Enter" },
      ],
    },
    {
      id: "locked",
      title: "A press on the locked face keeps it on",
      render: Faces,
      steps: [face("Maya always sees it")],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Faces,
      within: "shadow-root",
      steps: [face("Leo")],
    },
  ],
});
