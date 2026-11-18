import { Checkbox } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Rules = () => (
  <div class="flex flex-col gap-3">
    <Checkbox defaultChecked>Turn on at sunset</Checkbox>
    <Checkbox name="notify">Notify me</Checkbox>
    <Checkbox disabled>Lock when away</Checkbox>
  </div>
);

const Partial = () => (
  <div class="flex flex-col gap-3">
    <Checkbox indeterminate>All lights</Checkbox>
    <Checkbox size="sm" defaultChecked>
      Kitchen
    </Checkbox>
    <Checkbox size="sm">Hallway</Checkbox>
  </div>
);

const notify = { press: { role: "checkbox", name: "Notify me" } };

export default defineScenarios({
  component: "Checkbox",
  scenarios: [
    { id: "default", title: "Checked, unchecked and disabled", render: Rules },
    {
      id: "press",
      title: "A press checks it, a second press clears it",
      render: Rules,
      steps: [notify, notify],
      keyboard: [{ key: "Tab" }, { key: "Tab" }, { key: " " }, { key: " " }],
    },
    {
      id: "disabled",
      title: "A press on a disabled box changes nothing",
      render: Rules,
      steps: [{ press: { role: "checkbox", name: "Lock when away" } }],
    },
    { id: "indeterminate", title: "Some of a group checked", render: Partial },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Rules,
      within: "shadow-root",
      steps: [notify],
    },
  ],
});
