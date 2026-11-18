import { ColorWheel, parseColor } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Wheel = (props: { at: number; disabled?: boolean }) => (
  <ColorWheel defaultValue={parseColor(`hsl(${props.at}, 100%, 50%)`)} disabled={props.disabled} />
);

const hue = { role: "slider", name: "Hue" };

export default defineScenarios({
  component: "ColorWheel",
  scenarios: [
    { id: "default", title: "A 200 px wheel at sky blue", render: () => <Wheel at={200} /> },
    {
      id: "keyboard",
      title: "Arrows turn the hue a degree, PageUp a page, Home back to red",
      render: () => <Wheel at={200} />,
      steps: [
        { press: hue },
        { key: "ArrowRight" },
        { key: "ArrowUp" },
        { key: "ArrowLeft" },
        { key: "PageUp" },
        { key: "Home" },
      ],
      keyboard: [
        { key: "Tab" },
        { key: "ArrowRight" },
        { key: "ArrowUp" },
        { key: "ArrowLeft" },
        { key: "PageUp" },
        { key: "Home" },
      ],
    },
    {
      id: "drag",
      title: "The thumb dragged around the ring",
      render: () => <Wheel at={0} />,
      steps: [{ drag: { ...hue, by: { x: -40, y: 80 } } }],
    },
    {
      id: "disabled",
      title: "A drag on a disabled wheel changes nothing",
      render: () => <Wheel at={0} disabled />,
      steps: [{ drag: { ...hue, by: { x: -40, y: 80 } } }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: () => <Wheel at={0} />,
      within: "shadow-root",
      steps: [{ drag: { ...hue, by: { x: -40, y: 80 } } }, { key: "ArrowRight" }],
    },
  ],
});
