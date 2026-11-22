import { findAll, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { input } from "../harness/input";
import { mountScenario, settle } from "../harness/mount";

export const press = (name: string): Step => ({ press: { role: "button", name } });
export const OUTSIDE = { x: 500, y: 330 };

export async function mount(id: string) {
  const { scope } = await mountScenario("dismiss", id);
  const dialogs = () => findAll(scope(), { role: "dialog" });
  const text = (name: string) => findAll(scope(), { role: "status", name })[0]?.textContent ?? "";
  const button = (name: string) => findAll(scope(), { role: "button", name })[0] as HTMLElement;
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  return { scope, dialogs, text, button, run };
}
