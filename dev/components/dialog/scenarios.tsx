import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHead,
  DialogTrigger,
} from "../../../src/solid";
import { defineScenarios } from "../../harness/types";
import { Fruit, FRUIT_TRIGGER } from "../select/scenarios";

const Panel = (props: { fruit?: boolean }) => (
  <Dialog>
    <DialogTrigger as={Button}>Open dialog</DialogTrigger>
    <DialogContent>
      <DialogHead icon="lucide:inbox" title="Dialog" line="Something to confirm" />
      <DialogBody>{props.fruit ? <Fruit /> : <p>Something to read.</p>}</DialogBody>
      <DialogFooter>
        <DialogClose as={Button}>Done</DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const OUTSIDE = { x: 8, y: 8 };
const OPEN = { press: { role: "button", name: "Open dialog" } };

export default defineScenarios({
  component: "Dialog",
  scenarios: [
    { id: "open", title: "Opens from its trigger", render: () => <Panel />, steps: [OPEN] },
    {
      id: "close",
      title: "Done closes it",
      render: () => <Panel />,
      steps: [OPEN, { press: { role: "button", name: "Done" } }],
    },
    {
      id: "escape",
      title: "Escape closes it",
      render: () => <Panel />,
      steps: [OPEN, { key: "Escape" }],
    },
    {
      id: "outside-press",
      title: "A press beside it closes it",
      render: () => <Panel />,
      steps: [OPEN, { pressAt: OUTSIDE }],
    },
    {
      id: "nested-select",
      title: "A select opens above it and leaves it open",
      render: () => <Panel fruit />,
      steps: [OPEN, { press: FRUIT_TRIGGER }, { key: "Escape" }],
    },
  ],
});
