import { readFileSync } from "node:fs";
import type { StepDiff } from "./diff";
import type { RunReport, StepPerf, StepReport } from "./types";

const escape = (text: string) =>
  text.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );

const STYLE = `
  body { margin: 0; padding: 24px; background: #1d1d20; color: #e8e8ea; font: 14px/1.5 system-ui, sans-serif; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 32px 0 8px; }
  .verdict { font-weight: 600; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
  .pair img { width: 100%; outline: 1px solid #55555c; }
  .label { color: #a0a0a8; font-size: 12px; margin-bottom: 4px; }
  pre { background: #121214; padding: 8px 12px; overflow-x: auto; font: 12px/1.45 ui-monospace, monospace; }
  .del { color: #ff9b9b; } .add { color: #9be29b; }
  table { border-collapse: collapse; font-variant-numeric: tabular-nums; }
  td, th { padding: 2px 12px 2px 0; text-align: right; } th:first-child, td:first-child { text-align: left; }
  .changed td { color: #ffd479; }
`;

const shot = (step: StepReport | undefined) =>
  step
    ? `<img src="data:image/png;base64,${readFileSync(step.screenshot).toString("base64")}">`
    : "<p>no step</p>";

function diffBlock(title: string, lines: string[]): string {
  if (lines.length === 0) return "";
  const body = lines
    .map((l) => {
      const cls = l.startsWith("-") ? "del" : l.startsWith("+") ? "add" : "";
      return `<span class="${cls}">${escape(l)}</span>`;
    })
    .join("\n");
  return `<div class="label">${title}</div><pre>${body}</pre>`;
}

function perfTable(base?: StepReport, head?: StepReport, changed: StepDiff["perf"] = {}): string {
  const keys = Object.keys((base ?? head)?.perf ?? {}) as (keyof StepPerf)[];
  const rows = keys.map(
    (k) =>
      `<tr class="${k in changed ? "changed" : ""}"><td>${k}</td><td>${base?.perf[k] ?? "-"}</td><td>${head?.perf[k] ?? "-"}</td></tr>`,
  );
  return `<table><tr><th>perf</th><th>base</th><th>head</th></tr>${rows.join("")}</table>`;
}

export function comparePage(
  base: RunReport,
  head: RunReport,
  diff: { same: boolean; steps: StepDiff[] },
): string {
  const steps = diff.steps.map((d) => {
    const b = base.steps[d.index];
    const h = head.steps[d.index];
    const focus = d.focus
      ? diffBlock("focus", [`- ${d.focus[0].join(" > ")}`, `+ ${d.focus[1].join(" > ")}`])
      : "";
    return `<h2>${d.index === 0 ? "mounted" : `step ${d.index}`}</h2>
      <div class="pair"><div><div class="label">base ${escape(base.build)}</div>${shot(b)}</div><div><div class="label">head ${escape(head.build)}</div>${shot(h)}</div></div>
      ${diffBlock("ax", d.ax)}${focus}${diffBlock("markers", d.markers)}${perfTable(b, h, d.perf)}`;
  });
  return `<!doctype html><meta charset="utf-8"><title>${escape(head.component)}/${escape(head.scenario)}</title><style>${STYLE}</style>
    <h1>${escape(head.component)}/${escape(head.scenario)} at ${head.cpuRate}x, ${escape(head.width)}, ${escape(head.theme)}</h1>
    <div class="verdict">${diff.same ? "Same behaviour" : "Behaviour differs"}</div>
    ${steps.join("\n")}`;
}
