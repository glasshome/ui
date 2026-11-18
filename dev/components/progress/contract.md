# Progress: behaviour contract

Each line is one browser test in `tests/contracts/progress.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states and `data-*` markers, never classes. Baseline written on Kobalte before Progress left it.

| id | when | then |
|---|---|---|
| PG1 | a value | the root (`data-slot="progress"`) is a `progressbar` named by its label, with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` and `aria-valuetext` the value as a percent |
| PG2 | below the maximum | root, track and fill carry `data-progress="loading"` |
| PG3 | at the maximum | root, track and fill carry `data-progress="complete"` |
| PG4 | `indeterminate` | no `aria-valuenow`, no `aria-valuetext` and no `data-progress`; root, track and fill carry `data-indeterminate` |
| PG5 | `minValue` and `maxValue` | they become `aria-valuemin` and `aria-valuemax`, the percent reads against them, and a value outside them is held to the nearer one |
| PG6 | `getValueLabel` | its text becomes `aria-valuetext` |
| PG7 | a value | the fill (`data-slot="progress-indicator"`) is shifted left by the share still to go |
| PG8 | the value changes | the ARIA values and markers follow |
