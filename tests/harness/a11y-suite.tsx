import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";
import { CLOSED_ROOTS } from "../../dev/harness/closed-roots";
import { BLOCKS, COMPONENTS, kebab } from "../../dev/harness/registry";
import { runSteps } from "../../dev/harness/steps";
import type { Scenario } from "../../dev/harness/types";
import {
  expectAxeClean,
  expectGapsSeen,
  interactiveState,
  knownGaps,
  spokenTranscript,
} from "./a11y";
import { input, trackPointer } from "./input";
import { mountScenario, settle } from "./mount";

const VIEWPORT = { width: 1024, height: 768 };

const THEMES = ["light", "dark"] as const;

const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));
// A progress indicator keeps moving under reduced motion: WCAG 2.2.2 counts it as essential.
const showsProgress = (a: Animation) =>
  a.effect instanceof KeyframeEffect &&
  a.effect.target?.closest('[role="status"], [role="progressbar"]') != null;
const running = () =>
  [document, ...CLOSED_ROOTS]
    .flatMap((r) => r.getAnimations())
    .filter((a) => a.playState === "running" && !showsProgress(a));

async function mount(component: string, scenario: Scenario) {
  return mountScenario(component, scenario.id);
}

function sliceOf(index: number, count: number) {
  const groups = [...COMPONENTS, ...BLOCKS].sort(
    (a, b) => b.scenarios.length - a.scenarios.length || a.component.localeCompare(b.component),
  );
  const slices = Array.from({ length: count }, () => ({ size: 0, components: new Set<string>() }));
  for (const { component, scenarios } of groups) {
    const lightest = slices.reduce((min, s) => (s.size < min.size ? s : min));
    lightest.size += scenarios.length;
    lightest.components.add(component);
  }
  const mine = slices[index - 1]?.components ?? new Set<string>();
  return [...COMPONENTS, ...BLOCKS]
    .filter((c) => mine.has(c.component))
    .flatMap(({ component, scenarios }) =>
      scenarios.map((scenario) => ({ name: `${component} ${scenario.id}`, component, scenario })),
    );
}

export function a11yMatrix(index: number, count: number) {
  afterEach(async () => {
    cleanup();
    document.documentElement.classList.remove("dark");
    await commands.emulateMedia({ reducedMotion: "no-preference", colorScheme: "light" });
    await page.viewport(VIEWPORT.width, VIEWPORT.height);
  });

  const CASES = sliceOf(index, count);
  const KEYBOARD = CASES.filter((c) => c.scenario.keyboard !== undefined);

  describe.each(CASES)("$name", ({ component, scenario }) => {
    it.each(THEMES)("axe is clean before and after each step, %s theme", async (theme) => {
      const gaps = knownGaps(kebab(component), scenario.id, theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
      await commands.emulateMedia({ colorScheme: theme });
      // The previous test leaves the pointer anywhere; hovering a control at mount would make the first pass depend on test order.
      await commands.mouse("move", innerWidth - 1, innerHeight - 1);
      const { scope } = await mount(component, scenario);
      const seen = await expectAxeClean(document, gaps);
      const pointer = trackPointer(input);
      await runSteps(scope, scenario.steps ?? [], pointer.input, async () => {
        await pointer.rehover();
        await settle();
        seen.push(...(await expectAxeClean(document, gaps)));
      });
      expectGapsSeen(gaps, seen);
    });

    it("speaks the transcript on file", async () => {
      const { scope } = await mount(component, scenario);
      const spoken = await spokenTranscript(scope, scenario.steps ?? [], input);
      await expect(spoken.join("\n")).toMatchFileSnapshot(
        `__transcripts__/${component}.${scenario.id}.txt`,
      );
    });

    it("settles within a frame of each step with reduced motion", async () => {
      await commands.emulateMedia({ reducedMotion: "reduce" });
      const { scope } = await mount(component, scenario);
      await runSteps(scope, scenario.steps ?? [], input, async (index) => {
        await frame();
        await frame();
        expect(running(), `after step ${index}`).toEqual([]);
      });
    });

    it("has no horizontal overflow at 200% zoom", async () => {
      await page.viewport(VIEWPORT.width / 2, VIEWPORT.height / 2);
      const { scope } = await mount(component, scenario);
      const overflow = () =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth;
      expect(overflow()).toBeLessThanOrEqual(0);
      await runSteps(scope, scenario.steps ?? [], input, async (index) => {
        await settle();
        expect(overflow(), `after step ${index}`).toBeLessThanOrEqual(0);
      });
    });
  });

  describe.each(KEYBOARD)("$name by keyboard", ({ component, scenario }) => {
    it("ends where the pointer journey ends", async () => {
      const pointer = await mount(component, scenario);
      await runSteps(pointer.scope, scenario.steps ?? [], input, settle);
      const byPointer = interactiveState(pointer.scope());
      cleanup();

      const keys = await mount(component, scenario);
      await runSteps(keys.scope, scenario.keyboard ?? [], input, settle);
      expect(interactiveState(keys.scope())).toEqual(byPointer);
    });
  });

  const OPEN_LIST = CASES.some((c) => c.component === "Select") ? [null] : [];
  describe.each(OPEN_LIST)("the open list", () => {
    it("is inside the axe run and the transcript", async () => {
      const { scope } = await mountScenario("Select", "open");
      const spoken = await spokenTranscript(
        scope,
        [{ press: { role: "button", name: "Fruit Pick one" } }],
        input,
      );
      expect(spoken.at(-1)).toContain("listbox");
      const options = document.querySelectorAll('[role="option"]');
      expect(options.length).toBeGreaterThan(0);
      await expectAxeClean(document, []);
    });
  });
}
