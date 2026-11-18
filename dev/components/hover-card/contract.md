# HoverCard: behaviour contract

Each line is one browser test in `tests/contracts/hover-card.contract.test.tsx`, named by its id. Tests read roles, names, focus, geometry and `data-*` markers, never classes. Baseline written on Kobalte before HoverCard left it. The card portals to `document.body`, or to the nearest portal mount in a shadow root.

| id | when | then |
|---|---|---|
| HC1 | mounted, the trigger rendered `as="button"` | the trigger is a `link` with `data-slot="hover-card-trigger"` that takes focus; no card exists |
| HC2 | the pointer rests on the trigger | after `openDelay` (700 ms by default) one card with `data-slot="hover-card-content"` and `data-expanded` opens; focus does not move |
| HC3 | the trigger takes focus from the keyboard | the card opens and focus stays on the trigger |
| HC4 | the pointer moves from the trigger onto the card | the card stays open |
| HC5 | the pointer moves to another control | after `closeDelay` (300 ms by default) the card closes |
| HC6 | Tab moves focus off the trigger | the card closes |
| HC7 | a touch on the trigger | no card opens, the focus that follows the tap included (Kobalte opened it from that focus) |
| HC8 | Escape with the card open | the card closes |
| HC9 | a press outside | the card closes |
| HC10 | inside a closed shadow root | HC2 holds there, with the card in the same root |
| HC11 | open | the card sits below the trigger, inside the viewport |
