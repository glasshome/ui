import { render } from "@solidjs/testing-library";
import { findScenario } from "../../dev/harness/registry";
import { runSteps, scenarioScope } from "../../dev/harness/steps";
import { Within } from "../../dev/harness/Within";
import { input } from "../harness/input";
import { settle } from "../harness/mount";

export const pageY = () => document.scrollingElement?.scrollTop ?? 0;

export const corner = { x: 8, y: 8 };

export function find(selector: string): Element {
  for (const root of scenarioScope()) {
    const hit = root.querySelector(selector);
    if (hit) return hit;
  }
  throw new Error(`no ${selector}`);
}

export interface Parts {
  scrim: Element;
  body: Element;
  header: Element | null;
  close: () => Promise<void>;
}

export async function openBlock(id: string, within: "page" | "shadow-root"): Promise<Parts> {
  const scenario = findScenario("scroll-contain", id);
  if (!scenario) throw new Error(`no scenario ${id}`);
  render(() => <Within mode={within}>{scenario.render()}</Within>);
  await settle();
  await runSteps(scenarioScope, [{ press: { role: "button", name: "Open modal" } }], input, settle);
  return {
    scrim: find('[data-slot="scroll-contain-scrim"]'),
    body: find('[data-slot="scroll-contain-body"]'),
    header: find('[data-slot="scroll-contain-header"]'),
    close: () =>
      runSteps(scenarioScope, [{ press: { role: "button", name: "Close modal" } }], input, settle),
  };
}
