import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { findTarget, scenarioScope } from "../../dev/harness/steps";
import { mountScenario, settle } from "./mount";
import { input } from "./input";
import { runSteps } from "../../dev/harness/steps";

afterEach(cleanup);

describe("findTarget", () => {
  it("finds an option inside the portaled list", async () => {
    const { root, scope } = await mountScenario("Select", "closed");
    await runSteps(scope, [{ press: { role: "button", name: "Fruit Pick one" } }], input, settle);
    const option = findTarget(scope(), { role: "option", name: "Cherry" });
    expect(root.contains(option)).toBe(false);
  });

  it("skips an aria-hidden subtree", () => {
    render(() => (
      <div>
        <div aria-hidden="true">
          <button type="button">Save</button>
        </div>
        <button type="button">Save</button>
      </div>
    ));
    const save = findTarget(scenarioScope(), { role: "button", name: "Save" });
    expect(save.parentElement?.getAttribute("aria-hidden")).toBeNull();
  });

  it("names the target it cannot find", () => {
    render(() => <button type="button">Save</button>);
    expect(() => findTarget(scenarioScope(), { role: "button", name: "Cancel" })).toThrow(
      'no button "Cancel"',
    );
  });
});
