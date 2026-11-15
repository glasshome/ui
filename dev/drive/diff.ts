import type { MarkerRow, RunReport, StepPerf, StepReport } from "./types";

const CONTEXT = 3;

export interface StepDiff {
  index: number;
  ax: string[];
  focus: [string[], string[]] | null;
  markers: string[];
  perf: Partial<Record<keyof StepPerf, [number | null, number | null]>>;
}

/** Unified line diff with three lines of context; empty when the texts are equal. */
function lineDiff(base: string[], head: string[]): string[] {
  const n = base.length;
  const m = head.length;
  const table = new Int32Array((n + 1) * (m + 1));
  const common = (i: number, j: number) => table[i * (m + 1) + j] ?? 0;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * (m + 1) + j] =
        base[i] === head[j]
          ? common(i + 1, j + 1) + 1
          : Math.max(common(i + 1, j), common(i, j + 1));
    }
  }
  const lines: { mark: " " | "-" | "+"; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && base[i] === head[j]) {
      lines.push({ mark: " ", text: base[i] ?? "" });
      i++;
      j++;
    } else if (i < n && (j === m || common(i + 1, j) >= common(i, j + 1))) {
      lines.push({ mark: "-", text: base[i] ?? "" });
      i++;
    } else {
      lines.push({ mark: "+", text: head[j] ?? "" });
      j++;
    }
  }
  const changed = lines.flatMap((l, k) => (l.mark === " " ? [] : [k]));
  if (changed.length === 0) return [];
  const near = (k: number) => changed.some((c) => Math.abs(c - k) <= CONTEXT);
  const out: string[] = [];
  lines.forEach((l, k) => {
    if (!near(k)) return;
    if (k > 0 && !near(k - 1)) out.push("@@");
    out.push(`${l.mark} ${l.text}`);
  });
  return out;
}

const markerLine = (row: MarkerRow) =>
  [row.part, ...Object.entries(row.attrs).map(([k, v]) => `${k}="${v}"`)].join(" ");

const linesOf = (text: string | undefined) => (text ? text.split("\n") : []);

function diffStep(index: number, base?: StepReport, head?: StepReport): StepDiff {
  const baseFocus = base?.focus ?? [];
  const headFocus = head?.focus ?? [];
  const sameFocus =
    base !== undefined &&
    head !== undefined &&
    baseFocus.length === headFocus.length &&
    baseFocus.every((f, k) => f === headFocus[k]);
  const perf: StepDiff["perf"] = {};
  if (base && head) {
    for (const key of Object.keys(base.perf) as (keyof StepPerf)[]) {
      if (base.perf[key] !== head.perf[key]) perf[key] = [base.perf[key], head.perf[key]];
    }
  }
  return {
    index,
    ax: lineDiff(linesOf(base?.ax), linesOf(head?.ax)),
    focus: sameFocus ? null : [baseFocus, headFocus],
    markers: lineDiff((base?.markers ?? []).map(markerLine), (head?.markers ?? []).map(markerLine)),
    perf,
  };
}

/** `same` is about behaviour: ax, focus, markers and the step count. Perf is reported and never decides it, since timings vary run to run. */
export function diffReports(
  base: RunReport,
  head: RunReport,
): { same: boolean; steps: StepDiff[] } {
  const count = Math.max(base.steps.length, head.steps.length);
  const steps = Array.from({ length: count }, (_, k) => diffStep(k, base.steps[k], head.steps[k]));
  const same =
    base.steps.length === head.steps.length &&
    steps.every((s) => s.ax.length === 0 && s.focus === null && s.markers.length === 0);
  return { same, steps };
}
