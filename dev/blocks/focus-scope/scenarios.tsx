import { createSignal, Show } from "solid-js";
import { type JSX } from "@solidjs/web";
import { createFocusScope, type InitialFocus } from "../../../src/lib/behavior/focus-scope";
import { effect } from "../../../src/lib/behavior/solid";
import { defineScenarios } from "../../harness/types";

const Scope = (props: { children: JSX.Element; initialFocus?: InitialFocus }) => {
  const [open, setOpen] = createSignal(false);
  const [container, setContainer] = createSignal<HTMLElement>();
  createFocusScope({
    container,
    active: open,
    trapped: () => true,
    initialFocus: props.initialFocus ?? "first",
  });
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Show when={open()}>
        <div ref={setContainer} role="dialog" aria-label="Scope" tabindex="-1">
          {props.children}
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </Show>
      <button type="button">Outside</button>
    </>
  );
};

const Preview = () => {
  const [host, setHost] = createSignal<HTMLElement>();
  effect(host, (el) => {
    if (!el) return;
    const root = el.attachShadow({ mode: "open" });
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Preview";
    root.append(button);
  });
  return <div ref={setHost} />;
};

export default defineScenarios({
  component: "focus-scope",
  kind: "block",
  scenarios: [
    {
      id: "trap",
      title: "Tab wraps inside a trapped scope and skips a hidden control",
      render: () => (
        <Scope>
          <button type="button">First</button>
          <button type="button">Middle</button>
          <button type="button" hidden>
            Skipped
          </button>
          <button type="button">Last</button>
        </Scope>
      ),
      steps: [
        { press: { role: "button", name: "Open" } },
        { key: "Tab" },
        { key: "Tab" },
        { key: "Tab" },
        { key: "Tab" },
        { key: "Tab" },
      ],
    },
    {
      id: "restore",
      title: "Closing the scope returns focus to the control that opened it",
      render: () => (
        <Scope>
          <input type="text" aria-label="Name" />
        </Scope>
      ),
      steps: [
        { press: { role: "button", name: "Open" } },
        { press: { role: "button", name: "Close" } },
      ],
    },
    {
      id: "radio-group",
      title: "A radio group is one Tab stop inside a trapped scope",
      render: () => (
        <Scope>
          <button type="button">Before</button>
          <div role="radiogroup" aria-label="Size">
            <label>
              <input type="radio" name="size" value="s" /> Small
            </label>
            <label>
              <input type="radio" name="size" value="m" /> Medium
            </label>
            <label>
              <input type="radio" name="size" value="l" /> Large
            </label>
          </div>
          <button type="button">After</button>
        </Scope>
      ),
      steps: [
        { press: { role: "button", name: "Open" } },
        { key: "Tab" },
        { key: "Tab" },
        { key: "Tab" },
        { key: "Tab" },
      ],
    },
    {
      id: "nested-shadow",
      title: "Tab reaches a control inside an open shadow root nested in the scope",
      within: "shadow-root",
      render: () => (
        <Scope>
          <button type="button">Before</button>
          <Preview />
          <button type="button">After</button>
        </Scope>
      ),
      steps: [
        { press: { role: "button", name: "Open" } },
        { key: "Tab" },
        { key: "Tab" },
        { key: "Tab" },
      ],
    },
  ],
});
