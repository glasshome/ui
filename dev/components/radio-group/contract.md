# RadioGroup: behaviour contract

Each line is one browser test in `tests/contracts/radio-group.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and `data-*` markers, never classes. Baseline written on Kobalte before RadioGroup left it.

| id | when | then |
|---|---|---|
| RG1 | mounted | one `radiogroup` named by its label holds a `radio` per item named by its text; the `defaultValue` one is checked and its item carries `data-checked` |
| RG2 | an item is pressed | it is checked, the one before is cleared, focus is on it, and `onChange` reports its value once |
| RG3 | ArrowDown or ArrowUp on the focused radio | the next or previous enabled radio is focused and checked, wrapping at the ends |
| RG4 | Tab from before the group | focus lands on the checked radio; a second Tab leaves the group |
| RG5 | a disabled item | its radio is disabled, the item carries `data-disabled`, and a press changes nothing |
| RG6 | inside a form | every radio shares one `name`, and the form submits the checked value under it |
| RG7 | inside a closed shadow root | RG2 holds there too |
