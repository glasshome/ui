import { createSignal } from "solid-js";
import { ColorDisc, parseColor } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Disc = (props: { disabled?: boolean }) => {
  const [colour, setColour] = createSignal(parseColor("hsb(0, 50%, 100%)"));
  return <ColorDisc value={colour()} onChange={setColour} disabled={props.disabled} />;
};

const colour = { role: "slider", name: "Colour" };

export default defineScenarios({
  component: "ColorDisc",
  scenarios: [
    { id: "default", title: "A half-saturated red on the disc", render: () => <Disc /> },
    {
      id: "keyboard",
      title: "Left and Right turn the hue, Up and Down move the saturation",
      render: () => <Disc />,
      steps: [
        { key: "Tab" },
        { key: "ArrowRight" },
        { key: "ArrowUp" },
        { key: "ArrowLeft" },
        { key: "ArrowDown" },
      ],
    },
    {
      id: "drag",
      title: "The thumb dragged across the disc",
      render: () => <Disc />,
      steps: [{ drag: { ...colour, by: { x: 0, y: 60 } } }],
    },
    {
      id: "disabled",
      title: "A drag on a disabled disc changes nothing",
      render: () => <Disc disabled />,
      steps: [{ drag: { ...colour, by: { x: 0, y: 60 } } }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: () => <Disc />,
      within: "shadow-root",
      steps: [{ drag: { ...colour, by: { x: 0, y: 60 } } }],
    },
  ],
});
