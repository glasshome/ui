import type { JSX } from "solid-js";

export interface Target {
  role: string;
  name?: string;
}

export type Step =
  | { press: Target }
  | { touch: Target }
  | { hover: Target }
  | { key: string }
  | { type: string };

export type Within = "page" | "dialog" | "sheet" | "shadow-root";

export interface Scenario {
  id: string;
  title: string;
  render: () => JSX.Element;
  within?: Within;
  steps?: Step[];
  /** The same journey as `steps`, by keys only. */
  keyboard?: Step[];
}

export interface ComponentScenarios {
  component: string;
  scenarios: Scenario[];
}

export const defineScenarios = (c: ComponentScenarios): ComponentScenarios => c;
