# The component harness

Each component that has a folder under `dev/components/<slug>/` can be seen, driven and measured by an agent. The gallery's component page (`#/components/<slug>`) shows the same scenarios to a person.

## A component's folder

| File | Holds | Checked by |
|---|---|---|
| `scenarios.tsx` | `defineScenarios({ component, scenarios })`. Each scenario has an `id` (kebab-case), a `title`, `render`, and optionally `within` (`page`, `dialog`, `sheet`, `shadow-root`), `steps` (pointer and key input) and `keyboard` (the same journey by keyboard only). | `tests/harness/scenarios.test.tsx` |
| `contract.md` | One table row per behaviour, with an id such as `T1`. A row that fails today says "Gap:" and names its work item. | `tests/harness/contracts-covered.test.ts`: every id has an `it("T1 ...")` in `tests/contracts/<slug>.contract.test.tsx` |
| `budget.json` | Per scenario: `steps` (per step index: `elementsRestyled`, `largestRecalc` and `layouts`, each `{ max, reason }`) and `guest` (`workUnits` and the four guest DOM call counts). | Host steps: `bun gov ops ui drive --all --t50 --check` (gate `ui-harness`). Guest: `packages/private/widget-realm/tests/dom/ui-scenarios.test.ts` (gate `test-widget-realm`) |
| `a11y-gaps.json` (optional) | `[{ scenario, rule, item, theme? }]`: axe rules a scenario breaks today at some step, in one theme or both, each naming its work item. The entry fails once no step breaks it. | `tests/harness/a11y.ts` |

Every new scenario needs a budget: a missing scenario or step is an overrun.

## Blocks

A behaviour block under `src/lib/behavior/<name>.ts` is a subject like a component. Its folder is `dev/blocks/<name>/`, with the same three files, and `defineScenarios({ component: "<name>", kind: "block", scenarios })`. Every consumer above reads it the same way, with three differences:

- A block scenario renders plain elements and the block under test, and imports nothing from `src/solid`: the guest lane bundles the block's source, and a component import would make a second layer stack beside the guest's `@glasshome/ui/solid`. `tests/harness/scenarios.test.tsx` checks both this and that the name matches a file in `src/lib/behavior`.
- The browser lane renders it beside `BusyPage` (`dev/blocks/busy-page.tsx`, 1,000 elements), so a restyle of the whole document shows as a recalc of 1,000 or more. Step 0 restyles the fixture once, and its budget says so. The guest lane mounts the scenario without the fixture.
- A block has no gallery page and no export.

`bun gov ops ui list` marks block scenarios with `(block)`.

## Commands, from the dash root

- `bun gov ops ui list` lists components and scenario ids.
- `bun gov ops ui preview <slug> [ids...] [--after-steps] [--against <ref>]` writes a contact sheet PNG in both themes. `--changed` previews every component the working tree touched.
- `bun gov ops ui drive <slug> <id> [--t50]` drives one scenario and writes a report per step: screenshot, accessibility tree, focus path, `data-*` markers, style and layout counts.
- `bun gov ops ui drive <slug> <id> --against <ref> --check` compares two builds step by step and writes `compare.html`.

## Setting a budget

Times are reported and never gated; only counts gate. A replacement lands at or under the budget it replaces. To set new numbers:

1. Run `bun gov ops ui drive --all --t50 --json` three times.
2. For each step, take the highest of the three runs. Add 25% to `elementsRestyled`, since the measured T50 rate moves with host load and the frames an animation runs move with it. Keep `largestRecalc` and `layouts` exact.
3. For `guest`, run `bunx vitest run tests/dom/ui-scenarios.test.ts` in `packages/private/widget-realm` and sum each scenario's rows in `tests/dom/.ui-scenarios/report.json`. Add 25% and at least one to `workUnits`: guest work driven by frames (Spotlight's 600 ms sampler) runs as many ticks as the host draws while a step's press is in flight. Keep the DOM call counts exact.
4. Each `reason` names the date and why the number moved.

## Visual baselines

`bun run test:visual:update` regenerates them inside the browser image, so fonts and rendering match CI.
