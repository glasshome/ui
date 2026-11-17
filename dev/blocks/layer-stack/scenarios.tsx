import { createSignal, type JSX, Show } from "solid-js";
import { Portal } from "solid-js/web";
import {
  type LayerKind,
  layerStack,
  registerLayer,
  type TopLayer,
} from "../../../src/lib/behavior/layer-stack";
import { defineScenarios } from "../../harness/types";

const label = (el: HTMLElement | undefined) => el?.getAttribute("aria-label") ?? "";

const Readout = () => (
  <>
    <span role="status" aria-label="Stack">
      {layerStack
        .layers()
        .map((l) => label(l.element()))
        .join(" ")}
    </span>
    <span role="status" aria-label="Top">
      {label(layerStack.top()?.element())}
    </span>
  </>
);

const Layer = (props: { name: string; kind: LayerKind; children?: JSX.Element }) => {
  const [open, setOpen] = createSignal(false);
  const [element, setElement] = createSignal<HTMLElement>();
  registerLayer({
    element,
    open,
    kind: props.kind,
    escape: () => true,
    dismiss: () => setOpen(false),
  });
  return (
    <>
      <button type="button" on:click={() => setOpen(true)}>
        {`Open ${props.name}`}
      </button>
      <Show when={open()}>
        <div ref={setElement} role="dialog" aria-label={props.name} tabindex="-1">
          {props.children}
          <button type="button" on:click={() => setOpen(false)}>
            {`Close ${props.name}`}
          </button>
        </div>
      </Show>
    </>
  );
};

const TopLayerPart = (props: { topLayer: TopLayer }) => {
  const [open, setOpen] = createSignal(false);
  const [dismissals, setDismissals] = createSignal(0);
  const [element, setElement] = createSignal<HTMLElement>();
  registerLayer({
    element,
    open,
    kind: "popover",
    escape: () => true,
    topLayer: props.topLayer,
    dismiss: () => {
      setDismissals(dismissals() + 1);
      setOpen(false);
    },
  });
  return (
    <>
      <button type="button" on:click={() => setOpen(!open())}>
        Toggle
      </button>
      <span role="status" aria-label="State">
        {open() ? "Open" : "Closed"}
      </span>
      <span role="status" aria-label="Dismissals">
        {String(dismissals())}
      </span>
      <Show when={open()}>
        <Portal>
          <div
            ref={setElement}
            role="dialog"
            aria-label="Part"
            tabindex="-1"
            style={{ "margin-top": "200px", "margin-left": "200px" }}
          >
            Part
          </div>
        </Portal>
      </Show>
    </>
  );
};

export default defineScenarios({
  component: "layer-stack",
  kind: "block",
  scenarios: [
    {
      id: "nested",
      title: "Three layers open in turn and the middle one closes",
      render: () => (
        <>
          <Layer name="One" kind="modal" />
          <Layer name="Two" kind="popover" />
          <Layer name="Three" kind="menu" />
          <Readout />
        </>
      ),
      steps: [
        { press: { role: "button", name: "Open One" } },
        { press: { role: "button", name: "Open Two" } },
        { press: { role: "button", name: "Open Three" } },
        { press: { role: "button", name: "Close Two" } },
      ],
    },
    {
      id: "top-layer",
      title: "A layer that takes the top layer opens and closes",
      render: () => <TopLayerPart topLayer="manual" />,
      steps: [
        { press: { role: "button", name: "Toggle" } },
        { press: { role: "button", name: "Toggle" } },
      ],
    },
    {
      id: "light-dismiss",
      title: "The browser closes an auto popover that a press outside lands beside",
      render: () => <TopLayerPart topLayer="auto" />,
      steps: [{ press: { role: "button", name: "Toggle" } }, { pressAt: { x: 300, y: 400 } }],
    },
  ],
});
