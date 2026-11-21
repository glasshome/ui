import { createSignal } from "solid-js";
import {
  ModalFrame,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
  useDialogContext,
} from "../../../src/lib/behavior/modal-root";
import { MODAL_MOTION } from "../../../src/lib/motion-classes";
import { defineScenarios } from "../../harness/types";

const EXIT_MS = 120;

const Done = () => {
  const ctx = useDialogContext();
  return (
    <button type="button" on:click={() => ctx.close()}>
      Done
    </button>
  );
};

const Modal = () => (
  <ModalRoot modal>
    <ModalTrigger>Open modal</ModalTrigger>
    <ModalFrame
      slot="modal"
      exitMs={EXIT_MS}
      scrimClass=""
      panelClass={MODAL_MOTION}
      panelStyle={{
        position: "fixed",
        top: "120px",
        left: "120px",
        width: "240px",
        padding: "16px",
      }}
    >
      <ModalTitle>Modal</ModalTitle>
      <p>Something to read.</p>
      <Done />
    </ModalFrame>
  </ModalRoot>
);

const KeptModal = () => {
  const [reading, setReading] = createSignal("Humidity 40%");
  return (
    <>
      <button type="button" on:click={() => setReading("Humidity 55%")}>
        Change reading
      </button>
      <ModalRoot modal keep>
        <ModalTrigger>Open modal</ModalTrigger>
        <ModalFrame
          slot="modal"
          exitMs={0}
          scrimClass=""
          panelClass=""
          panelStyle={{
            position: "fixed",
            top: "120px",
            left: "120px",
            width: "240px",
            padding: "16px",
          }}
        >
          <ModalTitle>Modal</ModalTitle>
          <p>{reading()}</p>
          <Done />
        </ModalFrame>
      </ModalRoot>
    </>
  );
};

const OUTSIDE = { x: 8, y: 8 };
const OPEN = { press: { role: "button", name: "Open modal" } };

export default defineScenarios({
  component: "modal-root",
  kind: "block",
  scenarios: [
    { id: "open", title: "Opens from its trigger", render: () => <Modal />, steps: [OPEN] },
    {
      id: "close",
      title: "Done closes it",
      render: () => <Modal />,
      steps: [OPEN, { press: { role: "button", name: "Done" } }],
    },
    {
      id: "escape",
      title: "Escape closes it",
      render: () => <Modal />,
      steps: [OPEN, { key: "Escape" }],
    },
    {
      id: "outside-press",
      title: "A press beside it closes it",
      render: () => <Modal />,
      steps: [OPEN, { pressAt: OUTSIDE }],
    },
    {
      id: "keep-reopen",
      title: "Reopens from where it rested",
      render: () => <KeptModal />,
      steps: [OPEN, { press: { role: "button", name: "Done" } }, OPEN],
    },
    {
      id: "keep-changed",
      title: "Reopens after its content changed while it rested",
      render: () => <KeptModal />,
      steps: [
        OPEN,
        { press: { role: "button", name: "Done" } },
        { press: { role: "button", name: "Change reading" } },
        OPEN,
      ],
    },
  ],
});
