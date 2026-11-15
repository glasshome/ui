import { render } from "@solidjs/testing-library";
import { CLOSED_ROOTS } from "../../dev/harness/closed-roots";
import { findScenario } from "../../dev/harness/registry";
import { settle } from "../../dev/harness/settle";
import { scenarioScope } from "../../dev/harness/steps";
import { Within } from "../../dev/harness/Within";

export { settle };

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
