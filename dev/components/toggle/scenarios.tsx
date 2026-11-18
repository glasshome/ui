import { Toggle } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Styles = () => (
  <div class="flex flex-wrap items-center gap-2">
    <Toggle defaultPressed aria-label="Bold">
      B
    </Toggle>
    <Toggle variant="outline">Italic</Toggle>
    <Toggle disabled>Underline</Toggle>
  </div>
);

const italic = { press: { role: "button", name: "Italic" } };

export default defineScenarios({
  component: "Toggle",
  scenarios: [
    { id: "default", title: "Bold pressed, Italic released, Underline disabled", render: Styles },
    {
      id: "press",
      title: "A press presses it, a second press releases it",
      render: Styles,
      steps: [italic, italic],
      keyboard: [{ key: "Tab" }, { key: "Tab" }, { key: " " }, { key: "Enter" }],
    },
    {
      id: "disabled",
      title: "A press on a disabled toggle changes nothing",
      render: Styles,
      steps: [{ press: { role: "button", name: "Underline" } }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Styles,
      within: "shadow-root",
      steps: [italic],
    },
  ],
});
