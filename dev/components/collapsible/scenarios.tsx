import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Advanced = (props: { open?: boolean; disabled?: boolean }) => (
  <Collapsible defaultOpen={props.open} disabled={props.disabled} class="w-72">
    <CollapsibleTrigger>Advanced settings</CollapsibleTrigger>
    <CollapsibleContent>
      <p class="pb-3 text-sm">The hub checks for changes every 30 seconds.</p>
    </CollapsibleContent>
  </Collapsible>
);

const trigger = { press: { role: "button", name: "Advanced settings" } };

export default defineScenarios({
  component: "Collapsible",
  scenarios: [
    { id: "closed", title: "Closed, its content not rendered", render: () => <Advanced /> },
    { id: "open", title: "Open from the start", render: () => <Advanced open /> },
    {
      id: "toggle",
      title: "A press opens it, a second press closes it",
      render: () => <Advanced />,
      steps: [trigger, trigger],
      keyboard: [{ key: "Tab" }, { key: "Enter" }, { key: " " }],
    },
    {
      id: "disabled",
      title: "A press on a disabled trigger changes nothing",
      render: () => <Advanced disabled />,
      steps: [trigger],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: () => <Advanced />,
      within: "shadow-root",
      steps: [trigger],
    },
  ],
});
