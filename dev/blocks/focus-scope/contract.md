# focus-scope: behaviour contract

Each line is one browser test in `tests/contracts/focus-scope.contract.test.tsx`, named by its id. `src/lib/behavior/focus-scope.ts` holds `createFocusScope` and `focusWithoutTracking`, the one door ui focuses through. A trapped scope lets native Tab run and recovers focus from a `focusout` on its container; it reads no layout.

| id | when | then |
|---|---|---|
| FO1 | the scope activates | focus lands on `initialFocus`: the container, its first candidate that takes focus, or the chosen element |
| FO2 | trapped, Tab on the last candidate / Shift+Tab on the first | focus wraps to the first / last; inside the container Tab follows the browser's native order |
| FO3 | a candidate is `display: none` or inside `hidden` | Tab skips it; no `offsetParent`, `getComputedStyle` or rect read happens |
| FO4 | the scope deactivates | focus returns to the element focused before activation, if still connected; when another scope activated in the same tick, focus stays in the new one |
| FO5 | `skipRestore()` ran before deactivation | focus stays where it is |
| FO6 | inside a closed shadow root | FO1, FO2 and FO4 hold |
| FO7 | a focus handler writes a signal the activating effect reads | the scope activates once |
| FO8 | trapped, a RadioGroup of three items inside | Tab enters the group once and the next Tab leaves it |
| FO9 | trapped, a focusable inside an open shadow root nested in the container | Tab reaches it and Tab again moves on inside the container |
| FO10 | trapped, the focused control is removed and focus falls to `body` | focus returns to the container |
| FO11 | the `active` accessor re-evaluates to the answer it already gave | nothing refocuses and nothing restores; the scope acts only on a real false/true change |
| FO12 | a scope deactivates and another activates in the same tick | the first scope's trigger receives no focus: the restore runs in a microtask, is dropped when a newer scope activated, and the new scope restores to the first one's target |
| FO13 | trapped, the container is removed while focus is inside it | keys still reach the page: the recovery waits a microtask and skips a container that left the document |
| FO14 | trapped, `untrap()`, focus moved to a button outside, then deactivated | focus stays on the outside button until the deactivation, which still restores to the element focused before |
| FO16 | focus sits in one shadow root and `focusedIn` reads a node in a sibling root | it answers null, as `ShadowRoot.activeElement` does; read in the focused root it answers the focused control |
