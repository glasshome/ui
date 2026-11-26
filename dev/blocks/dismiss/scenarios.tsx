import { createSignal, Show } from "solid-js";
import { type JSX } from "@solidjs/web";
import { createDismiss, type DismissReason } from "../../../src/lib/behavior/dismiss";
import { createFocusScope } from "../../../src/lib/behavior/focus-scope";
import { type LayerKind, registerLayer } from "../../../src/lib/behavior/layer-stack";
import { defineScenarios } from "../../harness/types";

const PLACE = { "margin-top": "120px", "margin-left": "20px", width: "220px" };

const Layer = (props: {
  name: string;
  kind?: LayerKind;
  trigger?: boolean;
  focus?: boolean;
  removable?: boolean;
  children?: JSX.Element;
}) => {
  const [open, setOpen] = createSignal(false);
  const [element, setElement] = createSignal<HTMLElement>();
  const [trigger, setTrigger] = createSignal<HTMLElement>();
  const [dismissals, setDismissals] = createSignal(0);
  const [reason, setReason] = createSignal("");
  const [row, setRow] = createSignal(true);
  const close = (why: DismissReason) => {
    setDismissals(dismissals() + 1);
    setReason(why);
    setOpen(false);
  };
  const handle = registerLayer({
    element,
    open,
    kind: props.kind ?? "popover",
    escape: () => true,
    dismiss: () => close("escape"),
    trigger: props.trigger ? trigger : undefined,
  });
  const scope = createFocusScope({
    container: element,
    active: () => open() && props.focus !== false,
    trapped: () => true,
    initialFocus: "first",
  });
  createDismiss({
    layer: handle,
    onDismiss: (why) => {
      if (why === "outside-press") scope.skipRestore();
      close(why);
    },
  });
  return (
    <>
      <button ref={setTrigger} type="button" onClick={() => setOpen(true)}>
        {`Open ${props.name}`}
      </button>
      <span role="status" aria-label={`${props.name} dismissals`}>
        {String(dismissals())}
      </span>
      <span role="status" aria-label={`${props.name} reason`}>
        {reason()}
      </span>
      <Show when={open()}>
        <div ref={setElement} role="dialog" aria-label={props.name} tabindex="-1" style={PLACE}>
          <input type="text" aria-label={`${props.name} field`} />
          <Show when={props.removable && row()}>
            <button type="button" onClick={() => setRow(false)}>
              Remove row
            </button>
          </Show>
          {props.children}
        </div>
      </Show>
    </>
  );
};

export default defineScenarios({
  component: "dismiss",
  kind: "block",
  scenarios: [
    {
      id: "escape",
      title: "Escape closes the layer that holds focus, and a removed focused row does not stop it",
      render: () => <Layer name="Layer" removable />,
      steps: [
        { press: { role: "button", name: "Open Layer" } },
        { press: { role: "button", name: "Remove row" } },
        { key: "Escape" },
      ],
    },
    {
      id: "outside",
      title: "A press beside the layer closes it; a press on its trigger does not",
      render: () => (
        <>
          <Layer name="Layer" trigger />
          <button type="button">Beside</button>
        </>
      ),
      steps: [
        { press: { role: "button", name: "Open Layer" } },
        { press: { role: "button", name: "Open Layer" } },
        { press: { role: "button", name: "Beside" } },
      ],
    },
    {
      id: "nested",
      title: "Escape closes the newest layer that takes no focus and leaves the lower one",
      render: () => (
        <Layer name="Lower">
          <Layer name="Upper" focus={false} />
        </Layer>
      ),
      steps: [
        { press: { role: "button", name: "Open Lower" } },
        { press: { role: "button", name: "Open Upper" } },
        { key: "Escape" },
        { key: "Escape" },
      ],
    },
    {
      id: "shadow-root",
      title: "Inside a closed shadow root a press beside the layer closes it once",
      within: "shadow-root",
      render: () => (
        <>
          <Layer name="Layer" />
          <button type="button">Beside</button>
        </>
      ),
      steps: [
        { press: { role: "button", name: "Open Layer" } },
        { press: { role: "button", name: "Beside" } },
        { press: { role: "button", name: "Open Layer" } },
        { key: "Escape" },
      ],
    },
  ],
});
