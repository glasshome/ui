# polymorphic: behaviour contract

Each line is one browser test in `tests/contracts/polymorphic.contract.test.tsx`, named by its id. `src/lib/behavior/polymorphic.tsx` is the only place ui renders a swappable element.

| id | when | then |
|---|---|---|
| AS1 | no `as` | renders `defaultAs` with every other prop |
| AS2 | `as` is a tag or a component | renders it with every other prop; `as` and `defaultAs` never reach the DOM |
| AS3 | the rendered element is a `button` with no `type` | it has `type="button"`; any other element gets no `type` |
| AS4 | a `ref` is passed | it receives the rendered element |
