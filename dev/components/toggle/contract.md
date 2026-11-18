# Toggle: behaviour contract

Each line is one browser test in `tests/contracts/toggle.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and `data-*` markers, never classes. Baseline written on Kobalte before Toggle left it.

| id | when | then |
|---|---|---|
| TO1 | mounted | a native `button` per toggle with `data-slot="toggle"`; a pressed one has `aria-pressed="true"` and `data-pressed`, the others `aria-pressed="false"` and no `data-pressed` |
| TO2 | pressed, then pressed again | the first press presses it, the second releases it |
| TO3 | Space or Enter on the focused toggle | each key flips it |
| TO4 | `disabled` | it carries `disabled` and `data-disabled`, and a press changes nothing |
| TO5 | controlled by `pressed` and `onChange` | a press reports the next state through `onChange`, and the toggle shows only what `pressed` says |
| TO6 | children given as a function | the function reads the current pressed state |
| TO7 | inside a closed shadow root | TO2 holds there too. Gap: Kobalte toggles from a delegated `onClick`, which the document cannot see inside the root, so a press changes nothing (`2026-11-15-kobalte-collections-dead-in-closed-shadow-roots`) |
