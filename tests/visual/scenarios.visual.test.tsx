import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";
import { COMPONENTS } from "../../dev/harness/registry";
import { ScenarioStage } from "../../dev/harness/ScenarioStage";
import { type Input, runSteps, scenarioScope } from "../../dev/harness/steps";
import { settle } from "../../dev/harness/settle";
import { centre, input } from "../harness/input";

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
    const pointer: { at?: readonly [number, number] } = {};
    const tracked: Input = {
      ...input,
      press(el) {
        pointer.at = centre(el);
        return input.press(el);
      },
      hover(el) {
        pointer.at = centre(el);
        return input.hover(el);
      },
    };
    await runSteps(scenarioScope, scenario.steps ?? [], tracked, settle);
    // A list that opens under a still pointer is hovered or not by timing; moving it always hovers.
    if (pointer.at) {
      const [x, y] = pointer.at;
      await commands.mouse("move", x + 1, y);
      await commands.mouse("move", x, y);
      await settle();
    }
    await expect
      .element(page.elementLocator(document.body))
      .toMatchScreenshot(`${component}-${scenario.id}-${theme}-${width}`, {
        screenshotOptions: { animations: "disabled", caret: "hide" },
      });
  });
});
