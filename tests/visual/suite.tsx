import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";
import { COMPONENTS } from "../../dev/harness/registry";
import { ScenarioStage } from "../../dev/harness/ScenarioStage";
import { runSteps, scenarioScope } from "../../dev/harness/steps";
import { settleDom } from "../../dev/harness/settle";
import { usesFinger } from "../../dev/harness/types";
import { input, trackPointer } from "../harness/input";

const WIDTHS = { phone: [390, 844], desktop: [1280, 900] } as const;
const MATRIX = (["light", "dark"] as const).flatMap((theme) =>
  (Object.keys(WIDTHS) as (keyof typeof WIDTHS)[]).map((width) => [theme, width] as const),
);
const ALL_CASES = COMPONENTS.flatMap(({ component, scenarios }) =>
  scenarios.map((scenario) => ({ name: `${component} ${scenario.id}`, component, scenario })),
);
/** Every scenario a finger drives, or every one a mouse and keyboard drive. */
export function visualMatrix(finger: boolean) {
  const CASES = ALL_CASES.filter((c) => usesFinger(c.scenario.steps ?? []) === finger);
  describe.each(CASES)("$name", ({ component, scenario }) => {
    it.each(MATRIX)("looks as recorded, %s theme, %s width", async (theme, width) => {
      const [w, h] = WIDTHS[width];
      await page.viewport(w, h);
      // The last scenario's pointer would otherwise hover whatever this one draws under it.
      await commands.mouse("move", w - 1, h - 1);
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
      await settleDom();
      await document.fonts.ready;
      const pointer = trackPointer(input);
      await runSteps(scenarioScope, scenario.steps ?? [], pointer.input, settleDom);
      await pointer.rehover();
      await settleDom();
      await expect
        .element(page.elementLocator(document.body))
        .toMatchScreenshot(`${component}-${scenario.id}-${theme}-${width}`, {
          screenshotOptions: { animations: "disabled", caret: "hide" },
          // A pressed or focused glass edge sometimes rasterizes one pixel over; a real change differs by more.
          comparatorOptions: { allowedMismatchedPixels: 150 },
        });
    });
  });
}
