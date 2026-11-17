import { createSignal, onMount, Show } from "solid-js";
import { createPresence } from "../../../src/lib/behavior/presence";
import { defineScenarios } from "../../harness/types";

const EXIT_MS = 400;

const Panel = (props: { keep?: boolean }) => {
  const [present, setPresent] = createSignal(false);
  const [element, setElement] = createSignal<HTMLElement>();
  const [mounts, setMounts] = createSignal(0);
  const presence = createPresence({
    present,
    element,
    exitMs: EXIT_MS,
    keep: () => props.keep ?? false,
  });
  const leaving = () => presence.phase() === "closing" || presence.phase() === "closed";
  return (
    <>
      <button type="button" on:click={() => setPresent(true)}>
        Open Panel
      </button>
      <button type="button" on:click={() => setPresent(false)}>
        Close Panel
      </button>
      <span role="status" aria-label="Panel phase">
        {presence.phase()}
      </span>
      <span role="status" aria-label="Panel mounts">
        {String(mounts())}
      </span>
      <Show when={presence.mounted()}>
        <div
          ref={(node) => {
            setElement(node);
            onMount(() => setMounts(mounts() + 1));
          }}
          role="dialog"
          aria-label="Panel"
          data-expanded={leaving() ? undefined : ""}
          data-closed={leaving() ? "" : undefined}
          style={{
            width: "220px",
            "margin-top": "120px",
            "margin-left": "20px",
            display: presence.dormant() ? "none" : undefined,
            "animation-name": leaving() ? "select-out" : "select-in",
            "animation-duration": leaving() ? "var(--duration-micro)" : "var(--duration-expand)",
          }}
        >
          Panel body
        </div>
      </Show>
    </>
  );
};

export default defineScenarios({
  component: "presence",
  kind: "block",
  scenarios: [
    {
      id: "exit",
      title: "A closed panel stays through its exit motion, then leaves",
      render: () => <Panel />,
      steps: [
        { press: { role: "button", name: "Open Panel" } },
        { press: { role: "button", name: "Close Panel" } },
      ],
    },
    {
      id: "keep",
      title: "A kept panel goes dormant when closed and reopens as the same nodes",
      render: () => <Panel keep />,
      steps: [
        { press: { role: "button", name: "Open Panel" } },
        { press: { role: "button", name: "Close Panel" } },
        { press: { role: "button", name: "Open Panel" } },
      ],
    },
  ],
});
