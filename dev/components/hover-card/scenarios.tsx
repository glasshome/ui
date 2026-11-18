import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";
import { OUTSIDE } from "../popover/scenarios";

const Credits = () => (
  <p style={{ "margin-top": "120px", "margin-left": "40px" }}>
    Thanks to{" "}
    <HoverCard openDelay={0}>
      <HoverCardTrigger as="button" type="button">
        12 creators
      </HoverCardTrigger>
      <HoverCardContent>
        <p class="text-sm font-semibold">Widget creators</p>
        <p class="text-muted-foreground text-xs">Everyone who published a widget.</p>
      </HoverCardContent>
    </HoverCard>{" "}
    and <button type="button">Other</button>
  </p>
);

const TRIGGER = { role: "link", name: "12 creators" };
const HOVER = { hover: TRIGGER };

export default defineScenarios({
  component: "HoverCard",
  scenarios: [
    {
      id: "open",
      title: "The pointer resting on the trigger opens the card",
      render: Credits,
      steps: [HOVER],
    },
    {
      id: "focus",
      title: "Keyboard focus on the trigger opens the card",
      render: Credits,
      steps: [{ key: "Tab" }],
    },
    {
      id: "touch",
      title: "A touch never opens the card",
      render: Credits,
      steps: [{ touch: TRIGGER }],
    },
    {
      id: "escape",
      title: "Escape closes the card",
      render: Credits,
      steps: [HOVER, { key: "Escape" }],
    },
    {
      id: "outside-press",
      title: "A press outside closes the card",
      render: Credits,
      steps: [HOVER, { pressAt: OUTSIDE }],
    },
    {
      id: "in-dialog",
      title: "Inside a dialog",
      render: Credits,
      within: "dialog",
      steps: [HOVER],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Credits,
      within: "shadow-root",
      steps: [HOVER],
    },
  ],
});
