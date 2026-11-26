import { createSignal, Show } from "solid-js";
import { type JSX } from "@solidjs/web";
import { Portal } from "@solidjs/web";
import { createFocusScope } from "../../../src/lib/behavior/focus-scope";
import { createHideOutside } from "../../../src/lib/behavior/hide-outside";
import { type LayerKind, registerLayer } from "../../../src/lib/behavior/layer-stack";
import { defineScenarios } from "../../harness/types";

const Modal = (props: {
  name: string;
  children?: JSX.Element;
  onAnnounce?: (text: string) => void;
}) => {
  const [open, setOpen] = createSignal(false);
  const [element, setElement] = createSignal<HTMLElement>();
  const handle = registerLayer({
    element,
    open,
    kind: "modal",
    escape: () => true,
    dismiss: () => setOpen(false),
  });
  createHideOutside({ layer: handle, active: open });
  createFocusScope({
    container: element,
    active: open,
    trapped: () => true,
    initialFocus: "first",
  });
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        {`Open ${props.name}`}
      </button>
      <Show when={open()}>
        <Portal>
          <div
            ref={setElement}
            role="dialog"
            aria-modal="true"
            aria-label={props.name}
            tabindex="-1"
            style={{ "margin-top": "120px", "margin-left": "20px" }}
          >
            {props.children}
            <Show when={props.onAnnounce}>
              <button type="button" onClick={() => props.onAnnounce?.(`Saved ${props.name}`)}>
                Announce
              </button>
            </Show>
            <button type="button" onClick={() => setOpen(false)}>
              {`Close ${props.name}`}
            </button>
          </div>
        </Portal>
      </Show>
    </>
  );
};

const List = (props: { kind: LayerKind }) => {
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
      <button type="button" onClick={() => setOpen(!open())}>
        Toggle list
      </button>
      <Show when={open()}>
        <Portal>
          <ul ref={setElement} role="listbox" aria-label="Fruit" style={{ "margin-left": "260px" }}>
            <li role="option" aria-selected="false">
              Apple
            </li>
            <li role="option" aria-selected="false">
              Pear
            </li>
          </ul>
        </Portal>
      </Show>
    </>
  );
};

const Page = (props: { children: (announce: (text: string) => void) => JSX.Element }) => {
  const [announcement, setAnnouncement] = createSignal("");
  return (
    <>
      <h1>Living room</h1>
      <button type="button">Page action</button>
      {props.children(setAnnouncement)}
      <div role="status" aria-label="Toast">
        {announcement()}
      </div>
    </>
  );
};

const OPEN = { press: { role: "button", name: "Open Modal" } };

export default defineScenarios({
  component: "hide-outside",
  kind: "block",
  scenarios: [
    {
      id: "modal",
      title: "An open modal hides the page; a list above it and a toast stay in the tree",
      render: () => (
        <Page>
          {(announce) => (
            <Modal name="Modal" onAnnounce={announce}>
              <List kind="popover" />
            </Modal>
          )}
        </Page>
      ),
      steps: [
        OPEN,
        { press: { role: "button", name: "Toggle list" } },
        { press: { role: "button", name: "Toggle list" } },
        { press: { role: "button", name: "Announce" } },
        { press: { role: "button", name: "Close Modal" } },
      ],
    },
    {
      id: "handoff",
      title:
        "An inner modal over an outer one hides the outer, and the outer returns when it closes",
      render: () => (
        <Page>
          {() => (
            <Modal name="Outer">
              <Modal name="Inner" />
            </Modal>
          )}
        </Page>
      ),
      steps: [
        { press: { role: "button", name: "Open Outer" } },
        { press: { role: "button", name: "Open Inner" } },
        { press: { role: "button", name: "Close Inner" } },
        { press: { role: "button", name: "Close Outer" } },
      ],
    },
  ],
});
