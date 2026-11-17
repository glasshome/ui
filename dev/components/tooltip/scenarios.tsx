import { Tooltip, TooltipContent, TooltipTrigger } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Tip = () => (
  <div style={{ display: "flex", gap: "24px", "margin-top": "120px", "margin-left": "40px" }}>
    <Tooltip>
      <TooltipTrigger>Save</TooltipTrigger>
      <TooltipContent>Save changes</TooltipContent>
    </Tooltip>
    <button type="button">Other</button>
  </div>
);

export default defineScenarios({
  component: "Tooltip",
  scenarios: [
    {
      id: "hover",
      title: "A tooltip names a button the pointer rests on",
      render: () => <Tip />,
      steps: [{ hover: { role: "button", name: "Save" } }],
    },
    {
      id: "focus",
      title: "A tooltip names a button the keyboard reaches",
      render: () => <Tip />,
      steps: [{ key: "Tab" }],
    },
  ],
});
