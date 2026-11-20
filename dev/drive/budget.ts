import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PKG } from "./serve";
import type { RunReport, StepPerf } from "./types";

interface Limit {
  max: number;
  reason: string;
}

/** Counts only: times vary run to run, so they are reported and never gated. */
const GATED = [
  "elementsRestyled",
  "largestRecalc",
  "layouts",
] as const satisfies (keyof StepPerf)[];

type StepBudget = Record<(typeof GATED)[number], Limit>;

interface ScenarioBudget {
  steps: Record<string, StepBudget>;
  mainThreadMotion?: string[];
  guest?: unknown;
}

export type Budget = Record<string, ScenarioBudget>;

export function readBudget(slug: string): Budget {
  const file = [
    join(PKG, "dev/components", slug, "budget.json"),
    join(PKG, "dev/blocks", slug, "budget.json"),
  ].find(existsSync);
  return file !== undefined ? (JSON.parse(readFileSync(file, "utf8")) as Budget) : {};
}

export function checkBudget(report: RunReport, budget: Budget): string[] {
  const scenario = budget[report.scenario];
  if (!scenario) return [`${report.scenario} has no budget`];
  const allowed = scenario.mainThreadMotion ?? [];
  return report.steps.flatMap(({ index, perf, mainThreadMotion }) => {
    const limits = scenario.steps[String(index)];
    if (!limits) return [`${report.scenario} step ${index} has no budget`];
    return [
      ...GATED.filter((field) => perf[field] > limits[field].max).map(
        (field) =>
          `${report.scenario} step ${index} ${field} ${perf[field]} > ${limits[field].max}`,
      ),
      ...mainThreadMotion
        .filter((property) => !allowed.includes(property))
        .map((p) => `${report.scenario} step ${index} animates ${p} on the main thread`),
    ];
  });
}
