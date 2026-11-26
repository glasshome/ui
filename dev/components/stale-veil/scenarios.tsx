import { createSignal } from "solid-js";
import { Button, Card, Icon, STALE_CONTENT, StaleVeil } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

export const LightTile = (props: { shown: boolean; lit?: boolean }) => (
  <Card
    class={`relative h-40 w-64 rounded-3xl p-4 ${props.lit ? "glass-tint [--glass-tone:var(--warning)] [--glass-wash:30%]" : ""} ${props.shown ? STALE_CONTENT : ""}`}
  >
    <button type="button" class="flex size-full flex-col text-left">
      <span class="flex items-center gap-2">
        <Icon icon="lucide:lightbulb" width={20} />
        <span class="text-sm font-medium">Hallway</span>
      </span>
      <span class="mt-6 text-4xl font-semibold tracking-tight">{props.lit ? "On" : "Off"}</span>
      <span class="text-muted-foreground mt-1 text-sm">
        {props.lit ? "Brightness 80%" : "Last on 07:42"}
      </span>
    </button>
    <StaleVeil shown={props.shown} />
  </Card>
);

const Reveal = () => {
  const [stale, setStale] = createSignal(false);
  return (
    <div class="flex w-64 flex-col gap-3">
      <LightTile shown={stale()} lit />
      <Button
        variant="outline"
        aria-pressed={stale() ? "true" : "false"}
        onClick={() => setStale((on) => !on)}
      >
        Stale
      </Button>
    </div>
  );
};

export default defineScenarios({
  component: "StaleVeil",
  scenarios: [
    {
      id: "over-a-widget",
      title: "A stored picture of a widget that is not live yet",
      render: () => <LightTile shown />,
    },
    {
      id: "over-a-lit-widget",
      title: "The same, over the lightest surface a widget shows",
      render: () => <LightTile shown lit />,
    },
    {
      id: "reveal",
      title: "Fades in once when the toggle is pressed, gone when pressed again",
      render: () => <Reveal />,
      steps: [{ key: "Tab" }, { key: "Tab" }, { key: "Enter" }],
    },
  ],
});
