import { render } from "@solidjs/testing-library";
import { page } from "vitest/browser";
import { CLOSED_ROOTS } from "../../dev/harness/closed-roots";
import { loadScenario } from "../../dev/harness/load-scenario";
import { settleDom } from "../../dev/harness/settle";
import { SCENARIO_WIDTHS } from "../../dev/harness/types";
import { scenarioScope } from "../../dev/harness/steps";
import { loadWithin } from "../../dev/harness/load-within";
import { afterTest } from "./leaks";

const realFrame = globalThis.requestAnimationFrame;

/** Waits until the page stops changing; on frozen frames it would wait forever, so it refuses. */
export async function settle(): Promise<void> {
  if (globalThis.requestAnimationFrame !== realFrame) throw new Error("settle needs real frames");
  await settleDom();
}

/** A closed shadow root on the page, which settle and the leak check see until the test ends. */
export function openClosedRoot(parent: Element = document.body): ShadowRoot {
  const host = parent.appendChild(document.createElement("div"));
  const root = host.attachShadow({ mode: "closed" });
  CLOSED_ROOTS.add(root);
  afterTest(() => CLOSED_ROOTS.delete(root));
  return root;
}

export function focusedElement(): Element | null {
  for (const root of CLOSED_ROOTS) if (root.activeElement) return root.activeElement;
  return document.activeElement;
}

export async function mountScenario(component: string, id: string) {
  const scenario = await loadScenario(component, id);
  if (!scenario) throw new Error(`no scenario ${component}/${id}`);
  if (scenario.width) await page.viewport(...SCENARIO_WIDTHS[scenario.width]);
  const Frame = await loadWithin(scenario.within ?? "page");
  const { container } = render(() => <Frame>{scenario.render()}</Frame>);
  await settle();
  return { root: container, scope: scenarioScope, scenario };
}
