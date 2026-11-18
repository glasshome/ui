import { createSignal } from "solid-js";
import { Button } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const times = (n: number) => (n === 1 ? "once" : `${n} times`);

const Actions = () => {
  const [saves, setSaves] = createSignal(0);
  return (
    <div class="flex flex-wrap items-center gap-3">
      <Button onClick={() => setSaves((n) => n + 1)}>Save</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive" disabled>
        Delete
      </Button>
      <p role="status" class="text-sm">
        {saves() === 0 ? "Not saved yet" : `Saved ${times(saves())}`}
      </p>
    </div>
  );
};

const Link = () => (
  <Button as="a" href="https://glasshome.app/docs" variant="outline">
    Read the guide
  </Button>
);

const Element = () => {
  const [opens, setOpens] = createSignal(0);
  return (
    <div class="flex flex-wrap items-center gap-3">
      <Button as="span" onClick={() => setOpens((n) => n + 1)}>
        Open the door
      </Button>
      <p role="status" class="text-sm">
        {opens() === 0 ? "Door closed" : `Opened ${times(opens())}`}
      </p>
    </div>
  );
};

const Disabled = () => {
  const [presses, setPresses] = createSignal(0);
  const count = () => setPresses((n) => n + 1);
  return (
    <div class="flex flex-wrap items-center gap-3">
      <Button variant="destructive" disabled onClick={count}>
        Delete
      </Button>
      <Button as="span" variant="outline" disabled onClick={count}>
        Archive
      </Button>
      <p role="status" class="text-sm">
        {presses() === 0 ? "Nothing happened" : `Ran ${times(presses())}`}
      </p>
    </div>
  );
};

const Busy = () => {
  const [presses, setPresses] = createSignal(0);
  return (
    <div class="flex flex-wrap items-center gap-3">
      <Button busy onClick={() => setPresses((n) => n + 1)}>
        Upload
      </Button>
      <p role="status" class="text-sm">
        {presses() === 0 ? "Uploading" : `Ran ${times(presses())}`}
      </p>
    </div>
  );
};

const save = { press: { role: "button", name: "Save" } };

export default defineScenarios({
  component: "Button",
  scenarios: [
    { id: "default", title: "A filled, an outline and a disabled button", render: Actions },
    {
      id: "press",
      title: "Each press runs the button's action",
      render: Actions,
      steps: [save, save],
      keyboard: [{ key: "Tab" }, { key: "Enter" }, { key: " " }],
    },
    { id: "as-link", title: "A link that looks like a button", render: Link },
    {
      id: "as-element",
      title: "Another element rendered as a button",
      render: Element,
      steps: [{ press: { role: "button", name: "Open the door" } }],
    },
    {
      id: "disabled",
      title: "A press on a disabled button runs nothing",
      render: Disabled,
      steps: [
        { press: { role: "button", name: "Delete" } },
        { press: { role: "button", name: "Archive" } },
      ],
    },
    {
      id: "busy",
      title: "A press while its work runs does nothing",
      render: Busy,
      steps: [{ press: { role: "button", name: "Upload" } }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Actions,
      within: "shadow-root",
      steps: [save],
    },
  ],
});
