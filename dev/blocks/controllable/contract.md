# controllable: behaviour contract

Each line is one browser test in `tests/contracts/controllable.contract.test.tsx`, named by its id. `src/lib/behavior/controllable.ts` is the state helper BottomSheet, ResponsiveDialog and Switch share. Controlled means `value()` is not `undefined`, judged on each read.

| id | when | then |
|---|---|---|
| CS1 | uncontrolled, set to a new value | the getter returns it; `onChange` runs once with it |
| CS2 | controlled, set to a new value | `onChange` runs once; the getter keeps the owner's value until the owner changes it |
| CS3 | set to the current value (by `equals`, default `Object.is`) | nothing runs |
| CS4 | the owner's value turns `undefined` | the getter returns the last value the setter stored |
