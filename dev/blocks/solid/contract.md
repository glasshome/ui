# solid: behaviour contract

Each line is one browser test in `tests/contracts/solid.contract.test.tsx`, named by its id. Blocks build on Solid 2's `createEffect`, `merge` and `omit` directly.

| id | when | then |
|---|---|---|
| SO1 | the toggle is pressed | the effect applies the new value to the element it reads: `aria-pressed` follows |
