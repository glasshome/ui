# OptionCard: behaviour contract

Each line is one browser test in `tests/contracts/option-card.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and `data-*` markers, never classes. Baseline written on Kobalte before OptionCard left it. A card press lands on its title: the radio is visually hidden in the card's clipped corner, where a press at its centre reaches nothing.

| id | when | then |
|---|---|---|
| OC1 | mounted | one `radiogroup` named by its label holds a `radio` per card, named by its title and description; the picked card (`data-slot="option-card"`) carries `data-checked`, a disabled one `data-disabled` |
| OC2 | a card is pressed | `onChange` reports its value, and the card is checked |
| OC3 | ArrowDown on the focused card | the next enabled card is picked, skipping a disabled one and wrapping at the end |
| OC4 | a card is pressed, the picked card included | `onPick` runs once per press |
| OC5 | `busy` | a press changes nothing and runs no `onPick` |
| OC6 | the picked card has sub-options | they form a `radiogroup` named "<title> options", the current one is `aria-checked="true"`, and a press reports the new one through `onSubChange` |
| OC7 | inside a closed shadow root | OC2 holds there too |
| OC8 | an arrow key, then Space | the arrow picks the next card without `onPick`; Space on the picked card runs `onPick` |
| OC9 | the group's `value` returns to `null` | no card shows picked |
