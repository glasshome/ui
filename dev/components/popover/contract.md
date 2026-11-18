# Popover: behaviour contract

Each line is one browser test in `tests/contracts/popover.contract.test.tsx`, named by its id. Tests read roles, names, ARIA relations, focus, geometry and `data-*` markers, never classes. Baseline written on Kobalte before Popover left it. The panel portals to `document.body`, or to the nearest portal mount in a shadow root.

| id | when | then |
|---|---|---|
| P1 | mounted | the trigger is a `button` with `data-slot="popover-trigger"`, `aria-haspopup="dialog"`, `aria-expanded="false"` and `data-closed`; no `dialog` exists |
| P2 | the trigger is pressed | one `dialog` with `data-slot="popover-content"` and `data-expanded` opens; the trigger has `aria-expanded="true"`, `data-expanded` and `aria-controls` naming the dialog |
| P3 | it opens | focus moves to the first control in the panel |
| P4 | Escape with the panel open | the panel closes and focus returns to the trigger |
| P5 | the trigger is pressed again, where the panel leaves it uncovered (`placement="top"`) | the panel closes and focus returns to the trigger |
| P6 | a press outside, on nothing that takes focus | the panel closes and focus returns to the trigger, once the press has left focus on the page (Kobalte left it there) |
| P7 | a press outside, on a control that takes focus | the panel closes and focus stays on that control |
| P8 | focus leaves the panel (Shift+Tab to the page) | the panel closes |
| P9 | inside a dialog | Escape and a press on the dialog's body close only the panel; the dialog stays open and focus stays in it |
| P10 | inside a closed shadow root | P2 to P4 hold there, with the panel in the same root |
| P11 | open | the panel's top edge sits on the trigger's top edge, so it covers the trigger, and it stays inside the viewport |
| P12 | the page scrolls with the panel open | the panel follows its trigger |
| P13 | `modal` | everything outside the panel is hidden from assistive technology, Tab stays in the panel, the page takes no pointer events, and a press outside closes it and returns focus to the trigger |
| P14 | a `PopoverAnchor` around the control that opens it | the panel sits over the anchor, and focus returns to that control on close |
| P15 | `Popover.Title` and `Popover.Description` inside the panel | the `dialog` is named by the title and described by the description |
| P16 | controlled by `open` and `onOpenChange` | a press reports the next state, and a refused close keeps the panel open |
