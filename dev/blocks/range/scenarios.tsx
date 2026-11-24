import { createSignal, For } from "solid-js";
import {
  alongTrack,
  createDrag,
  createRange,
  DRAG_CLAIM,
  RANGE_CLAIM,
} from "../../../src/lib/behavior/range";
import { defineScenarios } from "../../harness/types";

const NAMES = ["Low", "High"];

const Range = () => {
  const [changes, setChanges] = createSignal(0);
  const [ends, setEnds] = createSignal(0);
  const range = createRange({
    values: () => undefined,
    defaultValues: () => [20, 60],
    min: () => 0,
    max: () => 100,
    step: () => 5,
    minStepsBetween: () => 2,
    disabled: () => false,
    onChange: () => setChanges((n) => n + 1),
    onChangeEnd: () => setEnds((n) => n + 1),
  });
  let active = 0;
  const drag = createDrag({
    disabled: () => false,
    start: (e, rect) => {
      active = range.closestThumb(range.valueAt(alongTrack(e, rect)));
    },
    move: (e, rect) => range.setThumb(active, range.valueAt(alongTrack(e, rect))),
    end: range.dragEnd,
  });
  return (
    <div class="flex w-72 flex-col gap-4">
      <div
        data-testid="track"
        data-changes={changes()}
        data-ends={ends()}
        class="bg-muted relative h-8 w-full touch-none rounded"
        data-claim={DRAG_CLAIM}
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onPointerCancel={drag.onPointerCancel}
      >
        <For each={[0, 1]}>
          {(index) => (
            <span
              role="slider"
              tabIndex={0}
              aria-label={NAMES[index]}
              aria-valuenow={range.values()[index]}
              data-claim={RANGE_CLAIM}
              class="bg-primary absolute top-0 size-8 -translate-x-1/2 rounded-full"
              style={{ left: `${range.fraction(range.values()[index] ?? 0) * 100}%` }}
              onKeyDown={(e) => range.keyDown(e, index)}
              onBlur={range.blur}
            />
          )}
        </For>
      </div>
      <button type="button">After</button>
    </div>
  );
};

export default defineScenarios({
  component: "range",
  kind: "block",
  scenarios: [
    {
      id: "keyboard",
      title: "Keys step, page and jump a thumb, which stops short of its neighbour",
      render: () => <Range />,
      steps: [
        { key: "Tab" },
        { key: "ArrowRight" },
        { key: "PageUp" },
        { key: "End" },
        { key: "Home" },
      ],
    },
    {
      id: "drag",
      title: "A drag moves the thumb closest to the press",
      render: () => <Range />,
      steps: [{ drag: { role: "slider", name: "High", by: { x: 40, y: 0 }, stepMs: 16 } }],
    },
  ],
});
