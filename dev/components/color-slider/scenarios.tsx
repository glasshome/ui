import { ColorSlider, parseColor } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const SKY = "hsl(200, 100%, 50%)";

const Channels = () => (
  <div class="flex w-72 flex-col gap-6">
    <ColorSlider channel="hue" defaultValue={parseColor(SKY)} />
    <ColorSlider channel="saturation" defaultValue={parseColor(SKY)} aria-label="Saturation" />
    <ColorSlider channel="alpha" defaultValue={parseColor("hsla(200, 100%, 50%, 0.5)")} />
  </div>
);

const Hue = (props: { at: number; disabled?: boolean }) => (
  <div class="w-72">
    <ColorSlider
      channel="hue"
      defaultValue={parseColor(`hsl(${props.at}, 100%, 50%)`)}
      disabled={props.disabled}
      aria-label="Hue"
    />
  </div>
);

const hue = { role: "slider", name: "Hue" };

export default defineScenarios({
  component: "ColorSlider",
  scenarios: [
    {
      id: "default",
      title: "Hue, saturation and alpha of one sky blue",
      render: Channels,
    },
    {
      id: "keyboard",
      title: "Arrows step the hue, PageUp moves a page, Home and End go to the ends",
      render: () => <Hue at={200} />,
      steps: [
        { press: hue },
        { key: "ArrowRight" },
        { key: "PageUp" },
        { key: "Home" },
        { key: "End" },
      ],
      keyboard: [
        { key: "Tab" },
        { key: "ArrowRight" },
        { key: "PageUp" },
        { key: "Home" },
        { key: "End" },
      ],
    },
    {
      id: "drag",
      title: "The hue thumb dragged along the track",
      render: () => <Hue at={180} />,
      steps: [{ drag: { ...hue, by: { x: 60, y: 0 } } }],
    },
    {
      id: "disabled",
      title: "A press on a disabled colour slider changes nothing",
      render: () => <Hue at={180} disabled />,
      steps: [{ press: { role: "group" } }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: () => <Hue at={180} />,
      within: "shadow-root",
      steps: [{ drag: { ...hue, by: { x: 60, y: 0 } } }, { key: "ArrowRight" }],
    },
  ],
});
