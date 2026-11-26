import { createSignal, Show } from "solid-js";
import { type JSX } from "@solidjs/web";
import { Portal } from "@solidjs/web";
import { createAnchored } from "../../../src/lib/behavior/anchored";
import { defineScenarios } from "../../harness/types";

const OFFSET = 8;

const Placed = (props: {
  anchorStyle: JSX.CSSProperties;
  partStyle?: JSX.CSSProperties;
  matchAnchorWidth?: boolean;
  portal?: boolean;
  scroller?: boolean;
}) => {
  const [open, setOpen] = createSignal(false);
  const [anchor, setAnchor] = createSignal<HTMLElement>();
  const [floating, setFloating] = createSignal<HTMLElement>();
  createAnchored({
    anchor,
    floating,
    open,
    offset: OFFSET,
    matchAnchorWidth: props.matchAnchorWidth,
  });
  const part = () => (
    <div ref={setFloating} role="dialog" aria-label="Part" style={props.partStyle}>
      Part body
    </div>
  );
  const trigger = () => (
    <button
      ref={setAnchor}
      type="button"
      aria-expanded={open() ? "true" : "false"}
      style={props.anchorStyle}
      onClick={() => setOpen(!open())}
    >
      Anchor
    </button>
  );
  return (
    <>
      <Show when={props.scroller} fallback={trigger()}>
        <div
          data-slot="scroller"
          style={{ height: "200px", width: "240px", overflow: "auto", "margin-top": "40px" }}
        >
          <div style={{ height: "800px", "padding-top": "60px" }}>{trigger()}</div>
        </div>
      </Show>
      <Show when={open()}>{props.portal ? <Portal>{part()}</Portal> : part()}</Show>
    </>
  );
};

const PART = { width: "160px", height: "80px" };
const BELOW = { "margin-top": "120px", "margin-left": "20px" };
const PRESS = { press: { role: "button", name: "Anchor" } };

export default defineScenarios({
  component: "anchored",
  kind: "block",
  scenarios: [
    {
      id: "below",
      title: "A part opens below its trigger",
      render: () => <Placed anchorStyle={BELOW} partStyle={PART} />,
      steps: [PRESS],
    },
    {
      id: "flip",
      title: "A trigger at the bottom of the screen opens its part above",
      render: () => (
        <Placed
          anchorStyle={{ position: "fixed", bottom: "24px", left: "20px" }}
          partStyle={PART}
        />
      ),
      steps: [PRESS],
    },
    {
      id: "scrolling",
      title: "A part follows its trigger through a scroll container",
      render: () => <Placed anchorStyle={{}} partStyle={PART} scroller />,
      steps: [PRESS, { key: "PageDown" }],
    },
    {
      id: "match-width",
      title: "A narrow part is as wide as its trigger",
      render: () => (
        <Placed
          anchorStyle={{ ...BELOW, width: "300px" }}
          partStyle={{ width: "fit-content" }}
          matchAnchorWidth
        />
      ),
      steps: [PRESS],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root a part opens below its trigger",
      within: "shadow-root",
      render: () => <Placed anchorStyle={BELOW} partStyle={PART} />,
      steps: [PRESS],
    },
    {
      id: "widget-face",
      title: "A part drawn in the overlay sits under a trigger on a widget's face",
      render: () => (
        <div style={{ padding: "24px", "margin-top": "80px", width: "280px" }}>
          <Placed anchorStyle={{ "margin-left": "36px" }} partStyle={PART} portal />
        </div>
      ),
      steps: [PRESS],
    },
  ],
});
