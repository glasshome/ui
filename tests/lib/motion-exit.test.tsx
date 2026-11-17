import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import {
  FIELD_MOTION,
  MODAL_MOTION,
  MOTION_EXIT_MS,
  OVERLAY_MOTION,
  SCRIM_MOTION,
} from "../../src/lib/motion-classes";
import { EASE, TRANSITION_MS } from "../../src/solid/bottom-sheet/constants";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const seconds = (value: string) =>
  value.endsWith("ms") ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;

const list = (value: string) => value.split(",").map((part) => seconds(part.trim()));

function exitMs(el: Element): number {
  const style = getComputedStyle(el);
  const spans = (durations: string, delays: string) => {
    const lengths = list(durations);
    const lags = list(delays);
    return lengths.map((length, i) => length + (lags[i % lags.length] ?? 0));
  };
  return Math.max(
    ...spans(style.animationDuration, style.animationDelay),
    ...spans(style.transitionDuration, style.transitionDelay),
  );
}

const DOORS = {
  overlay: { class: OVERLAY_MOTION, attrs: { "data-closed": "" } },
  modal: { class: MODAL_MOTION, attrs: { "data-closed": "" } },
  scrim: { class: SCRIM_MOTION, attrs: { "data-closed": "" } },
  field: { class: FIELD_MOTION, attrs: { "data-closed": "" } },
  sheet: {
    class: "bs-content",
    attrs: {
      "data-state": "closing",
      style: `--bs-duration: ${TRANSITION_MS}ms; --bs-ease: ${EASE}`,
    },
  },
} as const;

describe("MOTION_EXIT_MS", () => {
  it.each(Object.keys(DOORS) as (keyof typeof DOORS)[])(
    "%s declares the exit its closed classes run",
    (door) => {
      const view = render(() => <div class={DOORS[door].class} {...DOORS[door].attrs} />);
      expect(exitMs(view.container.firstElementChild as Element)).toBe(MOTION_EXIT_MS[door]);
    },
  );
});
