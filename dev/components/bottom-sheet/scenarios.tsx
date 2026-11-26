import { Button } from "../../../src/solid";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHandle,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "../../../src/solid/bottom-sheet/index.js";
import { defineScenarios } from "../../harness/types";
import { Fruit, FRUIT_TRIGGER } from "../select/scenarios";

const Sheet = (props: { fruit?: boolean }) => (
  <BottomSheet>
    <BottomSheetTrigger as={Button}>Open sheet</BottomSheetTrigger>
    <BottomSheetPortal>
      <BottomSheetOverlay />
      <BottomSheetContent>
        <BottomSheetHandle />
        <BottomSheetBody>
          <BottomSheetTitle>Sheet</BottomSheetTitle>
          {props.fruit ? <Fruit /> : <p>Something to read.</p>}
          <BottomSheetClose as={Button}>Done</BottomSheetClose>
        </BottomSheetBody>
      </BottomSheetContent>
    </BottomSheetPortal>
  </BottomSheet>
);

const OUTSIDE = { x: 8, y: 8 };
const OPEN = { press: { role: "button", name: "Open sheet" } };
const HEADING = { role: "heading", name: "Sheet" };

export default defineScenarios({
  component: "BottomSheet",
  scenarios: [
    { id: "open", title: "Opens from its trigger", render: () => <Sheet />, steps: [OPEN] },
    {
      id: "close",
      title: "Done closes it",
      render: () => <Sheet />,
      steps: [OPEN, { press: { role: "button", name: "Done" } }],
    },
    {
      id: "escape",
      title: "Escape closes it",
      render: () => <Sheet />,
      steps: [OPEN, { key: "Escape" }],
    },
    {
      id: "outside-press",
      title: "A press beside it closes it",
      render: () => <Sheet />,
      steps: [OPEN, { pressAt: OUTSIDE }],
    },
    {
      id: "drag",
      title: "A quick drag down on its body closes it",
      render: () => <Sheet />,
      steps: [OPEN, { drag: { ...HEADING, by: { x: 0, y: 24 }, stepMs: 16 } }],
    },
    {
      id: "slow-drag",
      title: "A slow short drag down on its body snaps it back open",
      render: () => <Sheet />,
      steps: [OPEN, { drag: { ...HEADING, by: { x: 0, y: 24 }, stepMs: 40 } }],
    },
    {
      id: "nested-select",
      title: "A select opens above it and leaves it open",
      render: () => <Sheet fruit />,
      steps: [OPEN, { press: FRUIT_TRIGGER }, { key: "Escape" }],
    },
  ],
});
