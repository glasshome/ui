# Tooltip: behaviour contract

Each line is one browser test in `tests/contracts/tooltip.contract.test.tsx`, named by its id. Tests read roles, names, ARIA relations, focus and geometry, never classes. Baseline written on Kobalte before Tooltip moved onto `registerLayer`, `createAnchored` and `createPresence`; the behaviour is the same on both.

| id | when | then |
|---|---|---|
| TT1 | mounted | no `tooltip` exists |
| TT2 | the pointer rests on the trigger | one `tooltip` with the content's text opens and the trigger's `aria-describedby` names it |
| TT3 | the trigger takes focus from the keyboard | the `tooltip` opens |
| TT4 | Escape with the tooltip open | the `tooltip` closes |
| TT5 | the pointer moves to another button | the `tooltip` closes |
| TT6 | the trigger is pressed | the `tooltip` closes |
| TT7 | open | it sits below the trigger, inside the viewport |
| TT8 | `Tooltip.Portal` wraps the content | the page gains one element and no empty wrapper, since the content portals itself |
| TT9 | the trigger leaves the page while the tooltip is open | the `tooltip` closes |
