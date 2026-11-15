import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { summarize } from "../../dev/drive/trace";
import type { TraceEvent } from "../../dev/drive/types";

const fixture: TraceEvent[] = JSON.parse(
  readFileSync(join(import.meta.dirname, "fixtures/step-trace.json"), "utf8"),
).traceEvents;

describe("summarize", () => {
  it("summarize counts restyles and their elements from the fixture", () => {
    expect(summarize(fixture)).toEqual({
      recalcs: 23,
      elementsRestyled: 90,
      largestRecalc: 9,
      styleMs: 27.716,
      layouts: 4,
      layoutMs: 0.72,
      paints: 34,
      longFrames: 0,
      longestFrameMs: 39,
      inputToPaintMs: 54.683,
    });
  });

  it("summarize returns zeros for an empty trace", () => {
    expect(summarize([])).toEqual({
      recalcs: 0,
      elementsRestyled: 0,
      largestRecalc: 0,
      styleMs: 0,
      layouts: 0,
      layoutMs: 0,
      paints: 0,
      longFrames: 0,
      longestFrameMs: 0,
      inputToPaintMs: null,
    });
  });

  it("inputToPaintMs is null without an EventTiming event", () => {
    expect(summarize(fixture.filter((e) => e.name !== "EventTiming")).inputToPaintMs).toBeNull();
  });

  it("counts a frame over 50 ms as long", () => {
    const frame = (ms: number): TraceEvent => ({
      name: "AnimationFrame",
      ph: "b",
      ts: 0,
      args: { animation_frame_timing_info: { duration_ms: ms } },
    });
    const perf = summarize([frame(49), frame(51), frame(120)]);
    expect(perf.longFrames).toBe(2);
    expect(perf.longestFrameMs).toBe(120);
  });
});
