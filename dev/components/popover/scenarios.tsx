import { Popover, PopoverContent, PopoverTrigger } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Filters = () => (
  <div
    style={{
      display: "flex",
      "flex-direction": "column",
      "align-items": "flex-start",
      gap: "160px",
      "margin-top": "120px",
      "margin-left": "40px",
    }}
  >
    <Popover>
      <PopoverTrigger>Filters</PopoverTrigger>
      <PopoverContent>
        <p class="mb-2 text-sm">Show widgets that work with</p>
        <button type="button">Lights</button>
      </PopoverContent>
    </Popover>
    <button type="button">Other</button>
  </div>
);

const TallPage = () => (
  <div style={{ height: "2400px" }}>
    <Filters />
  </div>
);

const OPEN = { press: { role: "button", name: "Filters" } };
const BY_KEY = [{ key: "Tab" }, { key: "Enter" }];

export const OUTSIDE = { x: 360, y: 360 };

export default defineScenarios({
  component: "Popover",
  scenarios: [
    { id: "closed", title: "Closed", render: Filters },
    {
      id: "open",
      title: "Opens from its trigger with focus inside",
      render: Filters,
      steps: [OPEN],
      keyboard: BY_KEY,
    },
    {
      id: "escape",
      title: "Escape closes it and focus returns to the trigger",
      render: Filters,
      steps: [OPEN, { key: "Escape" }],
      keyboard: [...BY_KEY, { key: "Escape" }],
    },
    {
      id: "outside-press",
      title: "A press outside closes it",
      render: Filters,
      steps: [OPEN, { pressAt: OUTSIDE }],
    },
    {
      id: "in-dialog",
      title: "Inside a dialog, Escape closes only the popover",
      render: Filters,
      within: "dialog",
      steps: [OPEN, { key: "Escape" }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Filters,
      within: "shadow-root",
      steps: [OPEN, { key: "Escape" }],
    },
    {
      id: "scroll-follows",
      title: "The panel follows its trigger as the page scrolls",
      render: TallPage,
      steps: [OPEN, { key: "PageDown" }],
    },
  ],
});
