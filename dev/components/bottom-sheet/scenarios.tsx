import {
  Button,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "../../../src/solid";
import { defineScenarios } from "../../harness/types";
import { Fruit, FRUIT_TRIGGER } from "../select/scenarios";

/** The sheet a widget reaches: a ResponsiveDialog below `sm`. */
const Sheet = (props: { fruit?: boolean }) => (
  <ResponsiveDialog>
    <ResponsiveDialogTrigger as={Button}>Open sheet</ResponsiveDialogTrigger>
    <ResponsiveDialogContent>
      <ResponsiveDialogBody>
        <ResponsiveDialogTitle>Sheet</ResponsiveDialogTitle>
        {props.fruit ? <Fruit /> : <p>Something to read.</p>}
        <ResponsiveDialogClose variant="default">Done</ResponsiveDialogClose>
      </ResponsiveDialogBody>
    </ResponsiveDialogContent>
  </ResponsiveDialog>
);

const OUTSIDE = { x: 8, y: 8 };
const OPEN = { press: { role: "button", name: "Open sheet" } };
const HEADING = { role: "heading", name: "Sheet" };

export default defineScenarios({
  component: "BottomSheet",
  scenarios: [
    {
      id: "open",
      title: "Opens from its trigger",
      render: () => <Sheet />,
      width: "phone",
      steps: [OPEN],
    },
    {
      id: "close",
      title: "Done closes it",
      render: () => <Sheet />,
      width: "phone",
      steps: [OPEN, { press: { role: "button", name: "Done" } }],
    },
    {
      id: "escape",
      title: "Escape closes it",
      render: () => <Sheet />,
      width: "phone",
      steps: [OPEN, { key: "Escape" }],
    },
    {
      id: "outside-press",
      title: "A press beside it closes it",
      render: () => <Sheet />,
      width: "phone",
      steps: [OPEN, { pressAt: OUTSIDE }],
    },
    {
      id: "drag",
      title: "A quick drag down on its body closes it",
      render: () => <Sheet />,
      width: "phone",
      steps: [OPEN, { drag: { ...HEADING, by: { x: 0, y: 24 }, stepMs: 16 } }],
    },
    {
      id: "slow-drag",
      title: "A slow short drag down on its body snaps it back open",
      render: () => <Sheet />,
      width: "phone",
      steps: [OPEN, { drag: { ...HEADING, by: { x: 0, y: 24 }, stepMs: 40 } }],
    },
    {
      id: "nested-select",
      title: "A select opens above it and leaves it open",
      render: () => <Sheet fruit />,
      width: "phone",
      steps: [OPEN, { press: FRUIT_TRIGGER }, { key: "Escape" }],
    },
  ],
});
