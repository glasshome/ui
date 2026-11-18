import { Slider } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Brightness = (props: { at: number; disabled?: boolean }) => (
  <div class="w-72">
    <Slider defaultValue={[props.at]} disabled={props.disabled} aria-label="Brightness" />
  </div>
);

const Sliders = () => (
  <div class="flex w-72 flex-col gap-6">
    <Slider defaultValue={[40]} aria-label="Brightness" />
    <Slider
      defaultValue={[19, 23]}
      min={10}
      max={30}
      step={0.5}
      minStepsBetweenThumbs={4}
      markers={[21]}
      fillTone={["oklch(0.7 0.15 250)", "oklch(0.75 0.16 50)"]}
      aria-label="Comfort range"
    />
    <Slider defaultValue={[30]} disabled aria-label="Volume" />
  </div>
);

const thumb = { role: "slider", name: "Brightness" };

export default defineScenarios({
  component: "Slider",
  scenarios: [
    {
      id: "default",
      title: "Brightness at 40, a comfort range with a marker, Volume disabled",
      render: Sliders,
    },
    {
      id: "keyboard",
      title: "Arrows step, PageUp moves a page, End and Home go to the ends",
      render: () => <Brightness at={40} />,
      steps: [
        { press: thumb },
        { key: "ArrowRight" },
        { key: "ArrowUp" },
        { key: "PageUp" },
        { key: "End" },
        { key: "Home" },
        { key: "ArrowLeft" },
      ],
      keyboard: [
        { key: "Tab" },
        { key: "ArrowRight" },
        { key: "ArrowUp" },
        { key: "PageUp" },
        { key: "End" },
        { key: "Home" },
        { key: "ArrowLeft" },
      ],
    },
    {
      id: "drag",
      title: "A thumb dragged along the track",
      render: () => <Brightness at={50} />,
      steps: [{ drag: { ...thumb, by: { x: 60, y: 0 } } }],
    },
    {
      id: "track-press",
      title: "A press on the track brings the thumb there",
      render: () => <Brightness at={10} />,
      steps: [{ press: { role: "group" } }],
    },
    {
      id: "disabled",
      title: "A press on a disabled slider changes nothing",
      render: () => <Brightness at={30} disabled />,
      steps: [{ press: { role: "group" } }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: () => <Brightness at={50} />,
      within: "shadow-root",
      steps: [{ drag: { ...thumb, by: { x: 60, y: 0 } } }, { key: "ArrowRight" }],
    },
  ],
});
