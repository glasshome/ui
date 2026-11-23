import { expect } from "vitest";
import { findAll, findTarget, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { input } from "../harness/input";
import { mountScenario, settle } from "../harness/mount";

export const TRIGGER = { role: "button", name: "Fruit Pick one" };

export async function mount(id = "closed") {
  const { scope } = await mountScenario("Select", id);
  const trigger = () => {
    const [only, ...rest] = findAll(scope(), { role: "button" }).filter(
      (b) => b.getAttribute("aria-haspopup") === "listbox",
    );
    if (!only || rest.length > 0) throw new Error("expected one listbox trigger");
    return only;
  };
  const option = (name: string) => findTarget(scope(), { role: "option", name });
  const listboxes = () => findAll(scope(), { role: "listbox" });
  const highlighted = () =>
    findAll(scope(), { role: "option" }).filter((o) => o.hasAttribute("data-highlighted"));
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const closed = async () => {
    await expect.poll(() => listboxes()).toHaveLength(0);
  };
  return { scope, trigger, option, listboxes, highlighted, run, closed };
}
