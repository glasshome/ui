import { RadioGroup, RadioGroupItem } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Density = () => (
  <RadioGroup defaultValue="comfortable" aria-label="Density">
    <RadioGroupItem value="comfortable">Comfortable</RadioGroupItem>
    <RadioGroupItem value="compact">Compact</RadioGroupItem>
    <RadioGroupItem value="spacious" disabled>
      Spacious
    </RadioGroupItem>
    <RadioGroupItem value="dense">Dense</RadioGroupItem>
  </RadioGroup>
);

const radio = (name: string) => ({ press: { role: "radio", name } });

export default defineScenarios({
  component: "RadioGroup",
  scenarios: [
    {
      id: "default",
      title: "Four densities, Comfortable picked, Spacious disabled",
      render: Density,
    },
    {
      id: "press",
      title: "A press picks another density",
      render: Density,
      steps: [radio("Compact")],
      keyboard: [{ key: "Tab" }, { key: "ArrowDown" }],
    },
    {
      id: "keyboard-nav",
      title: "Arrow keys pick the next density, skipping Spacious",
      render: Density,
      steps: [radio("Compact"), { key: "ArrowDown" }, { key: "ArrowDown" }, { key: "ArrowUp" }],
      keyboard: [
        { key: "Tab" },
        { key: "ArrowDown" },
        { key: "ArrowDown" },
        { key: "ArrowDown" },
        { key: "ArrowUp" },
      ],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Density,
      within: "shadow-root",
      steps: [radio("Compact")],
    },
  ],
});
