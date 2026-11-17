# solid: behaviour contract

Each line is one browser test in `tests/contracts/solid.contract.test.tsx`, named by its id. `src/lib/behavior/solid.ts` is the Solid 2 shaped effect, merge and omit every block builds on; the unit tests in `tests/behavior/solid.test.tsx` hold its edge cases.

| id | when | then |
|---|---|---|
| SO1 | the toggle is pressed | the effect applies the new value to the element it reads: `aria-pressed` follows |
