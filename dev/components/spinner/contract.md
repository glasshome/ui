# Spinner: behaviour contract

Each line is one browser test in `tests/contracts/spinner.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and animations, never classes.

| id | when | then |
|---|---|---|
| SP1 | mounted | one `status` named "Loading", outside the tab order |
| SP2 | mounted, with or without reduced motion | one infinite animation turns it: it shows progress, which WCAG 2.2.2 counts as essential |
| SP3 | given an `aria-label` | that label names the `status` in place of "Loading" |
