# ToggleGroup: behaviour contract

Each line is one browser test in `tests/contracts/toggle-group.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and `data-*` markers, never classes. Baseline written on Kobalte before ToggleGroup moved onto `createCollection`.

| id | when | then |
|---|---|---|
| TG1 | mounted | one `group` named by its label holds a `button` per item; the pressed one has `aria-pressed="true"` and `data-pressed`, the others `aria-pressed="false"` |
| TG2 | an unpressed item is pressed | it is pressed and the item pressed before is released |
| TG3 | the pressed item is pressed again | it is released and no item is pressed |
| TG4 | `multiple`, items are pressed | each press toggles its own item and leaves the others as they were |
| TG5 | a disabled item | carries `disabled` and `data-disabled`, and pressing it changes nothing |
| TG6 | ArrowRight or ArrowLeft on a focused item | focus moves to the next or previous enabled item, wrapping at the ends; no item is pressed or released |
| TG7 | Home or End | focus moves to the first or last enabled item |
| TG8 | Tab from before the group | focus lands on the pressed item; a second Tab leaves the group |
| TG9 | Enter or Space on a focused item | the item toggles |
| TG10 | inside a dialog or a closed shadow root | TG2 holds there too. Gap: in a closed shadow root the press selects nothing (`2026-11-15-kobalte-collections-dead-in-closed-shadow-roots`) |
