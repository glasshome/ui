import { render } from "@solidjs/testing-library";
import { CLOSED_ROOTS } from "../../dev/harness/closed-roots";
import { findScenario } from "../../dev/harness/registry";
import { settle as settleFrames } from "../../dev/harness/settle";
import { scenarioScope } from "../../dev/harness/steps";
import { Within } from "../../dev/harness/Within";
import { afterTest } from "./leaks";

const realFrame = globalThis.requestAnimationFrame;

/** Waits until the page stops changing; on frozen frames it would wait forever, so it refuses. */
export async function settle(): Promise<void> {
  if (globalThis.requestAnimationFrame !== realFrame) throw new Error("settle needs real frames");
  await settleFrames();
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
  const scenario = findScenario(component, id);
  if (!scenario) throw new Error(`no scenario ${component}/${id}`);
  const { container } = render(() => (
    <Within mode={scenario.within ?? "page"}>{scenario.render()}</Within>
  ));
  await settle();
  return { root: container, scope: scenarioScope, scenario };
}
