import type { StepPerf, TraceEvent } from "./types";

const LONG_FRAME_MS = 50;
const ms = (us: number) => Math.round(us) / 1000;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function summarize(events: TraceEvent[]): StepPerf {
  const complete = (name: string) => events.filter((e) => e.name === name && e.ph === "X");
  const begins = (name: string) => events.filter((e) => e.name === name && e.ph === "b");

  const recalcs = complete("UpdateLayoutTree");
  const restyled = recalcs.map((e) => e.args?.elementCount ?? 0);
  const layouts = complete("Layout");
  const frames = begins("AnimationFrame").map(
    (e) => e.args?.animation_frame_timing_info?.duration_ms ?? 0,
  );
  const inputs = begins("EventTiming").map((e) => e.args?.data?.duration ?? 0);

  return {
    recalcs: recalcs.length,
    elementsRestyled: sum(restyled),
    largestRecalc: Math.max(0, ...restyled),
    styleMs: ms(sum(recalcs.map((e) => e.dur ?? 0))),
    layouts: layouts.length,
    layoutMs: ms(sum(layouts.map((e) => e.dur ?? 0))),
    paints: complete("Paint").length,
    longFrames: frames.filter((f) => f > LONG_FRAME_MS).length,
    longestFrameMs: Math.max(0, ...frames),
    inputToPaintMs: inputs.length === 0 ? null : Math.max(...inputs),
  };
}
