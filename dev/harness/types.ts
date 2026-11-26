import type { JSX } from "solid-js";

export interface Target {
  role: string;
  name?: string;
}

export type Step =
  | { press: Target }
  | { touch: Target }
  | { hover: Target }
  /** A secondary-button mouse press, the way a context menu opens. */
  | { contextMenu: Target }
  /** A touch held past the long-press threshold, then lifted. */
  | { hold: Target }
  /** A mouse press at a point of the viewport, for what no role names: the page behind a modal. */
  | { pressAt: { x: number; y: number } }
  /** A mouse press at the target's centre, moved by `by` px in four moves `stepMs` apart, then released. */
  | { drag: Target & { by: { x: number; y: number }; stepMs: number } }
  | { key: string }
  | { type: string };

export type Within = "page" | "dialog" | "sheet" | "shadow-root";

export interface Scenario {
  id: string;
  title: string;
  render: () => JSX.Element;
  within?: Within;
  /** The viewport it needs; a ResponsiveDialog is a sheet only below `sm`. Unset runs at the runner's own. */
  width?: "phone";
  steps?: Step[];
  /** The same journey as `steps`, by keys only. */
  keyboard?: Step[];
}

/** Scenario widths, as the drive names them. */
export const SCENARIO_WIDTHS = { phone: [390, 844] } as const;

export type SubjectKind = "component" | "block";

export interface ComponentScenarios {
  component: string;
  /** A block is a behaviour primitive under src/lib/behavior; the default is a component. */
  kind?: SubjectKind;
  scenarios: Scenario[];
}

/** A scenario without its render, as the stage publishes it for tools outside the page. */
export interface IndexedScenario {
  id: string;
  title: string;
  within: Within;
  width: "phone" | null;
  steps: Step[];
  keyboard: Step[] | null;
}

export interface IndexedComponent {
  component: string;
  slug: string;
  kind: SubjectKind;
  scenarios: IndexedScenario[];
}

export const defineScenarios = (c: ComponentScenarios): ComponentScenarios => c;

/** Whether the steps need a page with a touch screen. */
export const usesFinger = (steps: readonly Step[]) =>
  steps.some((step) => "touch" in step || "hold" in step);
