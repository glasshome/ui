import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";
import { COMPONENTS } from "../../dev/harness/registry";
import { ScenarioStage } from "../../dev/harness/ScenarioStage";
import { runSteps, scenarioScope } from "../../dev/harness/steps";
import { settle } from "../../dev/harness/settle";
import { input, trackPointer } from "../harness/input";

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
});

const WIDTHS = { phone: [390, 844], desktop: [1280, 900] } as const;
const MATRIX = (["light", "dark"] as const).flatMap((theme) =>
  (Object.keys(WIDTHS) as (keyof typeof WIDTHS)[]).map((width) => [theme, width] as const),
);
const ALL_CASES = COMPONENTS.flatMap(({ component, scenarios }) =>
  scenarios.map((scenario) => ({ name: `${component} ${scenario.id}`, component, scenario })),
);
const usesFinger = (c: (typeof ALL_CASES)[number]) =>
  (c.scenario.steps ?? []).some((step) => "touch" in step || "hold" in step);
// A finger leaves the page without a mouse for good: turning touch emulation off reports no pointer and no hover.
const CASES = [...ALL_CASES.filter((c) => !usesFinger(c)), ...ALL_CASES.filter(usesFinger)];

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
    await settle();
    await document.fonts.ready;
    const pointer = trackPointer(input);
    await runSteps(scenarioScope, scenario.steps ?? [], pointer.input, settle);
    await pointer.rehover();
    await settle();
    await expect
      .element(page.elementLocator(document.body))
      .toMatchScreenshot(`${component}-${scenario.id}-${theme}-${width}`, {
        screenshotOptions: { animations: "disabled", caret: "hide" },
      });
  });
});
