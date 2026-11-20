import type { Step } from "../harness/types";

/** Chromium 1.63 trace event names: UpdateLayoutTree, Layout, Paint (complete), AnimationFrame and EventTiming (async begin/end). */
export interface TraceEvent {
  name: string;
  ph: string;
  ts: number;
  dur?: number;
  args?: {
    elementCount?: number;
    data?: { duration?: number; type?: string };
    animation_frame_timing_info?: { duration_ms?: number };
  };
}

export interface StepPerf {
  recalcs: number;
  elementsRestyled: number;
  largestRecalc: number;
  styleMs: number;
  layouts: number;
  layoutMs: number;
  paints: number;
  longFrames: number;
  longestFrameMs: number;
  inputToPaintMs: number | null;
}

/** `part` is `${role} "${name}"` for a named node, else `${tag}[data-slot=…]` or the tag alone. */
export interface MarkerRow {
  part: string;
  attrs: Record<string, string>;
}

export interface StepReport {
  index: number;
  step: Step | null;
  settled: boolean;
  settleMs: number;
  screenshot: string;
  ax: string;
  focus: string[];
  markers: MarkerRow[];
  /** Properties the step's animations interpolate off the compositor, sorted. */
  mainThreadMotion: string[];
  perf: StepPerf;
}

/** What the driver did to the page, in order, so a reader can see the CPU rate was 1 until the first step. */
export type TimelineEntry =
  | { kind: "throttle"; rate: number }
  | { kind: "load" }
  | { kind: "mount" }
  | { kind: "step"; index: number };

export interface RunReport {
  component: string;
  scenario: string;
  build: string;
  cpuRate: number;
  width: string;
  theme: string;
  steps: StepReport[];
  timeline: TimelineEntry[];
  errors: string[];
  dir: string;
}
