import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";
import { COMPONENTS } from "../../dev/harness/registry";
import { ScenarioStage } from "../../dev/harness/ScenarioStage";
import { runSteps, scenarioScope } from "../../dev/harness/steps";
import { settle } from "../../dev/harness/settle";
import { input } from "../harness/input";

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
});

const WIDTHS = { phone: [390, 844], desktop: [1280, 900] } as const;
const MATRIX = (["light", "dark"] as const).flatMap((theme) =>
  (Object.keys(WIDTHS) as (keyof typeof WIDTHS)[]).map((width) => [theme, width] as const),
);
const CASES = COMPONENTS.flatMap(({ component, scenarios }) =>
  scenarios.map((scenario) => ({ name: `${component} ${scenario.id}`, component, scenario })),
);

describe.each(CASES)("$name", ({ component, scenario }) => {
  it.each(MATRIX)("looks as recorded, %s theme, %s width", async (theme, width) => {
    const [w, h] = WIDTHS[width];
    await page.viewport(w, h);
    document.documentElement.classList.toggle("dark", theme === "dark");
    render(() => (
      <div class="bg-background text-foreground min-h-screen">
        <ScenarioStage
          component={component}
          id={scenario.id}
          material={null}
          dark={theme === "dark"}
        />
      </div>
    ));
    await settle();
    await document.fonts.ready;
    const steps = scenario.steps ?? [];
    await runSteps(scenarioScope, steps, input, settle);
    // A list that opens under the pointer is hovered or not by Chromium's timing.
    if (!steps.some((step) => "hover" in step)) {
      await commands.mouse("move", 0, 0);
      await settle();
    }
    await expect
      .element(page.elementLocator(document.body))
      .toMatchScreenshot(`${component}-${scenario.id}-${theme}-${width}`, {
        screenshotOptions: { animations: "disabled", caret: "hide" },
      });
  });
});
