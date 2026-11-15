import { Spinner } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

export default defineScenarios({
  component: "Spinner",
  scenarios: [
    {
      id: "default",
      title: "Turning while loading",
      render: () => <Spinner class="size-6" />,
      steps: [{ key: "Tab" }],
    },
    {
      id: "labelled",
      title: "Says what it waits for",
      render: () => <Spinner aria-label="Saving" />,
    },
  ],
});
