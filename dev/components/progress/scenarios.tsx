import { Progress } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Storage = (props: { value?: number; indeterminate?: boolean }) => (
  <div class="w-72">
    <Progress value={props.value} indeterminate={props.indeterminate} aria-label="Storage used" />
  </div>
);

export default defineScenarios({
  component: "Progress",
  scenarios: [
    { id: "default", title: "Forty percent", render: () => <Storage value={40} /> },
    { id: "complete", title: "Full", render: () => <Storage value={100} /> },
    { id: "indeterminate", title: "No value known", render: () => <Storage indeterminate /> },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: () => <Storage value={40} />,
      within: "shadow-root",
    },
  ],
});
