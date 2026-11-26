import { createSignal, Show } from "solid-js";
import { Z_CLASS } from "../../../src/lib/layers";
import { SCRIM_CLASS, SCRIM_CONTAIN, SCROLL_CONTAIN } from "../../../src/lib/overlay-classes";
import { defineScenarios } from "../../harness/types";

const LINES = Array.from({ length: 40 }, (_, i) => i + 1);

const Modal = (props: { sheet?: boolean }) => {
  const [open, setOpen] = createSignal(false);
  return (
    <>
      <button
        type="button"
        class="fixed top-2 left-2"
        data-slot="scroll-contain-trigger"
        onClick={() => setOpen(true)}
      >
        Open modal
      </button>
      <Show when={open()}>
        <div
          data-slot="scroll-contain-scrim"
          class={`fixed inset-0 ${Z_CLASS.overlay} ${SCRIM_CLASS} ${SCRIM_CONTAIN}`}
        />
        <div
          role="dialog"
          aria-label="Modal"
          data-slot="scroll-contain-panel"
          class={`bg-popover fixed ${Z_CLASS.overlay} flex max-h-[60dvh] flex-col overflow-hidden ${SCROLL_CONTAIN} ${
            props.sheet
              ? "inset-x-0 bottom-0 rounded-t-xl"
              : "top-1/2 left-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg"
          }`}
        >
          <h2 data-slot="scroll-contain-header" class="shrink-0 p-4">
            Modal header
          </h2>
          <div
            data-slot="scroll-contain-body"
            tabindex="0"
            class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-4"
          >
            {LINES.map((n) => (
              <p>{`Line ${n}`}</p>
            ))}
          </div>
          <button type="button" class="shrink-0 p-4" onClick={() => setOpen(false)}>
            Close modal
          </button>
        </div>
      </Show>
      <div aria-hidden="true" style={{ height: "3000px" }} />
    </>
  );
};

const OPEN = { press: { role: "button", name: "Open modal" } };

export default defineScenarios({
  component: "scroll-contain",
  kind: "block",
  scenarios: [
    {
      id: "modal",
      title: "A centred modal over a tall page leaves the page where it is",
      render: () => <Modal />,
      steps: [OPEN, { press: { role: "button", name: "Close modal" } }],
    },
    {
      id: "sheet",
      title: "A sheet from the bottom edge leaves the page where it is",
      render: () => <Modal sheet />,
      steps: [OPEN, { press: { role: "button", name: "Close modal" } }],
    },
  ],
});
