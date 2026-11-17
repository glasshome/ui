# Spotlight: behaviour contract

Each line is one browser test in `tests/contracts/spotlight.contract.test.tsx`, named by its id. Tests read roles, names and the scrim and bubble parts' `data-slot`, never classes. Baseline written before the foundations move Spotlight's layer and Escape handling onto shared blocks.

| id | when | then |
|---|---|---|
| SL1 | mounted over a target | one scrim and one bubble show, the bubble holding "Step 1" and a `button` named "Next" |
| SL2 | Next is pressed | the bubble reads "Step 2" and the scrim's hole moves to the second target |
| SL3 | Escape | `onSkip` runs: the tour returns to "Step 1" |
