# Checkbox: behaviour contract

Each line is one browser test in `tests/contracts/checkbox.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and `data-*` markers, never classes. Baseline written on Kobalte before Checkbox left it.

| id | when | then |
|---|---|---|
| CB1 | mounted | one `checkbox` per box, named by its label; a checked one is checked and its root (`data-slot="checkbox"`) carries `data-checked` |
| CB2 | the label is pressed, then pressed again | the first press checks it, the second clears it, and focus is on the box |
| CB3 | Space on the focused box | each Space flips it |
| CB4 | `disabled` | the box is disabled, its root carries `data-disabled`, and a press changes nothing |
| CB5 | `indeterminate` | the box reads as mixed and its root carries `data-indeterminate` |
| CB6 | inside a form | a checked box submits its `name` as `on`, and a form reset puts back its `defaultChecked` |
| CB7 | controlled by `checked` and `onChange` | a press reports the next state through `onChange`, and the box shows only what `checked` says |
| CB8 | inside a closed shadow root | CB2 holds there too |
| CB9 | no label, only `aria-label` | the box is named by the `aria-label` |
