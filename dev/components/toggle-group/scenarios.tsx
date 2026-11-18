import { ToggleGroup, ToggleGroupItem } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Speed = () => (
  <ToggleGroup defaultValue="medium" aria-label="Fan speed">
    <ToggleGroupItem value="low">Low</ToggleGroupItem>
    <ToggleGroupItem value="medium">Medium</ToggleGroupItem>
    <ToggleGroupItem value="auto" disabled>
      Auto
    </ToggleGroupItem>
    <ToggleGroupItem value="high">High</ToggleGroupItem>
  </ToggleGroup>
);

const Days = () => (
  <ToggleGroup multiple defaultValue={["mon"]} aria-label="Days">
    <ToggleGroupItem value="mon">Mon</ToggleGroupItem>
    <ToggleGroupItem value="tue">Tue</ToggleGroupItem>
    <ToggleGroupItem value="wed">Wed</ToggleGroupItem>
  </ToggleGroup>
);

const press = (name: string) => ({ press: { role: "button", name } });

export default defineScenarios({
  component: "ToggleGroup",
  scenarios: [
    { id: "default", title: "Four speeds, Medium pressed, Auto disabled", render: Speed },
    {
      id: "press",
      title: "Pressing another speed moves the press, pressing it again releases it",
      render: Speed,
      steps: [press("High"), press("High")],
      keyboard: [{ key: "Tab" }, { key: "ArrowRight" }, { key: "Enter" }],
    },
    {
      id: "keyboard-nav",
      title: "Arrow keys move between speeds, skipping Auto",
      render: Speed,
      steps: [press("Low"), { key: "ArrowRight" }, { key: "ArrowRight" }, { key: "Home" }],
      keyboard: [{ key: "Tab" }, { key: "ArrowRight" }, { key: "ArrowRight" }, { key: "Home" }],
    },
    {
      id: "multiple",
      title: "Several days pressed at once",
      render: Days,
      steps: [press("Tue"), press("Mon")],
    },
    {
      id: "in-dialog",
      title: "Inside a dialog",
      render: Speed,
      within: "dialog",
      steps: [press("High")],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Speed,
      within: "shadow-root",
      steps: [press("High")],
    },
  ],
});
